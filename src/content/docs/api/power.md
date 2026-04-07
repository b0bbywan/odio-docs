---
title: Power
description: Remote reboot and power-off via the API.
---

The power backend provides remote reboot and power-off via the `org.freedesktop.login1` D-Bus interface. Each capability (reboot, power-off) can be individually enabled or disabled in config.

The odio installer auto-detects whether the user has permission to reboot/power-off via logind D-Bus and configures the backend accordingly.

## Endpoints

### Capabilities

```
GET /power/
```

Returns which power actions are available.

### Actions

```
POST /power/power_off
POST /power/reboot
```

## Events

| Event | Trigger |
|---|---|
| `power.action` | Reboot or power-off triggered |

## Configuration

```yaml
power:
  enabled: true
  capabilities:
    poweroff: true
    reboot: true
```

## System setup

On headless systems, a polkit rule is required to allow the odio user to reboot and power off. The odio installer handles this automatically. For standalone installations, see [Configuration — Power management](/api/configuration/#power-management).
