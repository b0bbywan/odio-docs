---
title: Systemd
description: Manage whitelisted systemd services from the API.
---

The systemd backend lets you monitor and control systemd services. User services can be started, stopped, restarted, enabled, and disabled. System services (e.g. `bluetooth.service`) are strictly read-only — status monitoring only.

Enabled by default. Only whitelisted services are exposed — configure the list in `~/.config/odio-api/config.yaml`.

## Endpoints

### List services

```
GET /services
```

Returns the state of all whitelisted services.

### Control a service

```
POST /services/{scope}/{unit}/start
POST /services/{scope}/{unit}/stop
POST /services/{scope}/{unit}/restart
POST /services/{scope}/{unit}/enable
POST /services/{scope}/{unit}/disable
```

`scope` is `user` or `system`. Mutations are only allowed on `user`-scope services.

## Events

| Event | Trigger |
|---|---|
| `service.updated` | Unit state change |

## Configuration

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
