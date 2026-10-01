---
title: "Dependency advisory response"
created: 2026-07-16
updated: 2026-10-01
---

# Dependency advisory response

Owner: `@jmagar`

## Advisory exceptions

`deny.toml` enforces every advisory with an empty ignore list. The locked
`lab-auth` dependency uses the aws-lc JWT backend and no longer includes the
RustCrypto `rsa` crate, so its former timing-advisory exception is removed.
`scripts/check-security-exceptions.sh` accepts an empty ignore list; any future
exception must still declare a reviewed deadline and fails closed at expiry.

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
