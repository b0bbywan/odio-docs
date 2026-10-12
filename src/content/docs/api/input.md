---
title: Remote control input in the odio API
description: The input backend reads infrared, HDMI-CEC, GPIO, Bluetooth and USB remotes through evdev and maps their keys to player, volume, power, service and Bluetooth actions.
---

The input backend lets a physical remote drive the node directly, with no client involved. It reads Linux input devices (`/dev/input/event*`) through evdev and turns key presses into actions on the other backends: play/pause, next, volume, mute, power off, restart a service.

Since [v0.18.0](https://github.com/b0bbywan/go-odio-api/releases/tag/v0.18.0). Disabled by default; the odio installer enables it on headless nodes. For a step-by-step setup, see [Remote controls](/control/remote/).

## Devices

Which devices are handled is decided from sysfs, before any device is opened:

| Kind | Devices | Handled |
|---|---|---|
| `ir` | Infrared receivers, kernel `rc` devices: `gpio-ir`, MCE USB receivers | Automatically |
| `cec` | HDMI-CEC adapters, such as `vc4-hdmi` on a Raspberry Pi | Only with `input.cec: true` |
| `gpio` | `gpio-keys` and `gpio-keys-polled` buttons | Automatically |
| `forced` | Anything else, typically a Bluetooth or USB remote | Only when named in `input.devices` |

Nothing else is ever opened: keyboards, mice and touchscreens are left alone unless you list them.

Handled devices are **grabbed**. Their keys reach odio only, no longer the console, the desktop or another application such as Kodi. The grab covers the whole device, so a keyboard with a built-in touchpad loses its pointer too.

Hotplug is handled by watching `/dev/input`: a remote plugged in later, or a Bluetooth remote that sleeps and reconnects, is picked up without a restart.

## Endpoints

### Status

```
GET /input
```

Returns the handled devices and the effective bindings, defaults and overrides merged:

```json
{
  "devices": [
    { "path": "/dev/input/event0", "name": "vc4-hdmi", "kind": "cec", "state": "active" },
    { "path": "/dev/input/event2", "name": "Logitech K400", "kind": "forced", "state": "active" }
  ],
  "bindings": [
    { "key": "KEY_MUTE", "action": "volume.mute" },
    { "key": "KEY_NEXTSONG", "action": "player.next" },
    { "key": "KEY_PLAYPAUSE", "action": "player.playpause" },
    { "key": "KEY_RED", "action": "service.restart", "unit": "kodi.service" }
  ]
}
```

| `state` | Meaning |
|---|---|
| `opening` | The device was just detected and is being opened |
| `active` | Keys are being read |
| `denied` | The device is not readable, see [System setup](#system-setup) |

A device that is unplugged leaves the list.

## Bindings

Media keys work without any configuration:

| Key | Action |
|---|---|
| `KEY_PLAYPAUSE` | `player.playpause` |
| `KEY_PLAY` | `player.play` |
| `KEY_PAUSE` | `player.pause` |
| `KEY_STOPCD` | `player.stop` |
| `KEY_NEXTSONG` | `player.next` |
| `KEY_PREVIOUSSONG` | `player.previous` |
| `KEY_FASTFORWARD` | `player.forward` |
| `KEY_REWIND` | `player.rewind` |
| `KEY_VOLUMEUP` | `volume.up` |
| `KEY_VOLUMEDOWN` | `volume.down` |
| `KEY_MUTE` | `volume.mute` |

`input.bindings` overrides or extends these. Key names are the kernel's, as shown by `evtest`.

### Actions

| Action | Effect | Backend to enable |
|---|---|---|
| `player.playpause`, `player.play`, `player.pause`, `player.stop`, `player.next`, `player.previous` | Controls the active player | [MPRIS](/api/mpris/) |
| `player.forward`, `player.rewind` | Seeks 10 s in the active player | [MPRIS](/api/mpris/) |
| `volume.up`, `volume.down` | Moves the default output by `pulseaudio.volumeStep` | [PulseAudio](/api/pulseaudio/) |
| `volume.mute` | Toggles mute on the default output | [PulseAudio](/api/pulseaudio/) |
| `power.poweroff`, `power.reboot` | Powers off or reboots the node | [Power](/api/power/) |
| `service.start`, `service.stop`, `service.restart` | Acts on the user unit given as `unit`, which must be listed in `systemd.user` | [Systemd](/api/systemd/) |
| `bluetooth.powerup`, `bluetooth.powerdown` | Powers the Bluetooth adapter on or off | [Bluetooth](/api/bluetooth/) |
| `bluetooth.pairing` | Opens pairing mode, powering the adapter on if needed | [Bluetooth](/api/bluetooth/) |
| `none` | Unmaps the key, typically a default | |

An action only works when its backend is enabled: `bluetooth.pairing` needs `bluetooth.enabled: true`, `power.poweroff` needs `power.enabled: true`, and so on.

Holding a key repeats `volume.up`, `volume.down`, `player.forward` and `player.rewind`. Every other action fires once per press.

A binding that cannot work is skipped with a warning in the log, without failing startup: an unknown key name, an unknown action, or an action whose backend is disabled. An entry with no `key` or no `action` is a configuration error and stops the API from starting.

## Events

| Event | Trigger |
|---|---|
| `input.key` | A bound key was pressed or released |
| `input.updated` | A device was added, removed, or changed state |

`input.key` carries the device name, the key and the action it is bound to:

```json
{ "device": "Logitech K400", "key": "KEY_PLAYPAUSE", "code": 164, "state": "pressed", "action": "player.playpause" }
```

`state` is `pressed` or `released`. Auto-repeat of a held key is not published.

Only keys with a binding are published. Keys without one are dropped, so a handled keyboard never sends what is typed to the [event stream](/api/events/).

`input.updated` carries the device list, in the same form as `devices` in `GET /input`.

## Configuration

```yaml
input:
  enabled: true
  cec: true                    # also handle HDMI-CEC adapters (TV remote)
  devices:                     # Bluetooth / USB remotes, by device name
    - "flirc.tv flirc"
  bindings:                    # override or extend the default media keys
    - { key: KEY_POWER, action: power.poweroff }
    - { key: KEY_RED, action: service.restart, unit: kodi.service }
    - { key: KEY_MUTE, action: none }       # unmap a default
```

| Key | Default | Notes |
|---|---|---|
| `enabled` | `false` | Infrared and GPIO devices are handled as soon as the backend is enabled. |
| `cec` | `false` | Also handles HDMI-CEC adapters. A Raspberry Pi has one per HDMI port, present whether a TV is plugged in or not, which is why it is a separate switch. The odio installer turns it on. |
| `devices` | none | Names of the other devices to handle, as listed in `/proc/bus/input/devices`. The whole name must match, case aside. |
| `bindings` | none | Entries with a `key`, an `action`, and a `unit` for `service.*` actions. |

In a [drop-in](/api/configuration/#drop-in-overrides), `bindings` replaces the list from `config.yaml`, it is not appended to it.

The step of `volume.up` and `volume.down` is set on the PulseAudio backend, with `pulseaudio.volumeStep` (default `0.05`, from `0.01` to `1`).

### Finding key names

With `logLevel: debug`, each key pressed on a handled device that has no binding is named in the log:

```
[input] unmapped KEY_Q (Logitech K400)
```

`evtest` shows the same names, but only while odio-api is stopped, since a grabbed device sends nothing to other readers.

## System setup

odio-api doesn't run as root, so the user running it must belong to the `input` group to read `/dev/input/event*`. The odio installer handles this automatically. For standalone installations:

```bash
sudo usermod -aG input <username>
```

Then reboot. The group only applies to a new user session, restarting odio-api is not enough. Until then, devices are listed as `denied` and a warning is logged.

An infrared receiver also needs its kernel keymap loaded for the remote in use, see `ir-keytable`.

## Security

The `input` group lets **any** process of that user read **every** input device, keyboards included. odio-api itself only opens infrared receivers, `gpio-keys` devices, HDMI-CEC adapters when `input.cec` is set, and the devices named in `input.devices`.

Listing a keyboard in `input.devices` is safe for the event stream, since unbound keys are never published. At `logLevel: debug` they are named in the log, so keep that level for setup only.
