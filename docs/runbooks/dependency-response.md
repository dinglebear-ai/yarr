---
title: "Dependency advisory response"
created: 2026-07-16
updated: 2026-07-30
---

# Dependency advisory response

Owner: `@jmagar`

## Time-bounded RSA exception

`deny.toml` temporarily ignores `RUSTSEC-2023-0071` for the transitive
`lab-auth` RSA signer. The reviewed exception expires on 2026-10-01.
`scripts/check-security-exceptions.sh` runs immediately before cargo-deny in
both PR CI and the scheduled audit and fails closed at the deadline. The target
resolution is migration of `lab-auth` JWT signing to Ed25519, not an automatic
deadline extension.

Interim controls are mandatory: HTTPS, restrictive signing-key permissions,
OAuth grant validation before signing, short-lived tokens, the process-local
30-attempt rolling-minute `/token` cap, token-issuance metrics/alerts, and a
reverse-proxy per-client `/token` rate limit. Treat loss of any control as an
incident requiring immediate reassessment of the exception.

## Trigger

The weekly Scheduled workflow or required `Cargo Deny` check fails.

## Reproduce

```bash
cargo deny --all-features check advisories
cargo deny --all-features check
```

Record the advisory ID, affected dependency path (`cargo tree -i <crate>`),
available patched version, and whether the vulnerable code is reachable.

## Response

- Prefer an upstream patched version and keep `Cargo.lock` changes scoped.
- A temporary deny exception requires an owner, reachability rationale, expiry,
  and follow-up issue; never suppress an advisory only to make CI green.
- Run the complete CI/MSRV/package checks before merge.
- Required main rules prevent merging while the advisory gate is red.
