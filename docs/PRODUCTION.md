# Production Infrastructure

Plexo runs on a single EC2 t4g.small (2 vCPU, 2 GB RAM) in `us-east-1`.

## Architecture

```
Internet → Caddy (auto-TLS) → API (NestJS :3000)
                              → Web (Next.js :3000)
                              → Redis (in-container)
                              → RDS PostgreSQL 16
```

## Container Memory Budget

| Service | Heap Limit | Container Limit | Swap Limit |
|---------|-----------|-----------------|------------|
| API     | 384 MB    | 512 MB          | 640 MB     |
| Web     | 256 MB    | 384 MB          | 512 MB     |
| Redis   | 128 MB    | 192 MB          | 192 MB     |
| Caddy   | —         | 64 MB           | 64 MB      |
| **Total** |         | **1,152 MB**    |            |

Leaves ~850 MB for the OS, Docker daemon, and build operations.

### Tuning the limits

- `--max-old-space-size` controls the V8 heap ceiling (API, Web)
- `--maxmemory` controls the Redis dataset ceiling; LRU eviction kicks in above 128 MB
- `mem_limit` / `memswap_limit` in `docker-compose.prod.yml` are hard kernel caps

If a container is OOM-killed, check `docker stats` under load before raising limits. The total must stay under ~1,800 MB to leave room for the OS.

## Caddy (Reverse Proxy)

Config: `Caddyfile`

Features:
- **Compression:** gzip + zstd on both domains
- **Security headers:** HSTS (preload), X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Server header removed
- **Static asset caching:** `/_next/static/*`, `/static/*`, logos, favicon get `Cache-Control: public, max-age=31536000, immutable`
- **Auto-TLS:** Caddy automatically obtains and renews Let's Encrypt certificates

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`:

1. SSH into EC2
2. `git pull` latest code
3. Build API image (sequentially to conserve memory)
4. Build Web image
5. Copy compose + Caddyfile to `/opt/plexo`
6. Run Prisma migration
7. Restart API, wait for `/health` to return JSON with `"status"`
8. Restart Web, wait for HTTP 200/302/307
9. Bring up remaining services (Caddy, Redis)
10. Prune old images and stale build cache

### Zero-downtime strategy

Services are restarted one at a time with `--no-deps`. Caddy continues proxying to the old container until the new one passes its health check. The final `up -d --remove-orphans` reconciles everything.

### If a deploy fails

The pipeline exits on any non-zero status (`script_stop: true`). If the API health check times out, the old containers remain running. SSH into EC2 and check:

```bash
cd /opt/plexo
docker compose -f docker-compose.prod.yml logs api --tail 50
docker compose -f docker-compose.prod.yml logs web --tail 50
```

## Security Hardening

- All containers run with `security_opt: [no-new-privileges:true]`
- API, Web, and Caddy use `read_only: true` filesystems with `/tmp` tmpfs
- Migrate service runs as `node` user (not root)
- Caddyfile is mounted read-only
- HEALTHCHECK removed from Dockerfiles to avoid conflicts with compose healthchecks

## EC2 OS Tuning

Run `scripts/ec2-tune.sh` once after provisioning a new instance:

- Creates 1 GB swap file
- Tunes kernel TCP parameters (somaxconn, syn backlog, tw_reuse, fin_timeout)
- Sets `vm.overcommit_memory=1` (required by Redis), `vm.swappiness=10`
- Raises file descriptor limits to 65535
- Caps journald disk usage at 100 MB

After running, reboot for `limits.conf` changes to take effect.

## Verification Checklist

After deploying, verify:

```bash
# Memory limits respected
docker stats --no-stream

# Compression working
curl -sI -H 'Accept-Encoding: gzip' https://app.plexoapp.com | grep -i content-encoding

# Security headers present
curl -sI https://app.plexoapp.com | grep -iE 'strict-transport|x-content-type|x-frame'

# Static assets cached
curl -sI https://app.plexoapp.com/_next/static/chunks/main.js | grep -i cache-control

# All containers healthy
docker compose -f docker-compose.prod.yml ps

# OS tuning applied (after running ec2-tune.sh)
swapon --show
sysctl net.core.somaxconn
ulimit -n
```
