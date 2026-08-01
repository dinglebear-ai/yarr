---
title: "OOM, disk, snippets, and artifact pressure"
created: 2026-07-16
updated: 2026-07-30
---

# OOM, disk, snippets, and artifact pressure

Owner: `@jmagar`

## Log backpressure

Any increase in `yarr_log_events_dropped_total` means the bounded async JSON
log pipeline lost events. `reason="queue_full"` indicates sustained producer
pressure; `writer_disconnected` indicates the file writer stopped accepting
events. Preserve stderr and the surviving JSON log, check disk/IO health and
writer errors, and reduce noisy log levels or ingestion pressure. Do not treat
the absence of dropped log lines as proof that the underlying request succeeded.

## Trigger

- Container OOM/restart, rising Code Mode concurrency, disk-space alert, or
  failed snippet/artifact writes.

## Triage

1. Capture `docker inspect yarr-mcp` state/restart/OOM fields and current image
   digest before restarting.
2. Check filesystem free space/inodes for the host data mount and `/tmp` tmpfs.
3. Inspect `~/.yarr/logs/yarr.log` size. The 10 MiB truncation check runs only
   at process startup, so a long-lived process can exceed it.
4. Inspect `~/.yarr/codemode/snippets/` and
   `~/.yarr/codemode/artifacts/` (or the same paths under `YARR_HOME`/`/data`).
   Snippets are atomic JSON records; artifacts are per-run files.
5. Correlate pressure with bounded Code Mode active/run and artifact metrics.

## Recovery

- Stop new expensive Code Mode work before killing the process.
- Archive or remove only confirmed stale artifacts; preserve snippet JSON
  records unless the owner approves deletion.
- Increase the container limit only after identifying legitimate steady-state
  demand. A repeated OOM after rollback is an application incident.
- Recreate from the prior image digest if pressure began with a deployment.

Verify `/ready`, a small Code Mode read, snippet list/load, and a bounded
artifact write after recovery.
