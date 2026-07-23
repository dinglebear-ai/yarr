import type {
  ApplyYarrDiscoveryInput,
  ApplyYarrImportInput,
  SaveYarrConfigInput,
  YarrConfig,
  YarrConfigMutationResult,
  YarrControlAction,
  YarrDiscoveryResult,
  YarrImportPreview,
  YarrLogs,
  YarrRuntime,
  YarrUpdateResult,
  YarrUpdateStatus,
} from "./types";

declare global {
  interface Window {
    csrf_token?: string;
  }
}

const REQUEST_TIMEOUT_MS = 8_000;
const CSRF_WAIT_MS = 2_000;
const MAX_RESPONSE_BYTES = 1_000_000;
const SAFE_REQUEST_ERROR = "Unable to complete this request.";
const TIMEOUT_ERROR = "Request timed out.";
const ABORT_ERROR = "Request cancelled.";

const RUNTIME_FIELDS = `
  state pid version bindAddress port ready healthMessage uptimeSeconds
`;
const CONFIG_FIELDS = `
  plugin { enabled dashboardWidgetEnable bindMode customHost port authMode tailscaleServe tailscaleHostname logLevel updateChannel }
  services { service enabled baseUrl username hasPassword hasApiKey extra { key value } }
`;
const MUTATION_FIELDS = `
  config { ${CONFIG_FIELDS} }
  changed restarted rolledBack error
`;

const YARR_RUNTIME_QUERY = `query YarrRuntime { yarrRuntime { ${RUNTIME_FIELDS} } }`;
const YARR_CONFIG_QUERY = `query YarrConfig { yarrConfig { ${CONFIG_FIELDS} } }`;
const SAVE_YARR_CONFIG_MUTATION = `mutation SaveYarrConfig($input: SaveYarrConfigInput!) {
  saveYarrConfig(input: $input) { ${MUTATION_FIELDS} }
}`;
const CONTROL_YARR_MUTATION = `mutation ControlYarr($action: YarrControlAction!) {
  controlYarr(action: $action) { ${RUNTIME_FIELDS} }
}`;
const YARR_DISCOVERY_QUERY = `query YarrDiscoveredServices {
  yarrDiscoveredServices {
    discoveryId
    candidates { candidateId source serviceId confidence reasons baseUrl hasCredential }
    errors { code message }
  }
}`;
const YARR_LOGS_QUERY = `query YarrLogs($lines: Int) {
  yarrLogs(lines: $lines) { lines truncated }
}`;
const UPDATE_FIELDS = `
  installedVersion packagedVersion availableVersion updateAvailable usingOverlay rollbackAvailable rolledBack cleanupPending recoveryIdentifier message
`;
const YARR_UPDATE_STATUS_QUERY = `query YarrUpdateStatus { yarrUpdateStatus { ${UPDATE_FIELDS} } }`;
const PREVIEW_YARR_IMPORT_MUTATION = `mutation PreviewYarrImport($input: PreviewYarrImportInput!) {
  previewYarrImport(input: $input) {
    previewId mappings { serviceId baseUrl hasUsername hasPassword hasApiKey urlRequired } warnings
  }
}`;
const APPLY_YARR_IMPORT_MUTATION = `mutation ApplyYarrImport($input: ApplyYarrImportInput!) {
  applyYarrImport(input: $input) { ${MUTATION_FIELDS} }
}`;
const APPLY_YARR_DISCOVERY_MUTATION = `mutation ApplyYarrDiscovery($input: ApplyYarrDiscoveryInput!) {
  applyYarrDiscovery(input: $input) { ${MUTATION_FIELDS} }
}`;
const UPDATE_YARR_BINARY_MUTATION = `mutation UpdateYarrBinary($version: String!) {
  updateYarrBinary(version: $version) { ${UPDATE_FIELDS} }
}`;
const RESET_YARR_BINARY_MUTATION = `mutation ResetYarrBinary {
  resetYarrBinary { ${UPDATE_FIELDS} }
}`;
const ROLLBACK_YARR_BINARY_MUTATION = `mutation RollbackYarrBinary {
  rollbackYarrBinary { ${UPDATE_FIELDS} }
}`;

type GraphQLBody = { data?: Record<string, unknown>; errors?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function abortError(message: string): Error {
  return new DOMException(message, "AbortError");
}

async function waitForCsrfToken(signal: AbortSignal): Promise<void> {
  if (window.csrf_token || signal.aborted) {
    if (signal.aborted) throw abortError(ABORT_ERROR);
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const interval = window.setInterval(() => {
      if (window.csrf_token) finish(resolve);
    }, 20);
    const deadline = window.setTimeout(() => finish(resolve), CSRF_WAIT_MS);
    const onAbort = () => finish(() => reject(abortError(ABORT_ERROR)));
    const finish = (callback: () => void) => {
      window.clearInterval(interval);
      window.clearTimeout(deadline);
      signal.removeEventListener("abort", onAbort);
      callback();
    };

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function readJson(response: Response): Promise<GraphQLBody> {
  const body = response.body;
  if (!body) throw new Error(SAFE_REQUEST_ERROR);

  const contentLength = response.headers.get("content-length");
  if (contentLength && /^(?:0|[1-9]\d*)$/.test(contentLength)) {
    const length = Number(contentLength);
    if (Number.isSafeInteger(length) && length > MAX_RESPONSE_BYTES) {
      try {
        await body.cancel();
      } catch {
        // The user-safe error below is the only result exposed to callers.
      }
      throw new Error(SAFE_REQUEST_ERROR);
    }
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_RESPONSE_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The response has already crossed its trusted size boundary.
        }
        throw new Error(SAFE_REQUEST_ERROR);
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof Error && error.message === SAFE_REQUEST_ERROR) throw error;
    throw new Error(SAFE_REQUEST_ERROR);
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const json: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!isRecord(json)) throw new Error(SAFE_REQUEST_ERROR);
    return json;
  } catch {
    throw new Error(SAFE_REQUEST_ERROR);
  }
}

async function cancelResponseBody(body: ReadableStream<Uint8Array> | null): Promise<void> {
  if (!body) return;
  try {
    await body.cancel();
  } catch {
    // Cancellation is best-effort and its implementation details are not user-facing.
  }
}

async function request<T>(document: string, variables?: Record<string, unknown>, callerSignal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  let httpFailed = false;
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort(abortError(TIMEOUT_ERROR));
  }, REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort(abortError(ABORT_ERROR));

  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    await waitForCsrfToken(controller.signal);
    if (controller.signal.aborted) throw abortError(ABORT_ERROR);
    const response = await fetch("/graphql", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": window.csrf_token ?? "",
      },
      body: JSON.stringify({ query: document, variables }),
      signal: controller.signal,
    });

    if (!response.ok) {
      httpFailed = true;
      await cancelResponseBody(response.body);
      controller.abort();
      throw new Error(SAFE_REQUEST_ERROR);
    }
    const body = await readJson(response);
    if (Array.isArray(body.errors) && body.errors.length > 0) throw new Error(SAFE_REQUEST_ERROR);
    if (!isRecord(body.data)) throw new Error(SAFE_REQUEST_ERROR);
    return body.data as T;
  } catch (error) {
    if (timedOut) throw new Error(TIMEOUT_ERROR);
    if (httpFailed) throw new Error(SAFE_REQUEST_ERROR);
    if (controller.signal.aborted) throw new Error(ABORT_ERROR);
    if (error instanceof Error && error.message === SAFE_REQUEST_ERROR) throw error;
    throw new Error(SAFE_REQUEST_ERROR);
  } finally {
    window.clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}

function result<T>(data: Record<string, unknown>, field: string): T {
  const value = data[field];
  if (!isRecord(value)) throw new Error(SAFE_REQUEST_ERROR);
  return value as T;
}

export async function queryYarrRuntime(signal?: AbortSignal): Promise<YarrRuntime> {
  return result<YarrRuntime>(await request<Record<string, unknown>>(YARR_RUNTIME_QUERY, undefined, signal), "yarrRuntime");
}

export async function queryYarrConfig(signal?: AbortSignal): Promise<YarrConfig> {
  return result<YarrConfig>(await request<Record<string, unknown>>(YARR_CONFIG_QUERY, undefined, signal), "yarrConfig");
}

export async function mutateYarrConfig(input: SaveYarrConfigInput, signal?: AbortSignal): Promise<YarrConfigMutationResult> {
  return result<YarrConfigMutationResult>(
    await request<Record<string, unknown>>(SAVE_YARR_CONFIG_MUTATION, { input }, signal),
    "saveYarrConfig",
  );
}

export async function controlYarr(action: YarrControlAction, signal?: AbortSignal): Promise<YarrRuntime> {
  return result<YarrRuntime>(
    await request<Record<string, unknown>>(CONTROL_YARR_MUTATION, { action }, signal),
    "controlYarr",
  );
}

export async function queryYarrDiscovery(signal?: AbortSignal): Promise<YarrDiscoveryResult> {
  return result<YarrDiscoveryResult>(
    await request<Record<string, unknown>>(YARR_DISCOVERY_QUERY, undefined, signal),
    "yarrDiscoveredServices",
  );
}

export async function queryYarrLogs(lines: number, signal?: AbortSignal): Promise<YarrLogs> {
  const boundedLines = Math.max(1, Math.min(500, Math.trunc(lines)));
  return result<YarrLogs>(
    await request<Record<string, unknown>>(YARR_LOGS_QUERY, { lines: boundedLines }, signal),
    "yarrLogs",
  );
}

export async function queryYarrUpdateStatus(signal?: AbortSignal): Promise<YarrUpdateStatus> {
  return result<YarrUpdateStatus>(
    await request<Record<string, unknown>>(YARR_UPDATE_STATUS_QUERY, undefined, signal),
    "yarrUpdateStatus",
  );
}

export async function previewYarrImport(text: string, signal?: AbortSignal): Promise<YarrImportPreview> {
  return result<YarrImportPreview>(
    await request<Record<string, unknown>>(PREVIEW_YARR_IMPORT_MUTATION, { input: { text } }, signal),
    "previewYarrImport",
  );
}

export async function applyYarrImport(input: ApplyYarrImportInput, signal?: AbortSignal): Promise<YarrConfigMutationResult> {
  return result<YarrConfigMutationResult>(
    await request<Record<string, unknown>>(APPLY_YARR_IMPORT_MUTATION, { input }, signal),
    "applyYarrImport",
  );
}

export async function applyYarrDiscovery(input: ApplyYarrDiscoveryInput, signal?: AbortSignal): Promise<YarrConfigMutationResult> {
  return result<YarrConfigMutationResult>(
    await request<Record<string, unknown>>(APPLY_YARR_DISCOVERY_MUTATION, { input }, signal),
    "applyYarrDiscovery",
  );
}

export async function updateYarrBinary(version: string, signal?: AbortSignal): Promise<YarrUpdateResult> {
  return result<YarrUpdateResult>(
    await request<Record<string, unknown>>(UPDATE_YARR_BINARY_MUTATION, { version }, signal),
    "updateYarrBinary",
  );
}

export async function resetYarrBinary(signal?: AbortSignal): Promise<YarrUpdateResult> {
  return result<YarrUpdateResult>(
    await request<Record<string, unknown>>(RESET_YARR_BINARY_MUTATION, undefined, signal),
    "resetYarrBinary",
  );
}

export async function rollbackYarrBinary(signal?: AbortSignal): Promise<YarrUpdateResult> {
  return result<YarrUpdateResult>(
    await request<Record<string, unknown>>(ROLLBACK_YARR_BINARY_MUTATION, undefined, signal),
    "rollbackYarrBinary",
  );
}
