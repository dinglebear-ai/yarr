import {
  request as nodeRequest,
  type ClientRequest,
  type IncomingMessage,
  type RequestOptions,
} from "node:http";

export interface DockerError {
  code: "timeout" | "socket_unavailable" | "invalid_json" | "invalid_response" | "http_status" | "response_too_large" | "request_failed" | "budget_exceeded" | "deadline_exceeded";
  message: string;
}

export type DockerResult<T> =
  | { ok: true; data: T; bytesRead: number }
  | { ok: false; error: DockerError; bytesRead: number };
export interface DockerRequestOptions {
  timeoutMs?: number;
}
export type DockerRequestFactory = (
  options: RequestOptions,
  callback: (response: IncomingMessage) => void,
) => ClientRequest;

export type DockerContainer = Record<string, unknown>;

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

export class DockerService {
  constructor(private readonly requestFactory: DockerRequestFactory = nodeRequest) {}

  async listContainers(options: DockerRequestOptions = {}): Promise<DockerResult<DockerContainer[]>> {
    const result = await this.getJson("/containers/json", options);
    if (!result.ok) return result;
    if (!Array.isArray(result.data)) return invalidResponse(result.bytesRead);
    return { ok: true, data: result.data.filter(isRecord), bytesRead: result.bytesRead };
  }

  async inspectContainer(id: string, options: DockerRequestOptions = {}): Promise<DockerResult<DockerContainer>> {
    if (typeof id !== "string" || id.length === 0 || id.length > 256) return invalidResponse(0);
    const result = await this.getJson(`/containers/${encodeURIComponent(id)}/json`, options);
    if (!result.ok) return result;
    if (!isRecord(result.data)) return invalidResponse(result.bytesRead);
    return { ok: true, data: result.data, bytesRead: result.bytesRead };
  }

  private getJson(path: string, options: DockerRequestOptions): Promise<DockerResult<unknown>> {
    if (path !== "/containers/json" && !/^\/containers\/[^/]+\/json$/.test(path)) {
      return Promise.resolve(invalidResponse(0));
    }
    return new Promise((resolve) => {
      let settled = false;
      let bytes = 0;
      let request: ClientRequest;
      const finish = (result: DockerResult<unknown>) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      try {
        request = this.requestFactory(
          {
            socketPath: "/var/run/docker.sock",
            method: "GET",
            path,
            headers: { Accept: "application/json" },
            timeout: requestTimeout(options.timeoutMs),
          },
          (response) => {
            const status = response.statusCode ?? 0;
            if (status < 200 || status >= 300) {
              response.destroy();
              request.destroy();
              finish({
                ok: false,
                error: { code: "http_status", message: `Docker returned HTTP ${status}` },
                bytesRead: bytes,
              });
              return;
            }
            const chunks: Buffer[] = [];
            response.on("data", (chunk: Buffer | string) => {
              if (settled) return;
              const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
              bytes += buffer.length;
              if (bytes > MAX_RESPONSE_BYTES) {
                response.destroy();
                request.destroy();
                finish({
                  ok: false,
                  error: { code: "response_too_large", message: "Docker response exceeded 2 MiB" },
                  bytesRead: bytes,
                });
                return;
              }
              chunks.push(buffer);
            });
            response.on("end", () => {
              if (settled) return;
              try {
                finish({
                  ok: true,
                  data: JSON.parse(Buffer.concat(chunks).toString("utf8")),
                  bytesRead: bytes,
                });
              } catch {
                finish({
                  ok: false,
                  error: { code: "invalid_json", message: "Docker returned malformed JSON" },
                  bytesRead: bytes,
                });
              }
            });
            response.on("error", () => {
              finish({
                ok: false,
                error: { code: "request_failed", message: "Docker response failed" },
                bytesRead: bytes,
              });
            });
          },
        );
      } catch {
        finish({
          ok: false,
          error: { code: "request_failed", message: "Docker request failed" },
          bytesRead: bytes,
        });
        return;
      }
      request.on("timeout", () => {
        request.destroy();
        finish({
          ok: false,
          error: { code: "timeout", message: "Docker socket request timed out" },
          bytesRead: bytes,
        });
      });
      request.on("error", (error: NodeJS.ErrnoException) => {
        const unavailable = error.code === "ENOENT" || error.code === "EACCES" || error.code === "ECONNREFUSED";
        finish(unavailable
          ? {
            ok: false,
            error: { code: "socket_unavailable", message: "Docker socket is unavailable" },
            bytesRead: bytes,
          }
          : {
            ok: false,
            error: { code: "request_failed", message: "Docker request failed" },
            bytesRead: bytes,
          });
      });
      request.end();
    });
  }
}

function invalidResponse<T>(bytesRead: number): DockerResult<T> {
  return {
    ok: false,
    error: { code: "invalid_response", message: "Docker returned an invalid response" },
    bytesRead,
  };
}

function requestTimeout(value: number | undefined): number {
  return value === undefined || !Number.isFinite(value)
    ? 3000
    : Math.max(1, Math.min(3000, Math.floor(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
