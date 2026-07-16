# Caddy Proxy Example

Caddyfile configuration that mirrors the routing logic from `proxy/src/proxy.ts`.

## Routing table

| Paths | Target |
|---|---|
| `/oauth2*`, `/oidc*`, `/v1/oauth2*`, `/v2/oauth2*` | `PROXY_WSO_TARGET_URL` |
| `/services/*`, `/msa/*`, `/mf/*`, `/async/*`, `/processor/*`, `/content/*`, `/webauth/*`, `/routing/*` | `PROXY_TARGET_URL` |
| `/projects/*` | `PROXY_HCMS_TARGET_URL` |

## Automatic HTTPS

Caddy obtains and renews TLS certificates automatically via Let's Encrypt (ZeroSSL fallback). Ensure `example.com` DNS points to this server and ports 80/443 are open.

## Usage

```bash
# Load variables and run
set -a; source .env; set +a
caddy run --config ./Caddyfile --watch
```
