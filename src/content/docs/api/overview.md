---
title: odio API
description: A single REST API to control your entire audio stack.
---

[go-odio-api](https://github.com/b0bbywan/go-odio-api) bridges audio components — MPRIS players, PulseAudio/PipeWire, Bluetooth, systemd services, and power management — into a single REST API with real-time SSE events.

go-odio-api is part of the [odio project](https://beta.odio.love) but is a standalone project — it runs on any Linux system with a D-Bus user session, independently of the odio distribution. Written in Go, no dependencies beyond D-Bus. Cross-compiled binaries, deb/rpm packages, and [multi-arch Docker images](https://github.com/b0bbywan/go-odio-api/pkgs/container/go-odio-api) (`ghcr.io/b0bbywan/go-odio-api`) are available on [GitHub releases](https://github.com/b0bbywan/go-odio-api/releases), and via the [odio apt repository](https://github.com/b0bbywan/odio-apt-repo).

## Backends

Each backend maps to a Linux subsystem via D-Bus:

| Backend | What it does | Default |
|---|---|---|
| [MPRIS](/api/mpris/) | Auto-discovers and controls all media players | Enabled |
| [PulseAudio](/api/pulseaudio/) | Volume, mute, outputs, per-client control | Enabled |
| [Systemd](/api/systemd/) | Start/stop/restart whitelisted user services | Enabled |
| [Bluetooth](/api/bluetooth/) | A2DP sink — pair, power, discoverable mode | Enabled |
| [Power](/api/power/) | Remote reboot and power-off | Configurable |
| [Zeroconf](/api/zeroconf/) | mDNS/DNS-SD auto-discovery on the LAN | Enabled |

Disabling a backend removes all its routes from the API.

## Server info

```
GET /server
```

Returns enabled backends and server metadata.

## Real-time events

All backends emit changes as [SSE events](/api/events/). Connect once, filter by backend or event type, and react in real time.

```
GET /events
```

## Configuration

The odio installer generates `~/.config/odio-api/config.yaml`. You can edit it freely, but note that installer updates will overwrite it.

Each backend has its own config block — see the individual backend pages for details.

## Embedded web UI

The binary ships a built-in web UI at `/ui` — see [Embedded web UI](/guides/embedded-ui/) for details.

## Security model

The API has **no authentication**. It is designed for trusted local networks only — anyone on the network can control your node. This is a deliberate trade-off for simplicity, similar to most home audio devices.

Authentication may be added in the future if there is demand ([open an issue](https://github.com/b0bbywan/odios/issues)).

That said, all endpoints validate and sanitize their inputs. And because the stack runs in an unprivileged systemd user session, the attack surface is limited to what that user can do — no root, no system-level access. go-odio-api refuses to run as root. The only system-scope systemd unit exposed is `bluetooth.service`, in read-only (status monitoring only).
