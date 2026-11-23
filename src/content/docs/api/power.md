---
title: Remote power control in the odio API
description: The power backend triggers remote reboot and power-off through the org.freedesktop.login1 D-Bus interface, with each capability toggled on or off in config.
---

The power backend provides remote reboot and power-off via the `org.freedesktop.login1` D-Bus interface. Each capability (reboot, power-off) can be individually enabled or disabled in config.

The odio installer auto-detects whether the user has permission to reboot/power-off via logind D-Bus and configures the backend accordingly.

## Endpoints

### Capabilities

```
GET /power
```

Returns which power actions are available, and whether a reboot is pending:

```json
{
  "reboot": true,
  "power_off": true,
  "reboot_required": true,
  "reboot_required_by": ["linux-image-rpi-v8", "dbus"]
}
```

`reboot_required` and `reboot_required_by` come from the [reboot required](#reboot-required) check and stay `false` and empty when it is off.

A disabled action answers `403 Forbidden`.

### Actions

```
POST /power/power_off
POST /power/reboot
```

## Events

| Event | Trigger |
|---|---|
| `power.action` | Reboot or power-off triggered |
| `power.updated` | Reboot required flag raised or cleared, carries the `GET /power` payload |

## Configuration

```yaml
power:
  enabled: true
  capabilities:
    poweroff: true
    reboot: true
  rebootRequiredFile: /run/reboot-required   # optional, see below
```

## System setup

On headless systems, a polkit rule is required to allow the odio user to reboot and power off. The odio installer handles this automatically. For standalone installations, see [Configuration — Power management](/api/configuration/#power-management).

## Reboot required

Since [v0.18.2](https://github.com/b0bbywan/go-odio-api/releases/tag/v0.18.2). Opt-in: set `power.rebootRequiredFile` to the flag file your distro raises when a reboot is pending. odio-api watches it and lists the packages in its `.pkgs` sibling, one per line. It never runs the package manager itself. Unset, the check is off.

The flag lives in `/run` (tmpfs), so a reboot clears it. A package listed twice is reported once.

### Debian, Raspberry Pi OS, Ubuntu

```yaml
power:
  rebootRequiredFile: /run/reboot-required
```

On Debian and Raspberry Pi OS, the flag is raised once `unattended-upgrades` is installed: its kernel hook and the `dbus` package flag the reboot on every install, whatever runs apt. Raspberry Pi OS needs a Debian-style `linux-image-rpi-*` kernel (Bookworm and later). On Ubuntu, `update-notifier-common` raises it.

### openSUSE / SLE

libzypp raises `/run/reboot-needed`, with no package list:

```yaml
power:
  rebootRequiredFile: /run/reboot-needed
```

### Fedora / RHEL

dnf5 raises no flag out of the box. Install `libdnf5-plugin-actions` and add `/etc/dnf/libdnf5-plugins/actions.d/odio-reboot-required.actions`:

```
post_transaction:kernel-core:in::/usr/bin/sh -c echo\ ${pkg.name}\ >>/run/reboot-required.pkgs;touch\ /run/reboot-required
post_transaction:glibc:in::/usr/bin/sh -c echo\ ${pkg.name}\ >>/run/reboot-required.pkgs;touch\ /run/reboot-required
post_transaction:systemd:in::/usr/bin/sh -c echo\ ${pkg.name}\ >>/run/reboot-required.pkgs;touch\ /run/reboot-required
post_transaction:dbus-broker:in::/usr/bin/sh -c echo\ ${pkg.name}\ >>/run/reboot-required.pkgs;touch\ /run/reboot-required
post_transaction:linux-firmware:in::/usr/bin/sh -c echo\ ${pkg.name}\ >>/run/reboot-required.pkgs;touch\ /run/reboot-required
```

Then set `rebootRequiredFile: /run/reboot-required`, as on Debian.

### Arch

pacman raises no flag out of the box. Add a hook, `/etc/pacman.d/hooks/odio-reboot-required.hook`:

```ini
[Trigger]
Operation = Install
Operation = Upgrade
Type = Package
Target = linux
Target = linux-lts
Target = glibc
Target = systemd
Target = dbus-broker

[Action]
Description = Flagging reboot required...
When = PostTransaction
NeedsTargets
Exec = /usr/bin/sh -c 'cat >> /run/reboot-required.pkgs; touch /run/reboot-required'
```

Then set `rebootRequiredFile: /run/reboot-required`, as on Debian.
