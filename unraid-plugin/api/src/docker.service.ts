import {
  request as nodeRequest,
  type ClientRequest,
  type IncomingMessage,
  type RequestOptions,
} from "node:http";

export interface DockerError {
  code: "timeout" | "socket_unavailable" | "invalid_json" | "invalid_response" | "http_status" | "response_too_large" | "request_failed";
  message: string;
}

export type DockerResult<T> = { ok: true; data: T } | { ok: false; error: DockerError };
export type DockerRequestFactory = (
  options: RequestOptions,
  callback: (response: IncomingMessage) => void,
) => ClientRequest;

export type DockerContainer = Record<string, unknown>;

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

export class DockerService {
  constructor(private readonly requestFactory: DockerRequestFactory = nodeRequest) {}

  async listContainers(): Promise<DockerResult<DockerContainer[]>> {
    const result = await this.getJson("/containers/json");
    if (!result.ok) return result;
    if (!Array.isArray(result.data)) return invalidResponse();
    return { ok: true, data: result.data.filter(isRecord) };
  }

  async inspectContainer(id: string): Promise<DockerResult<DockerContainer>> {
    if (typeof id !== "string" || id.length === 0 || id.length > 256) return invalidResponse();
    const result = await this.getJson(`/containers/${encodeURIComponent(id)}/json`);
    if (!result.ok) return result;
    if (!isRecord(result.data)) return invalidResponse();
    return { ok: true, data: result.data };
  }

  private getJson(path: string): Promise<DockerResult<unknown>> {
    if (path !== "/containers/json" && !/^\/containers\/[^/]+\/json$/.test(path)) {
      return Promise.resolve(invalidResponse());
    }
    return new Promise((resolve) => {
      let settled = false;
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
            timeout: 3000,
          },
          (response) => {
            const status = response.statusCode ?? 0;
            if (status < 200 || status >= 300) {
              response.resume();
              finish({ ok: false, error: { code: "http_status", message: `Docker returned HTTP ${status}` } });
              return;
            }
            const chunks: Buffer[] = [];
            let bytes = 0;
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
                });
                return;
              }
              chunks.push(buffer);
            });
            response.on("end", () => {
              if (settled) return;
              try {
                finish({ ok: true, data: JSON.parse(Buffer.concat(chunks).toString("utf8")) });
              } catch {
                finish({ ok: false, error: { code: "invalid_json", message: "Docker returned malformed JSON" } });
              }
            });
            response.on("error", () => {
              finish({ ok: false, error: { code: "request_failed", message: "Docker response failed" } });
            });
          },
        );
      } catch {
        finish({ ok: false, error: { code: "request_failed", message: "Docker request failed" } });
        return;
      }
      request.on("timeout", () => {
        request.destroy();
        finish({ ok: false, error: { code: "timeout", message: "Docker socket request timed out" } });
      });
      request.on("error", (error: NodeJS.ErrnoException) => {
        const unavailable = error.code === "ENOENT" || error.code === "EACCES" || error.code === "ECONNREFUSED";
        finish(unavailable
          ? { ok: false, error: { code: "socket_unavailable", message: "Docker socket is unavailable" } }
          : { ok: false, error: { code: "request_failed", message: "Docker request failed" } });
      });
      request.end();
    });
  }
}

function invalidResponse<T>(): DockerResult<T> {
  return { ok: false, error: { code: "invalid_response", message: "Docker returned an invalid response" } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
