# Certificates managed by the panel

This fork issues TLS certificates itself and delivers them to nodes, instead of
leaving that to an external agent that writes into config profiles.

## The model

Three entities, in the shape Nginx Proxy Manager made familiar:

- **Credential** — how DNS challenges are answered. Reusable: many certificates
  share one.
- **Certificate** — domains, a credential, a CA and renewal settings. It is
  either issued by the panel or [imported](#importing-a-certificate-the-panel-did-not-issue);
  imported ones need no credential at all.
- **Binding** — which nodes get the certificate, and optionally which inbound
  tags on them.

A certificate is bound to **nodes**, not to a config profile. Several nodes can
share a profile, so writing a certificate into the profile would hand its private
key to every node using it — including nodes that never serve the name. Instead
the certificate is injected into the config of each bound node as it is sent.

## Setup

1. Generate the key that encrypts ACME secrets at rest and put it in the panel
   environment:

   ```bash
   cli generate-acme-key
   ```

   ```
   ACME_SECRET_KEY=<32 bytes, base64>
   ```

   It protects DNS credentials, ACME account keys and certificate private keys.
   It is separate from `APP_SECRET` on purpose: rotating the login secret should
   not make stored certificates unreadable. Changing it makes everything already
   stored unreadable — certificates would have to be re-issued.

   Without the key the pages still load, and every write answers with
   `ACME_SECRET_KEY is not set`.

2. Open **Management → Certificates → Credentials** and add one:

   | Provider | What the panel stores |
   | --- | --- |
   | `CLOUDFLARE` | API token (Zone:Read, DNS:Edit) |
   | `DESEC` | API token |
   | `DIGITALOCEAN` | API token |
   | `GANDI` | personal access token |
   | `HETZNER` | dns.hetzner.com API token |
   | `PORKBUN` | API key + secret API key |
   | `POWERDNS` | API URL, API key, server id |
   | `VULTR` | API key |
   | `CUSTOM` | URL and a client token of a DNS broker (see below) |
   | `MANUAL` | nothing |

   Every DNS provider token stored here can edit records in its zones, and the
   panel is an internet-facing service — that is the price of dns-01. Two ways
   around it: `CUSTOM`, which moves the real credential to a broker with its own
   domain policy, and `MANUAL`, which pairs with dns-persist-01 (one record
   published by hand, renewals need no DNS access at all; it cannot answer
   dns-01).

   The **Test** action reports whether the credential works, which zones it
   sees and — for brokers — which domains it may touch. Worth doing before the
   first issuance: an allow-list mismatch otherwise shows up as a failed order
   weeks later.

3. Add a certificate. It defaults to a **staging** CA: rehearse a new name there
   first, then switch to production. Staging endpoints for every supported CA are
   in the list.

4. Bind it to nodes and press **Issue now**. The order runs in the background;
   the status and the log in the details drawer show what happened.

## The custom provider protocol

A `CUSTOM` credential points at any HTTP service implementing four endpoints.
All requests carry `Authorization: Bearer <token>` and JSON bodies; errors come
back as `{"error": "<machine_code>", "message": "<text>"}`.

| Method and path | Body | Semantics |
| --- | --- | --- |
| `POST /v1/dns-01/present` | `{"fqdn": "_acme-challenge.a.example.com", "value": "<txt>"}` | create the TXT record; must be idempotent for the same pair |
| `POST /v1/dns-01/cleanup` | same | remove it; a record that is already gone is not an error |
| `PUT /v1/persist` | `{"fqdn": "_validation-persist.a.example.com", "value": "..."}` | upsert the dns-persist-01 record (one per name) |
| `GET /v1/policy` | — | optional; what the **Test** action shows: `{"allow": [...], "provider": {"name", "type", "zones": [...]}}` |

The broker decides which names the token may touch and holds the real DNS
credential; the panel never sees it. A ready-made implementation is
[acme-proxy](https://github.com/nd4y/acme-proxy); its README specifies
[the same protocol from the broker side](https://github.com/nd4y/acme-proxy#the-protocol)
— response shapes, status codes and which endpoints an alternative broker
may omit.

## Importing a certificate the panel did not issue

Not every certificate comes from ACME: some are bought, some come from an
internal CA, some are already being renewed by something else. Such a
certificate can be uploaded and delivered to nodes like any other.

In the UI: **Certificates → Import**. Both fields take PEM text, and **From
file** simply reads a file into the same field — pasting and uploading end up in
the same place.

Over the API it is one JSON body, so scripts do not need multipart:

```bash
curl -X POST https://panel.example.com/api/acme/certificates/import \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --arg name edge-wildcard \
        --rawfile cert fullchain.pem --rawfile key privkey.pem \
        '{name: $name, fullchainPem: $cert, privateKeyPem: $key,
          nodes: [{nodeUuid: "…", inboundTags: []}]}')"
```

What the panel does with it:

- **reads the certificate instead of trusting the request** — domains come from
  SAN, validity and key type from the certificate itself, so nothing here can be
  described wrongly;
- **checks the key belongs to the certificate.** A mismatched pair is accepted by
  every text field in the world and only fails later, on the node, as a handshake
  error nobody connects back to this import;
- stores the key encrypted, exactly like an issued one, and restarts the bound
  nodes so the material is delivered immediately.

An expired certificate is accepted — sometimes that is what an operator is
repairing — but it is recorded as an error in the log rather than passing
silently. Password-protected keys are rejected: decrypt the key first.

Imported certificates are **never renewed by the panel**: it has no way to renew
what it did not issue. There is no *Issue* action for them; instead
`POST /api/acme/certificates/{uuid}/import` replaces the material, which is how
such a certificate is rotated. The scheduler skips them entirely.

## Renewals

An hourly job queues certificates that are inside their renewal window, have
never been issued, or failed with the backoff expired. After a successful order,
every bound node is restarted so it picks the new certificate up.

The certificate fingerprint is mixed into the config hash the node compares
against its previous one. Without that a renewal would change nothing the node
can see — the profile is identical — and the new certificate would sit in the
panel unused.

## dns-persist-01

`dns-persist-01` (draft-ietf-acme-dns-persist) replaces the per-issuance TXT
record with a persistent authorization record bound to the ACME account. Once
published, issuance and renewal need no DNS access at all.

The details drawer shows the record to publish and can publish it through the
certificate's credential. For a wildcard the record goes on the **base** name
without the asterisk, with `policy=wildcard` in the value; the asterisk in the
record name is a name the CA never asks for.

As of 2026-08 Let's Encrypt supports it on staging only; a production order is
refused by the CA with a clear message in the certificate log.

## Failures

Every attempt is recorded on the certificate: `lastError`, `failCount` and
`nextRetryAt`, plus an entry in its log. Retries back off, doubling up to a day,
so a broken credential still retries daily instead of hammering the CA.

Challenge records are removed whether the order succeeded or not.
