---
title: Systemd service control in the odio API
description: The systemd backend starts, stops, restarts, enables, and disables whitelisted user services over D-Bus, while system services remain read-only for status.
---

The systemd backend lets you monitor and control systemd services. User services can be started, stopped, restarted, enabled, and disabled. System services (e.g. `bluetooth.service`) are strictly read-only, for status monitoring only.

## Endpoints

### List services

```
GET /services
```

Returns the state of all whitelisted services:

```json
[
  {
    "name": "bluetooth.service",
    "scope": "system",
    "active_state": "active",
    "running": true,
    "enabled": true,
    "exists": true,
    "description": "Bluetooth service"
  },
  {
    "name": "mpd.service",
    "scope": "user",
    "active_state": "active",
    "running": true,
    "enabled": true,
    "exists": true,
    "description": "Music Player Daemon",
    "url": ":8080",
    "open": "self"
  },
  {
    "name": "spotifyd.service",
    "scope": "user",
    "active_state": "active",
    "running": true,
    "enabled": true,
    "exists": true,
    "description": "A spotify playing daemon",
    "url": "https://open.spotify.com",
    "open": "tab"
  }
]
```

`exists` is `false` when a whitelisted unit isn't installed on the node. `url` is the optional link set in the [configuration](#configuration), and `open` (since odio-api v0.17.4) tells clients where to open it: `tab` (the default), `panel`, or `self`. Both are omitted for a service without a URL.

### Control a service

```
POST /services/user/{unit}/start
POST /services/user/{unit}/stop
POST /services/user/{unit}/restart
POST /services/user/{unit}/enable
POST /services/user/{unit}/disable
```

Only `user`-scope services can be controlled. System services are read-only — control attempts return `403 Forbidden`.

## Events

| Event | Trigger |
|---|---|
| `service.updated` | Unit state change |

## Configuration

Disabled by default in [go-odio-api](https://github.com/b0bbywan/go-odio-api). Only whitelisted services are exposed, configure the list in `~/.config/odio-api/config.yaml`.


```yaml
systemd:
  enabled: true
  system:            # read-only monitoring
    - name: bluetooth.service
  user:              # full control
    - name: mpd.service
      url: ":8080"   # optional, surfaced on /services for clients to link
      open: self     # optional: tab (default), panel or self
    - name: shairport-sync.service
    - name: snapclient.service
      url: "http://<snapserver>:1780"
    - name: spotifyd.service
    - name: upmpdcli.service
```

Since odio-api v0.12.0, each entry is a map with a `name` and an optional `url`, and since v0.17.4 an optional `open`.

## How it works

The backend communicates with systemd via D-Bus (both user and system bus). State updates come from D-Bus signals, with a filesystem monitoring fallback via fsnotify on `/run/user/{uid}/systemd/units`.
