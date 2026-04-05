---
title: PulseAudio
description: Control volume, outputs, and per-client audio via PulseAudio or PipeWire.
---

The PulseAudio backend provides full control over the node's audio: server info, output selection, global and per-client volume/mute. Works with both PulseAudio and PipeWire (via `pipewire-pulse`).

Uses a pure-Go PulseAudio native protocol implementation — no `libpulse` dependency.

## Endpoints

### Combined state

```
GET /audio
```

Returns server info, outputs, and clients in a single response.

### Server

```
GET /audio/server
```

```
POST /audio/server/mute
POST /audio/server/volume
```

### Outputs (sinks)

```
GET /audio/outputs
```

```
POST /audio/outputs/{output}/default
POST /audio/outputs/{output}/mute
POST /audio/outputs/{output}/volume
```

### Clients (sink inputs)

```
GET /audio/clients
```

```
POST /audio/clients/{sink}/mute
POST /audio/clients/{sink}/volume
```

### PulseAudio cookie

```
GET /audio/cookie
```

Downloads the PulseAudio authentication cookie — useful for setting up network audio sinks.

## Events

| Event | Trigger |
|---|---|
| `audio.updated` | Sink input added or changed |
| `audio.removed` | Sink input removed |

## Configuration

```yaml
pulseaudio:
  enabled: true
  serve_cookie: true
```

`serve_cookie` exposes `GET /audio/cookie` — save the downloaded cookie on your client as `~/.config/pulse/cookie` with `600` permissions to enable network audio streaming.

## How it works

The backend connects to PulseAudio via its native protocol over the Unix socket. Real-time events are captured through PulseAudio's built-in monitoring mechanism.
