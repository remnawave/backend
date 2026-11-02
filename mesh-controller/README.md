# Optional WireGuard mesh

This opt-in service connects Remnawave nodes with a WireGuard overlay. When a direct
link fails, agents select a mutually reachable transit node without changing the
client-facing inbound, subscription or user credential. The panel exposes authenticated
administrator endpoints; node agents own the routing table and continue forwarding
if the panel or controller is unavailable.

The companion frontend provides the Mesh dashboard in the Nodes menu: automation,
a compact live link map, quorum health and membership, exits/relays, overlay matrix,
operation progress and the event journal. See https://github.com/remnawave/frontend/pull/478.
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
  controller state. Removing a voter below three deliberately stops etcd on every member. The mesh continues with a durable local journal; selecting at least three voters resumes a fresh mTLS cluster and archives the old data.
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
| `MESHCTL_KNOWN_HOSTS=/secrets/known_hosts` | Preconfigured verified host keys; new hosts additionally require an independently verified fingerprint supplied by the administrator |
| `MESHCTL_STATE_DIR=/state`                 | Persistent writable volume owned by UID 10001; operation recovery and discovery                   |
| `MESH_API_TOKEN`                           | Authenticates status and management requests                                                      |
| `REMNAWAVE_URL`, `REMNAWAVE_API_TOKEN`     | Optional panel API origin/token, only for explicitly enabled host/API automation                  |
| `/etcd-tls`                                | Optional CA/issuer material for managed mTLS membership; keep private, outside Git                |

The controller container runs as UID 10001 and needs neither host networking nor
NET_ADMIN. Node agents require root (or passwordless sudo), Python 3, WireGuard tools
and iptables on **Linux**. SSH access is administrative: onboarding installs the
controller public key and a system service. A new node requires either an independently verified entry in `known_hosts` or its
independently verified `SHA256:` host fingerprint in the onboarding form. The
controller checks the fingerprint before authentication, persists the public host
key under `/state/known_hosts`, and rejects mismatches. Fingerprints are not discovered
and silently trusted by the browser. No automatic host-key acceptance occurs.

Start with all `auto_*` flags false. A configured relay may explicitly change host
addresses/ports; inspect its journal and enable only after proving the overlay path.
Shared host records are not rewritten as single-node relays. User UUIDs and inbound
bindings are preserved. Node onboarding credentials are forwarded only in the request
body, used once in memory and redacted from job errors. Do not enable HTTP body logging.

Private IPv4 node addresses are refused unless the operator explicitly sets
`allow_private_nodes: true` (the isolated Docker lab does this). Loopback, link-local,
multicast and unspecified node addresses remain rejected.

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
| POST   | `/api/mesh/flags`        | Optional boolean `auto_switch`, `auto_relay`, `auto_ip_update`; at least one. `auto_balancer` requires an explicitly configured adapter                                                     |
| POST   | `/api/mesh/nodes`        | `name`, IPv4 `host`, `host_key_fingerprint`, `role` (`entry`/`exit`), `user`, exactly one of `password`/`private_key`; optional `rw_node`, `etcd` |
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
The managed UI lab below additionally exercises real SSH onboarding and real
multi-member etcd mTLS, learner promotion, voter removal and data preservation.
Production systemd/Docker service supervision is represented by a lab-only process
adapter; it runs the actual etcd and agent binaries and is never installed in production.

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

## Managed frontend acceptance lab

Build the companion frontend checkout with `npm ci` and `npm run start:build` in
a Node 24 Docker container, then pass its resulting `dist` folder explicitly:

```sh
python3 mesh-controller/lab/prepare_managed.py --frontend-dist ../frontend/dist
```

The UI is available at `http://127.0.0.1:33080`. Only the UI gateway publishes a
loopback port; node SSH, etcd, PostgreSQL and the controller remain on the internal
Docker network. The disposable lab-only password in the test harness must never
be reused on a public deployment. Start with the initial registration screen.

The lab's management adapter substitutes process supervision for systemd and nested
Docker, while running real SSH, real WireGuard agents and real etcd with peer/client
certificate verification. Through the dashboard, a fourth node was installed by SSH,
joined as an etcd learner, promoted, removed from quorum with its data retained, and
then removed from mesh. The lab also covers the three-to-two etcd pause, forwarding and live transit failover without etcd, controller restart, two-to-three resume, and explicit full mesh removal.

This lab uses a single Compose project. Tear down all of its services with:

```sh
docker compose -p rw-mesh-lab -f mesh-controller/lab/compose.yaml \
  -f mesh-controller/lab/compose.panel.yaml -f mesh-controller/lab/compose.managed.yaml \
  -f mesh-controller/lab/compose.ui.yaml down -v --remove-orphans
```

### Deliberately stopping etcd and removing mesh

Leaving an etcd role with fewer than three selected voters snapshots `/mesh/` into
`/state/standalone.json`, reconfigures agents to retain forwarding without etcd,
and stops etcd on **all** previous members. It never deletes their data. Keep the
controller state volume backed up: it is the authoritative settings journal in
this mode. The controller distributes live graph observations over verified SSH;
existing cached forwarding survives controller downtime, while new transit decisions
need either the controller or etcd to exchange fresh observations.

Selecting a third voter rebuilds a verified mTLS cluster, archives old data under
`/var/lib/etcd.pre-<generation>`, restores the latest inventory/settings, and reconnects
agents. Partial failures remain visible and can be retried. An unrelated existing
CA is never automatically replaced.

`POST /api/mesh/teardown` with `{ "confirm": "REMOVE_MESH" }` is a separate explicit
operation. It restores relayed hosts, stops agents/etcd, removes managed overlay
interfaces, firewall chains and agent configuration, and clears mesh inventory.
VPN nodes and retained etcd data are preserved. Offline cleanup targets remain in
the durable controller journal until a retry succeeds.

Run the managed lifecycle acceptance suite after preparing its lab:

```sh
python3 mesh-controller/lab/test_control_plane.py
```

### Security boundaries and recovery

Agents validate shared node names, IPv4 addresses, overlay ranges, WireGuard public
keys and discovered etcd endpoints before accepting a registry update. Privileged
agent network commands use argument arrays, never a shell. Controller inventory
and probe targets are validated independently; malformed shared state is rejected
without replacing the last accepted topology.

WireGuard peers accept only the overlay/link ranges. Owned `MESHAGENT_*` firewall
chains permit overlay transit and explicitly DNATed relay flows, and reject mesh
forwarding into unrelated private networks. Return relay traffic must belong to an
established DNAT connection. These rules preserve unrelated host firewall policy.

This is a single-owner mesh: enrolled nodes sharing etcd must be mutually trusted.
mTLS protects transport; per-node etcd RBAC is not provided. Validation prevents
shared records from becoming commands, but does not prevent a credentialed peer
from changing otherwise valid shared routing state. Do not use this as a boundary
between hostile tenants.

Individual removal persists an orphan cleanup target before unregistering a node,
restores interrupted relay operations, and uses the same owned-service/firewall
cleanup as full removal. Failed SSH cleanup remains visible and retryable after
controller restart. A learner or unfinished membership change must be resolved
before mesh-only removal.

IP updates are journaled in `/state/ip-updates.json`. The new SSH address must prove
the previously pinned host key before destinations change. Panel/DNS updates are
retried until completion, including after a lost reply or restart. Pending address
updates block removal and membership changes that could orphan their recovery.
An interrupted etcd resume recovers into a pending stop operation; standalone mode
is declared only after the selected members have stopped. Migration preserves each
agent's existing WireGuard key path.

Additional isolated acceptance tests (after the earlier setup/tests):

```sh
# After test_lab.py: private-network isolation, positive control, configured relay.
python3 mesh-controller/lab/test_security.py
# After test_empty_mesh.py: offline removal/retry, SSH address trust, migration,
# and a real controller crash while etcd is starting.
python3 mesh-controller/lab/test_review_recovery.py
```

The lab generates a distinct SSH host identity for every container at runtime.
