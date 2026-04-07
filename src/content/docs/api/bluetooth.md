---
title: Bluetooth (API)
description: Control the Bluetooth A2DP sink from the API.
---

The Bluetooth backend turns the node into an A2DP audio receiver. Power the adapter on/off, enter pairing mode, and manage connections, all from the API.

Enabled when Bluetooth is installed on the node.

## Endpoints

### Status

```
GET /bluetooth
```

Returns adapter state, power status, and connected devices.

### Control

```
POST /bluetooth/power_up
POST /bluetooth/power_down
POST /bluetooth/pairing_mode
```

Pairing mode makes the node discoverable for a configurable duration (default 60s). Devices are automatically trusted on first pairing.

## Events

| Event | Trigger |
|---|---|
| `bluetooth.updated` | Adapter or device state change |

## Configuration

```yaml
bluetooth:
  enabled: true
  timeout: 5s
  pairing_timeout: 60s
  idle_timeout: 30m
```

`idle_timeout` auto-powers down the adapter when no device is connected.

## System setup

The backend requires BlueZ configured as an A2DP audio receiver. The odio installer handles this automatically. For standalone installations, see [Configuration — Bluetooth](/api/configuration/#bluetooth).

## How it works

The backend communicates with BlueZ via D-Bus. On power-up, it auto-unblocks soft-blocked rfkill devices. Paired devices appear as MPRIS players and PulseAudio clients.
