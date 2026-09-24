# @cryptoapis-io/mcp-aml

## 0.2.0

### Minor Changes

- 3167621: Security: the HTTP transport no longer serves unauthenticated callers with the operator's API key.

  Before, `--transport http --api-key <key>` listened on `0.0.0.0` and never authenticated the caller, so anyone who could reach the port could call every tool on the operator's key: spend their credits, and create, deactivate or delete their blockchain-event webhooks and HD-wallet syncs.

  - HTTP mode now listens on `127.0.0.1` by default, with DNS rebinding protection (Host header check).
  - Listening on a non-loopback address (`--host 0.0.0.0`) with a startup API key requires an auth token (`MCP_AUTH_TOKEN` or `--auth-token`); callers send `Authorization: Bearer <token>`. Without one the server refuses to start.
  - New `--allowed-hosts` restricts the Host header on non-loopback binds.
  - Per-request key mode (no startup key) now rejects requests without an `x-api-key` header with 401.
  - Stateful HTTP mode keeps one session per client; previously only the first client could ever connect.

  Breaking: clients connecting from another machine or container must now start the server with `--host 0.0.0.0` and an auth token. Reported by Syed Anas Mohiuddin.

### Patch Changes

- Updated dependencies [3167621]
  - @cryptoapis-io/mcp-shared@0.4.0
