---
title: SSE Events
description: Real-time event stream from all backends.
---

All backends push state changes as Server-Sent Events (SSE). Connect once and get a unified stream of everything happening on the node.

## Endpoint

```
GET /events
```

### Query parameters

| Parameter | Description | Example |
|---|---|---|
| `backend` | Only receive events from this backend | `?backend=mpris` |
| `types` | Only receive these event types | `?types=player.updated,player.added` |
| `exclude` | Exclude these event types | `?exclude=player.position` |
| `keepalive` | Keepalive interval | `?keepalive=30s` |

## Event types

| Event | Backend | Trigger |
|---|---|---|
| `player.updated` | mpris | Playback state, volume, or metadata change |
| `player.added` | mpris | New player appeared |
| `player.removed` | mpris | Player closed |
| `player.position` | mpris | Periodic position tick |
| `audio.updated` | pulseaudio | Sink input added or changed |
| `audio.removed` | pulseaudio | Sink input removed |
| `service.updated` | systemd | Unit state change |
| `bluetooth.updated` | bluetooth | Adapter or device state change |
| `power.action` | power | Reboot or power-off triggered |
