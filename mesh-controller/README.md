# Optional WireGuard mesh (proposal)

This opt-in service connects Remnawave nodes with a WireGuard overlay. When a direct
link fails, agents select a mutually reachable transit node without changing the
client-facing inbound, subscription or user credential. The panel exposes authenticated
administrator endpoints; node agents own the routing table and continue forwarding
if the panel or controller is unavailable.

This is an API-first proposal. There is no dashboard change in the frontend repository.
No database migration, new default background connection or privileged panel container
is required. Remove `MESH_CONTROLLER_URL` to disable the panel integration (mesh endpoints
return 503); the normal panel API continues working.

## Architecture

- `meshctl/`: Python controller, TLS probes, durable operations and etcd membership.
- `agent/meshagent.py`: a Linux node agent; one WireGuard interface per peer, `/32`
  overlay routes, bidirectional health observations, deterministic transit selection
  and hysteresis. WireGuard private keys stay on the node.
- etcd: leased observations, inventory and operation journals. Three voting members
  are recommended; membership changes use learners, verified mTLS and persistent
  controller state. Removal refuses to leave fewer than three voting members.
- `agent/meshfwd.py`: optional DNAT relays. Explicit overlay-source SNAT ensures the
  return path works when a direct link has failed and packets traverse another node.
- `src/modules/mesh/`: administrator-only panel bridge with validated request bodies,
  fixed controller destination, bounded responses, timeouts and no redirect following.

The overlay currently reserves `10.88.0.0/24` and `10.89.0.0/16`; check for address
collisions before provisioning. This is one mesh per controller, IPv4, at most one
transit hop. MTU is 1280. UDP must be reachable between members. Country pool selection
and client entry load balancing are separate concerns and are not implemented here.
The optional balancer adapter is inactive unless explicitly configured; upstream has
no `/api/balancers` endpoint. Do not enable `auto_balancer` on an upstream-only panel.

## Configuration and permissions

The integration is disabled unless both panel environment variables are configured:

| Variable                | Purpose                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `MESH_CONTROLLER_URL`   | HTTP(S) origin, e.g. `http://mesh-controller:8080`; no URL credentials, path or query |
| `MESH_CONTROLLER_TOKEN` | At least 32 characters; matches the controller's `MESH_API_TOKEN`                     |

Build the controller with `docker build -t remnawave-mesh-controller:local mesh-controller`.
Run it on a private container network, without publishing port 8080, with:

| Controller variable/mount                  | Purpose                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `MESHCTL_CONFIG=/config/config.yaml`       | Read-only config based on `config.example.yaml`                                                   |
| `MESHCTL_KEY=/secrets/id_ed25519`          | Read-only controller SSH private key                                                              |
| `MESHCTL_KNOWN_HOSTS=/secrets/known_hosts` | Independently verified host keys; unknown/changed hosts are rejected, including during onboarding |
| `MESHCTL_STATE_DIR=/state`                 | Persistent writable volume owned by UID 10001; operation recovery and discovery                   |
| `MESH_API_TOKEN`                           | Authenticates status and management requests                                                      |
| `REMNAWAVE_URL`, `REMNAWAVE_API_TOKEN`     | Optional panel API origin/token, only for explicitly enabled host/API automation                  |
| `/etcd-tls`                                | Optional CA/issuer material for managed mTLS membership; keep private, outside Git                |

The controller container runs as UID 10001 and needs neither host networking nor
NET_ADMIN. Node agents require root (or passwordless sudo), Python 3, WireGuard tools
and iptables on **Linux**. SSH access is administrative: onboarding installs the
controller public key and a system service. A node must already have an independently
verified entry in `known_hosts`; no automatic host-key acceptance occurs.

Start with all `auto_*` flags false. A configured relay may explicitly change host
addresses/ports; inspect its journal and enable only after proving the overlay path.
Shared host records are not rewritten as single-node relays. User UUIDs and inbound
bindings are preserved. Node onboarding credentials are forwarded only in the request
body, used once in memory and redacted from job errors. Do not enable HTTP body logging.

The legacy CLI `meshctl.provision` can bootstrap a development mesh with HTTP etcd;
that is **not** a production security recommendation. Use `meshctl.mtls` to migrate
before enabling membership changes. Never expose an unauthenticated etcd listener.

## Panel API

All routes below require an administrator browser session and the existing browser
client header. API-token roles are deliberately not granted mesh administration.

| Method | Route                    | Body                                                                                                                             |
| ------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/mesh/status`       | Health observations, overlay, routes, quorum and events                                                                          |
| POST   | `/api/mesh/probe`        | Empty object; schedule a probe cycle                                                                                             |
| POST   | `/api/mesh/flags`        | Optional boolean `auto_switch`, `auto_relay`, `auto_ip_update`; at least one                                                     |
| POST   | `/api/mesh/nodes`        | `name`, public IPv4 `host`, `role` (`entry`/`exit`), `user`, exactly one of `password`/`private_key`; optional `rw_node`, `etcd` |
| POST   | `/api/mesh/nodes/remove` | `name`                                                                                                                           |
| GET    | `/api/mesh/jobs/:id`     | Progress of a validated job ID                                                                                                   |
| POST   | `/api/mesh/relay`        | `exit`, `mode` (`auto`/`direct`/`relay`)                                                                                         |
| POST   | `/api/mesh/etcd`         | `name`, boolean `member`                                                                                                         |
| POST   | `/api/mesh/pin`          | `node`, boolean `pinned`; optional external balancer integration only                                                            |

The sidecar serves `/healthz` and `/metrics` for private monitoring. `/status`, job
reads and all management operations require `X-Mesh-Token`. It has no public HTML UI.
The panel never reflects raw controller error details or shares its token with browsers.

## Reproducible local Docker tests

The lab creates its own Docker network, containers, WireGuard/TLS keys and test account.
It uses no kubeconfig, external node, production database, registry push or deployment.
Docker Desktop runs the Linux kernel WireGuard interfaces inside its VM; only local
containers receive NET_ADMIN/NET_RAW. All secrets generated by the lab are ignored
under `lab/state/`; never commit that directory.

From the repository root:

```sh
docker build -t remnawave-mesh-lab:local -f mesh-controller/lab/Dockerfile mesh-controller
docker run --rm -v "$PWD/mesh-controller:/app" -w /app remnawave-mesh-lab:local python -m pytest tests -q
python3 mesh-controller/lab/test_lab.py

docker run --rm -v "$PWD:/opt/app" -w /opt/app node:24.22-trixie-slim sh -c \
  'npm ci --no-audit --no-fund && npm run migrate:generate && node --test test/mesh.test.cjs && npx tsc --noEmit'
docker build --target backend-build -t remnawave-mesh-backend-build:local .
python3 mesh-controller/lab/test_panel.py
```

The network test proves TLS traffic over direct WireGuard, automatic transit after
blocking the direct UDP pair, forwarding during etcd outage and recovery to direct.
The API test boots upstream PostgreSQL migrations/seed, Redis, the compiled API and
real controller; it verifies unauthenticated rejection, administrator access, request
validation, controller outage isolation and opt-out. Requests execute inside the isolated API container; no lab service publishes a host port.
The lab's single HTTP etcd is isolated on an internal Docker network and has **no host
port**; it does not prove production mTLS quorum changes or remote systemd onboarding.
Those behaviors have unit tests, not a multi-host acceptance test in this proposal.

`Dockerfile.panel` is intentionally API-only and derives from the original Dockerfile's
`backend-build` stage. It does not test frontend assets/validators. The normal Dockerfile
remains unchanged; it additionally downloads external frontend/validator assets.

Cleanup only this lab's containers/network (no existing Docker volumes are removed):

```sh
docker compose -p rw-mesh-lab -f mesh-controller/lab/compose.yaml \
  -f mesh-controller/lab/compose.panel.yaml down --remove-orphans
```

For production rollback, disable automation flags first and restore any managed host
records using their relay journal while etcd is still reachable. Then unset the panel
integration and stop the controller. Agents and their existing WireGuard routes are
independent of that panel toggle; remove them only after traffic has moved off overlay.
Do not delete etcd state or rotate client keys as part of disabling the integration.
