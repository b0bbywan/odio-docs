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

## Polkit rule

On headless systems, the odio installer deploys a polkit rule to allow the odio user to reboot and power off without a graphical session:

```
/etc/polkit-1/rules.d/10-allow-shutdown.rules
```

```javascript
polkit.addRule(function(action, subject) {
    if ((action.id == "org.freedesktop.login1.power-off" ||
         action.id == "org.freedesktop.login1.power-off-multiple-sessions" ||
         action.id == "org.freedesktop.login1.reboot" ||
         action.id == "org.freedesktop.login1.reboot-multiple-sessions") &&
        subject.user == "odio") {
        return polkit.Result.YES;
    }
});
```

On desktop systems with a graphical session, this rule is not needed — logind already grants these permissions.
