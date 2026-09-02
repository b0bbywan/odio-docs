---
title: Software upgrades in the odio API
description: An agnostic upgrade frontend, the API reads a detector's result file and triggers two systemd user units. Wire your own detector and upgrade script to the contract.
---

The upgrade backend is an **agnostic frontend**: the API implements neither detection nor upgrade logic. It reads a result file written by an external detector (current and latest version, availability) and can trigger two systemd **user** units, one to re-check, one to run the upgrade.

Capabilities are additive. The result file alone enables status reads (`GET /upgrade`); each configured unit enables its trigger (`POST /upgrade/check`, `POST /upgrade/start`). Configured units are registered as internal, triggerable but hidden from [`/services`](/api/systemd/) and the [event stream](/api/events/).

Added in [go-odio-api v0.15.0](https://github.com/b0bbywan/go-odio-api/releases/tag/v0.15.0). Opt-in, disabled by default. On a full [odio install](/operations/installation/) it is wired to the [odioctl](/operations/settings/) upgrade flow out of the box, see [How to upgrade odio](/operations/upgrade/).

## Configuration

```yaml
upgrade:
  enabled: true
  resultFile: /var/cache/odio/upgrades.json   # required; alone it enables read-only GET /upgrade
  checkUnit: odio-check-upgrade.service        # optional user unit, enables POST /upgrade/check
  upgradeUnit: odio-upgrade.service            # optional user unit, enables POST /upgrade/start
  # progressSocket default: $XDG_RUNTIME_DIR/odio-api/upgrade.sock
```

| Key | Role |
|---|---|
| `resultFile` | Path the detector writes its result to. Watched for changes; the source of truth for availability. |
| `checkUnit` | systemd user unit triggered by `POST /upgrade/check`. Omit to disable re-checks. |
| `upgradeUnit` | systemd user unit triggered by `POST /upgrade/start`. Omit for a read-only status badge. |
| `progressSocket` | Unix socket the upgrade script streams live progress to. Defaults under `$XDG_RUNTIME_DIR`, tmpfs, no SD-card writes. |

## Endpoints

### Status

```
GET /upgrade
```

Detector status, the run snapshot, and which triggers are available:

```jsonc
{
  "current": "2026.5.0b3",
  "latest": "2026.6.0b1",
  "upgrade_available": true,
  "checked_at": "2026-06-15T20:46:34Z",     // optional, RFC 3339
  "extra": { "roles": ["mpd"], "manifest": { "odios": "2026.6.0b1" } },
  "run": { "state": "running", "origin": "systemd", "percent": 42, "step": "mpd", "started_at": "2026-06-15T20:47:01Z" },
  "can_check": true,
  "can_upgrade": true
}
```

`run` is always present, its `state` is the verdict itself:

- `idle` — no run, or the last one succeeded; carries no live fields.
- `running` — a run is in flight, with live `percent` and `step`.
- `failed` — the last run failed; it stays `failed` until the next run starts.

`origin` is `systemd` for a unit-triggered run or `socket` for one started out of band (the CLI `odioctl upgrade apply`, adopted when its first progress line arrives). `started_at` and `finished_at` are RFC 3339 timestamps. `can_check` and `can_upgrade` reflect whether the matching unit is configured. `extra` carries any extra fields the detector wrote, passed through verbatim.

### Trigger a re-check

```
POST /upgrade/check
```

Starts the check unit. `202 Accepted` on trigger; the route exists only when `checkUnit` is set.

### Start an upgrade

```
POST /upgrade/start
```

Starts the upgrade unit. `202 Accepted` on trigger, `409 Conflict` if a run is already in progress, `502 Bad Gateway` if the systemd trigger itself fails. The route exists only when `upgradeUnit` is set.

## The contract

To build your own upgrade system, supply three pieces. The API wires them together.

### 1. The detector and its result file

A detector (a script on a timer, a daemon, anything) writes JSON to `resultFile`. The API watches the file and re-reads it on every change. Three fields are required; `checked_at` is optional and any other key is preserved under `extra`:

```jsonc
{
  "current": "2026.5.0b3",         // required
  "latest": "2026.6.0b1",          // required
  "upgrade_available": true,       // required
  "checked_at": "2026-06-15T20:46:34Z",   // optional; dropped if not RFC 3339
  "roles": ["mpd"]                 // anything else, surfaced under "extra"
}
```

A result file with no units configured is a complete, read-only setup: clients see status, nothing can be triggered.

The API never re-checks on its own, it only reads the file when it changes. Keep it current by running the detector on a **systemd timer** (odio ships `odio-check-upgrade.timer`, daily). `POST /upgrade/check` then just runs the same job on demand.

### 2. The check and upgrade units

`checkUnit` and `upgradeUnit` are ordinary systemd **user** units. The check unit re-runs detection (and rewrites `resultFile`); pair it with a timer for the scheduled refresh above. The upgrade unit performs the upgrade.

The run verdict comes from the **systemd job result**, which is authoritative and independent of anything the script reports. A non-zero exit means the run failed, regardless of progress messages.

Going through systemd also decouples the upgrade's lifecycle from the API. Because the unit runs independently, the upgrade can restart go-odio-api itself, likely when odio-api is among the updated packages, without losing the run: on startup the API reads the unit's state, and if it is still activating it re-announces `running` and waits for the verdict over the bus. A restart mid-upgrade is transparent to clients.

### 3. The progress socket

Live progress is streamed over a Unix socket rather than a file or the journal: progress is ephemeral, and on SD-card systems a socket avoids write wear. The upgrade script connects to `progressSocket` (both sides share the same default path) and writes **one JSON object per line**:

```jsonc
{"event": "begin",    "total": 7}
{"event": "progress", "percent": 42, "current": 3, "step": "mpd"}
{"event": "end",      "success": true}
```

`event` is required and must be `begin`, `progress`, or `end`; each event requires its own fields, and a line that doesn't match is dropped:

| Event | Required fields |
|---|---|
| `begin` | `total` (step count) |
| `progress` | `percent`, `current` (step index), `step` (name) |
| `end` | `success` |

Each line is relayed verbatim as an [`upgrade.progress`](#events) SSE event, so any extra field you add reaches clients untouched. The socket is optional, omit it for a unit that runs without live progress.

## Events

Both stream over [`GET /events`](/api/events/):

| Event | Trigger |
|---|---|
| `upgrade.info` | Detector status changed (result file rewritten), or the run's `state` changed (`running`, `idle`, `failed`) |
| `upgrade.progress` | A progress line from the upgrade script's socket |

The in-flight run is also mirrored under `run` in `GET /upgrade`, so a client connecting or reloading mid-upgrade still sees it.

## Security

Like the rest of the API, these endpoints have **no authentication**, see the [security model](/api/overview/#security-model). The upgrade unit runs in the unprivileged systemd user session, so it can do only what that user can. Keep the API on a trusted network.
