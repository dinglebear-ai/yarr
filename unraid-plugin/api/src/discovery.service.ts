import { isIP } from "node:net";

import type { SaveConfigResult } from "./config.service";
import type { SaveYarrConfigInput, SaveYarrServiceInput, SecretUpdate } from "./config.types";
import type {
  DockerContainer,
  DockerError,
  DockerRequestOptions,
  DockerResult,
} from "./docker.service";
import {
  DOCKER_ENDPOINT_LABEL_KEYS,
  DOCKER_IDENTITY_LABEL_KEYS,
  normalizeCatalogKey,
  normalizeServiceUrl,
  SERVICE_CATALOG,
  type ServiceCatalogEntry,
} from "./service-catalog";
import { ExpiringSessionStore, opaqueId, type SessionStoreOptions } from "./session-store";

export interface DockerReader {
  listContainers(options?: DockerRequestOptions): Promise<DockerResult<DockerContainer[]>>;
  inspectContainer(id: string, options?: DockerRequestOptions): Promise<DockerResult<DockerContainer>>;
}

export interface DiscoveryConfigWriter {
  save(input: SaveYarrConfigInput): Promise<SaveConfigResult>;
}

export interface DiscoveryCandidate {
  candidateId: string;
  source: "docker";
  serviceId: string;
  confidence: number;
  reasons: string[];
  baseUrl: string;
  hasCredential: boolean;
}

export interface DiscoveryPreview {
  discoveryId: string;
  candidates: DiscoveryCandidate[];
  errors: DockerError[];
}

export interface ApplyDiscoveryInput {
  discoveryId: string;
  selectedCandidateIds: string[];
  credentialConsent: Record<string, boolean>;
}

interface RetainedCandidate {
  candidateId: string;
  containerId: string;
  serviceId: string;
  confidence: number;
  reasons: string[];
  baseUrl: string;
}

interface DiscoverySession {
  candidates: Map<string, RetainedCandidate>;
}

interface Credentials {
  username?: string;
  password?: string;
  apiKey?: string;
}

interface Analysis {
  retained: RetainedCandidate;
  publicCandidate: DiscoveryCandidate;
  credentials: Credentials;
}

const MAX_DISCOVERY_CANDIDATES = 256;
const MAX_DISCOVERY_RESPONSE_BYTES = 8 * 1024 * 1024;
const MAX_DISCOVERY_SESSION_BYTES = 256 * 1024;
const DEFAULT_DISCOVERY_ELAPSED_MS = 10_000;
const MAX_CONTAINER_ID_LENGTH = 256;
const MAX_CONTAINER_NAME_LENGTH = 512;
const MAX_CONTAINER_IMAGE_LENGTH = 512;
const MAX_IDENTITY_LABEL_LENGTH = 256;

export interface DiscoveryServiceOptions extends SessionStoreOptions {
  maxElapsedMs?: number;
}

export class DiscoveryService {
  private readonly sessions: ExpiringSessionStore<DiscoverySession>;
  private readonly now: () => number;
  private readonly maxElapsedMs: number;

  constructor(
    private readonly docker: DockerReader,
    private readonly config: DiscoveryConfigWriter,
    options: DiscoveryServiceOptions = {},
  ) {
    this.sessions = new ExpiringSessionStore(options);
    this.now = options.now ?? Date.now;
    this.maxElapsedMs = positiveInteger(options.maxElapsedMs ?? DEFAULT_DISCOVERY_ELAPSED_MS);
  }

  async discover(): Promise<DiscoveryPreview> {
    const candidates: DiscoveryCandidate[] = [];
    const retained: RetainedCandidate[] = [];
    const errors: DockerError[] = [];
    const startedAt = this.now();
    let responseBytes = 0;
    let sessionBytes = 0;
    const listed = await this.docker.listContainers({
      timeoutMs: Math.min(3000, remainingTime(startedAt, this.maxElapsedMs, this.now)),
    });
    responseBytes += listed.bytesRead;
    if (responseBytes > MAX_DISCOVERY_RESPONSE_BYTES) {
      errors.push(budgetError("Docker discovery response byte budget exceeded"));
    } else if (elapsed(startedAt, this.now) >= this.maxElapsedMs) {
      errors.push(deadlineError());
    } else
    if (listed.ok) {
      for (const container of listed.data.slice(0, MAX_DISCOVERY_CANDIDATES)) {
        const remaining = remainingTime(startedAt, this.maxElapsedMs, this.now);
        if (remaining <= 0) {
          errors.push(deadlineError());
          break;
        }
        const containerId = boundedStringValue(container.Id, MAX_CONTAINER_ID_LENGTH);
        if (!containerId) continue;
        const inspected = await this.docker.inspectContainer(containerId, {
          timeoutMs: Math.min(3000, remaining),
        });
        responseBytes += inspected.bytesRead;
        if (responseBytes > MAX_DISCOVERY_RESPONSE_BYTES) {
          errors.push(budgetError("Docker discovery response byte budget exceeded"));
          break;
        }
        if (elapsed(startedAt, this.now) >= this.maxElapsedMs) {
          errors.push(deadlineError());
          break;
        }
        if (!inspected.ok) {
          errors.push(safeDockerError(inspected.error));
          continue;
        }
        const analysis = analyzeContainer(inspected.data, containerId);
        if (!analysis) continue;
        const candidateBytes = Buffer.byteLength(JSON.stringify(analysis.retained));
        if (sessionBytes + candidateBytes > MAX_DISCOVERY_SESSION_BYTES) {
          errors.push(budgetError("Docker discovery session payload budget exceeded"));
          break;
        }
        sessionBytes += candidateBytes;
        candidates.push(analysis.publicCandidate);
        retained.push(analysis.retained);
      }
    } else {
      errors.push(safeDockerError(listed.error));
    }
    const discoveryId = this.sessions.create({
      candidates: new Map(retained.map((candidate) => [candidate.candidateId, candidate])),
    });
    return { discoveryId, candidates, errors };
  }

  async apply(input: ApplyDiscoveryInput): Promise<SaveConfigResult> {
    const session = this.sessions.take(input.discoveryId);
    if (!session) throw new Error("invalid or expired discovery");
    const selectedIds = uniqueCandidateIds(input.selectedCandidateIds);
    const retained = selectedIds.map((candidateId) => {
      const candidate = session.candidates.get(candidateId);
      if (!candidate) throw new Error(`candidate ${candidateId} was not present in this discovery`);
      return candidate;
    });
    if (new Set(retained.map((candidate) => candidate.serviceId)).size !== retained.length) {
      throw new Error("only one Docker candidate may be selected per service");
    }

    const updates: SaveYarrServiceInput[] = [];
    const startedAt = this.now();
    let responseBytes = 0;
    for (const candidate of retained) {
      const remaining = remainingTime(startedAt, this.maxElapsedMs, this.now);
      if (remaining <= 0) throw new Error("Docker discovery apply time budget exceeded");
      const inspected = await this.docker.inspectContainer(candidate.containerId, {
        timeoutMs: Math.min(3000, remaining),
      });
      responseBytes += inspected.bytesRead;
      if (responseBytes > MAX_DISCOVERY_RESPONSE_BYTES) {
        throw new Error("Docker discovery apply response byte budget exceeded");
      }
      if (elapsed(startedAt, this.now) >= this.maxElapsedMs) {
        throw new Error("Docker discovery apply time budget exceeded");
      }
      if (!inspected.ok) throw new Error("selected Docker container could not be re-inspected");
      const fresh = analyzeContainer(inspected.data, candidate.containerId);
      if (
        !fresh ||
        fresh.retained.serviceId !== candidate.serviceId ||
        fresh.retained.baseUrl !== candidate.baseUrl ||
        urlOriginReason(fresh.retained.reasons) !== urlOriginReason(candidate.reasons)
      ) {
        throw new Error("Docker discovery candidate changed; run discovery again");
      }
      const consent = input.credentialConsent[candidate.serviceId] === true;
      updates.push({
        service: candidate.serviceId,
        enabled: true,
        baseUrl: fresh.retained.baseUrl,
        username: consent ? fresh.credentials.username : undefined,
        password: secretUpdate(fresh.credentials.password, consent),
        apiKey: secretUpdate(fresh.credentials.apiKey, consent),
      });
    }
    return this.config.save({ services: updates });
  }
}

function analyzeContainer(container: DockerContainer, containerId: string): Analysis | null {
  const config = recordValue(container.Config);
  const network = recordValue(container.NetworkSettings);
  const env = parseEnvironment(arrayValue(config.Env));
  const endpointLabels = selectedStringRecord(config.Labels, DOCKER_ENDPOINT_LABEL_KEYS, 2048);
  const identityLabels = selectedStringRecord(
    config.Labels,
    DOCKER_IDENTITY_LABEL_KEYS,
    MAX_IDENTITY_LABEL_LENGTH,
  );
  const image = boundedStringValue(config.Image, MAX_CONTAINER_IMAGE_LENGTH) ??
    boundedStringValue(container.Image, MAX_CONTAINER_IMAGE_LENGTH) ?? "";
  const name = boundedStringValue(container.Name, MAX_CONTAINER_NAME_LENGTH) ??
    arrayValue(container.Names)
      .map((value) => boundedStringValue(value, MAX_CONTAINER_NAME_LENGTH))
      .filter((value): value is string => value !== undefined)
      .join(" ")
      .slice(0, MAX_CONTAINER_NAME_LENGTH);
  const entry = identifyService(name, image, identityLabels, env);
  if (!entry) return null;
  const reasons: string[] = [];
  const identityText = `${name} ${image} ${Object.values(identityLabels).join(" ")}`.toLowerCase();
  if (entry.containerHints.some((hint) => identityText.includes(hint))) {
    reasons.push(`container identity matches ${entry.id}`);
  }
  if (hasCatalogEnvironment(entry, env)) reasons.push(`service environment matches ${entry.id}`);

  const resolved = resolveBaseUrl(entry, env, endpointLabels, network);
  if (!resolved) return null;
  reasons.push(resolved.reason);
  const identityScore = reasons.some((reason) => reason.startsWith("service environment")) ? 45 : 30;
  const confidence = Math.min(100, identityScore + resolved.score);
  const credentials = extractCredentials(entry, env);
  const candidateId = opaqueId();
  const retained: RetainedCandidate = {
    candidateId,
    containerId,
    serviceId: entry.id,
    confidence,
    reasons,
    baseUrl: resolved.baseUrl,
  };
  return {
    retained,
    publicCandidate: {
      candidateId,
      source: "docker",
      serviceId: entry.id,
      confidence,
      reasons: [...reasons],
      baseUrl: resolved.baseUrl,
      hasCredential: Object.values(credentials).some(hasValue),
    },
    credentials,
  };
}

function identifyService(
  name: string,
  image: string,
  labels: Record<string, string>,
  env: ReadonlyMap<string, string>,
): ServiceCatalogEntry | undefined {
  const identity = `${name} ${image} ${Object.keys(labels).join(" ")} ${Object.values(labels).join(" ")}`.toLowerCase();
  let best: { entry: ServiceCatalogEntry; score: number } | undefined;
  for (const entry of SERVICE_CATALOG) {
    let score = hasCatalogEnvironment(entry, env) ? 80 : 0;
    if (entry.containerHints.some((hint) => identity.includes(hint))) score += 40;
    if (!best || score > best.score) best = { entry, score };
  }
  return best && best.score > 0 ? best.entry : undefined;
}

function resolveBaseUrl(
  entry: ServiceCatalogEntry,
  env: ReadonlyMap<string, string>,
  labels: Record<string, string>,
  network: Record<string, unknown>,
): { baseUrl: string; reason: string; score: number } | null {
  const envUrl = firstEnvironmentValue(entry.urlKeys, env);
  const normalizedEnv = envUrl ? normalizeServiceUrl(envUrl) : null;
  if (normalizedEnv) return { baseUrl: normalizedEnv, reason: "URL found in container environment", score: 50 };

  for (const key of DOCKER_ENDPOINT_LABEL_KEYS) {
    const value = labels[key];
    if (value === undefined) continue;
    const expanded = expandUnraidUrl(value, entry, network);
    const normalized = expanded ? normalizeServiceUrl(expanded) : null;
    if (normalized) return { baseUrl: normalized, reason: "URL found in container label", score: 45 };
  }

  const published = publishedAddress(entry, network);
  if (published) return { baseUrl: published, reason: "published port maps service default", score: 35 };
  const address = networkAddress(entry, network);
  if (address) return { baseUrl: address, reason: "container network address uses service default port", score: 20 };
  return null;
}

function expandUnraidUrl(value: string, entry: ServiceCatalogEntry, network: Record<string, unknown>): string | null {
  if (!/^https?:\/\//i.test(value)) return null;
  let expanded = value;
  if (expanded.includes("[IP]")) {
    const ip = firstNetworkIp(network) ?? "127.0.0.1";
    expanded = expanded.replaceAll("[IP]", hostForUrl(ip));
  }
  expanded = expanded.replace(/\[PORT:(\d+)\]/g, (_match, internal: string) => {
    return publishedPort(network, Number(internal)) ?? internal;
  });
  if (expanded.includes("[PORT:") || expanded.includes("[IP]")) return null;
  return expanded;
}

function publishedAddress(entry: ServiceCatalogEntry, network: Record<string, unknown>): string | null {
  if (entry.defaultPort === null) return null;
  const port = publishedPort(network, entry.defaultPort);
  return port ? `http://127.0.0.1:${port}` : null;
}

function publishedPort(network: Record<string, unknown>, internalPort: number): string | null {
  const ports = recordValue(network.Ports);
  const bindings = arrayValue(ports[`${internalPort}/tcp`]);
  for (const binding of bindings) {
    const port = stringValue(recordValue(binding).HostPort);
    if (port && /^\d{1,5}$/.test(port) && Number(port) >= 1 && Number(port) <= 65535) return port;
  }
  return null;
}

function networkAddress(entry: ServiceCatalogEntry, network: Record<string, unknown>): string | null {
  if (entry.defaultPort === null) return null;
  const ip = firstNetworkIp(network);
  return ip ? `http://${hostForUrl(ip)}:${entry.defaultPort}` : null;
}

function firstNetworkIp(network: Record<string, unknown>): string | null {
  const networks = recordValue(network.Networks);
  for (const value of Object.values(networks)) {
    const details = recordValue(value);
    for (const candidate of [stringValue(details.IPAddress), stringValue(details.GlobalIPv6Address)]) {
      if (candidate && isIP(candidate) !== 0) return candidate;
    }
  }
  return null;
}

function extractCredentials(entry: ServiceCatalogEntry, env: ReadonlyMap<string, string>): Credentials {
  return {
    username: firstEnvironmentValue(entry.usernameKeys, env),
    password: firstEnvironmentValue(entry.passwordKeys, env),
    apiKey: firstEnvironmentValue(entry.apiKeyKeys, env),
  };
}

function hasCatalogEnvironment(entry: ServiceCatalogEntry, env: ReadonlyMap<string, string>): boolean {
  return [...entry.urlKeys, ...entry.usernameKeys, ...entry.passwordKeys, ...entry.apiKeyKeys]
    .some((key) => env.has(normalizeCatalogKey(key)));
}

function firstEnvironmentValue(keys: readonly string[], env: ReadonlyMap<string, string>): string | undefined {
  for (const key of keys) {
    const value = env.get(normalizeCatalogKey(key));
    if (hasValue(value)) return value;
  }
  return undefined;
}

function parseEnvironment(values: unknown[]): ReadonlyMap<string, string> {
  const env = new Map<string, string>();
  for (const item of values) {
    if (typeof item !== "string") continue;
    const separator = item.indexOf("=");
    if (separator <= 0) continue;
    env.set(normalizeCatalogKey(item.slice(0, separator)), item.slice(separator + 1));
  }
  return env;
}

function secretUpdate(value: string | undefined, consent: boolean): SecretUpdate {
  return consent && hasValue(value) ? { kind: "set", value } : { kind: "preserve" };
}

function uniqueCandidateIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("selectedCandidateIds must be an array of candidate IDs");
  }
  if (value.length > SERVICE_CATALOG.length) throw new Error("too many Docker candidates selected");
  if (new Set(value).size !== value.length) throw new Error("selectedCandidateIds must not contain duplicates");
  return value;
}

function recordValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function selectedStringRecord(
  value: unknown,
  allowedKeys: readonly string[],
  maxValueLength: number,
): Record<string, string> {
  const source = recordValue(value);
  return Object.fromEntries(
    allowedKeys.flatMap((key) => {
      const selected = boundedStringValue(source[key], maxValueLength);
      return selected === undefined ? [] : [[key, selected]];
    }),
  );
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function boundedStringValue(value: unknown, maxLength: number): string | undefined {
  const string = stringValue(value);
  return string !== undefined && string.length <= maxLength ? string : undefined;
}

function hostForUrl(host: string): string {
  return isIP(host) === 6 ? `[${host}]` : host;
}

function hasValue(value: string | undefined): value is string {
  return value !== undefined && value.length > 0;
}

function elapsed(startedAt: number, now: () => number): number {
  return Math.max(0, now() - startedAt);
}

function remainingTime(startedAt: number, maxElapsedMs: number, now: () => number): number {
  return Math.max(0, maxElapsedMs - elapsed(startedAt, now));
}

function budgetError(message: string): DockerError {
  return { code: "budget_exceeded", message };
}

function deadlineError(): DockerError {
  return { code: "deadline_exceeded", message: "Docker discovery time budget exceeded" };
}

function safeDockerError(error: DockerError): DockerError {
  const messages: Record<DockerError["code"], string> = {
    timeout: "Docker socket request timed out",
    socket_unavailable: "Docker socket is unavailable",
    invalid_json: "Docker returned malformed JSON",
    invalid_response: "Docker returned an invalid response",
    http_status: "Docker returned a non-success HTTP status",
    response_too_large: "Docker response exceeded 2 MiB",
    request_failed: "Docker request failed",
    budget_exceeded: "Docker discovery budget exceeded",
    deadline_exceeded: "Docker discovery time budget exceeded",
  };
  return { code: error.code, message: messages[error.code] };
}

function positiveInteger(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error("maxElapsedMs must be positive");
  return value;
}

function urlOriginReason(reasons: readonly string[]): string | undefined {
  return reasons.find((reason) =>
    reason.startsWith("URL found") ||
    reason.startsWith("published port") ||
    reason.startsWith("container network address")
  );
}
