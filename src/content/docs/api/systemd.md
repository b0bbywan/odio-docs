---
title: Systemd
description: Manage whitelisted systemd services from the API.
---

The systemd backend lets you monitor and control systemd services. User services can be started, stopped, restarted, enabled, and disabled. System services (e.g. `bluetooth.service`) are strictly read-only, for status monitoring only.

## Endpoints

### List services

```
GET /services
```

Returns the state of all whitelisted services.

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
    - bluetooth.service
  user:              # full control
    - mpd.service
    - shairport-sync.service
    - snapclient.service
    - spotifyd.service
    - upmpdcli.service
```

## How it works

The backend communicates with systemd via D-Bus (both user and system bus). State updates come from D-Bus signals, with a filesystem monitoring fallback via fsnotify on `/run/user/{uid}/systemd/units`.
