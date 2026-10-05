---
title: PulseAudio volume control in the odio API
description: The PulseAudio backend controls server, output, and per-client volume and mute via a pure-Go native protocol, working with both PulseAudio and PipeWire.
---

The PulseAudio backend provides full control over the node's audio: server info, output selection, global and per-client volume/mute. Works with both PulseAudio and PipeWire (via `pipewire-pulse`).

Uses a pure-Go PulseAudio native protocol implementation — no `libpulse` dependency.

## Endpoints

### Combined state

```
GET /audio
```

Returns the server kind, outputs, and clients in a single response, each list in the same shape as its dedicated route below:

```jsonc
{
  "kind": "pulseaudio",
  "outputs": [ /* same as GET /audio/outputs */ ],
  "clients": [ /* same as GET /audio/clients */ ]
}
```

### Server

```
GET /audio/server
```
```json
{
  "kind": "pulseaudio",
  "default_sink": "alsa_output.platform-soc_sound.stereo-fallback",
  "volume": 1,
  "muted": false
}
```

`kind` is `pulseaudio` or `pipewire`. `volume` is a float from `0` to `1`.

```
POST /audio/server/mute
POST /audio/server/volume
```

### Outputs (sinks)

```
GET /audio/outputs
```
```jsonc
[
  {
    "id": 0,
    "name": "alsa_output.platform-soc_sound.stereo-fallback",
    "description": "Built-in Audio Stereo",
    "nick": "Built-in Audio Stereo",
    "muted": false,
    "volume": 1,
    "state": "running",
    "default": true,
    "driver": "module-alsa-card.c",
    "active_port": "analog-output",
    "props": {
      "alsa.card": "1",
      "alsa.card_name": "snd_rpi_hifiberry_dacplus",
      "alsa.class": "generic"
      // ...every sink property reported by the server
    }
  }
]
```

`name` is the `{output}` used in the routes below. Network sinks carry `"is_network": true`.

```
POST /audio/outputs/{output}/default
POST /audio/outputs/{output}/mute
POST /audio/outputs/{output}/volume
```

### Clients (sink inputs)

```
GET /audio/clients
```
```jsonc
[
  {
    "id": 0,
    "name": "Playback",
    "app": "Shairport Sync",
    "muted": false,
    "volume": 1,
    "corked": true,
    "backend": "pulseaudio",
    "binary": "shairport-sync",
    "user": "odio",
    "host": "raspodio",
    "props": {
      "application.name": "Shairport Sync",
      "media.class": "Stream/Output/Audio"
      // ...every sink input property reported by the server
    }
  }
]
```

`id` is the `{sink}` used in the routes below. `corked` means the stream is paused. Clients streaming from another machine (a PulseAudio tunnel) report that machine's `user` and `host`.

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
