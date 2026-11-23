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

### Processing

Since [v0.19.0](https://github.com/b0bbywan/go-odio-api/releases/tag/v0.19.0), odio can load a few server modules itself and toggle them at runtime. Each feature is opt-in in the [configuration](#processing-features); these routes exist only when at least one is enabled.

```
GET /audio/processing
```
```json
[
  { "name": "mono", "state": "active" },
  { "name": "network_sink", "state": "error", "error": "auth-ip-acl is not supported by PipeWire, set acl: false" },
  { "name": "zeroconf_discover", "state": "disabled" }
]
```

`state` is `active`, `disabled` or `error`, with the reason under `error`. The same list is included as `processing` in `GET /audio`.

```
POST /audio/processing/{feature}/enable
POST /audio/processing/{feature}/disable
```

`{feature}` is a `name` from the list above. An unknown or disabled feature answers `404`, one that can't be applied on this server `500` with the reason.

## Events

| Event | Trigger |
|---|---|
| `audio.updated` | Sink input added or changed |
| `audio.removed` | Sink input removed |
| `audio.processing.updated` | A [processing](#processing) feature changed state, carries the changed features |

## Configuration

```yaml
pulseaudio:
  enabled: true
  serve_cookie: true
  volumeStep: 0.05
```

`serve_cookie` exposes `GET /audio/cookie` — save the downloaded cookie on your client as `~/.config/pulse/cookie` with `600` permissions to enable network audio streaming.

`volumeStep` is how far a [remote](/api/input/) moves the default output on `volume.up` and `volume.down`, from `0.01` to `1`. Since [v0.18.0](https://github.com/b0bbywan/go-odio-api/releases/tag/v0.18.0).

### Processing features

```yaml
pulseaudio:
  processing:
    mono:
      enabled: true      # mono remap sink, set as default output while on
      onBoot: false
    networkSink:
      enabled: true      # TCP sink (module-native-protocol-tcp + module-zeroconf-publish)
      onBoot: false
      port: 4713
      acl: true          # loopback + private subnets of `bind`; false accepts any client
      # extraAcl: "10.8.0.0/24;192.168.50.7"   # more IPs / CIDRs, `;`-separated
    zeroconfDiscover:
      enabled: true      # LAN PulseAudio servers as tunnel sinks (module-zeroconf-discover)
      onBoot: false
```

A feature that is not `enabled` is hidden from the API and the UI. An enabled one can be toggled from both; `onBoot` is its state when the session starts, then odio keeps the last one across its own and the audio server's restarts. Stopping odio-api leaves the modules loaded.

On PipeWire, `pipewire-pulse` ignores the IP ACL, so `networkSink` needs `acl: false` there. With `acl: true` the feature reports an error and loads nothing.

## How it works

The backend connects to PulseAudio via its native protocol over the Unix socket. Real-time events are captured through PulseAudio's built-in monitoring mechanism.
