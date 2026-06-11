---
title: Bluetooth (API)
description: The Bluetooth backend drives the BlueZ adapter over D-Bus, both as an A2DP sink that phones stream to and as an output that connects to nearby speakers.
---

The Bluetooth backend drives the node's adapter over D-Bus (BlueZ), in both directions:

- **Input (A2DP sink):** the node acts as an audio receiver, so phones and computers can stream *to* it.
- **Output:** the node connects *to* nearby speakers or headphones and uses them as an audio output sink.

Enabled when Bluetooth is installed on the node.

## Endpoints

### Status

```
GET /bluetooth
```

Returns adapter state (powered, pairing and scan state) and the `known_devices` list. Each device carries `paired`, `bonded`, `trusted`, and `connected` flags, so a bonded speaker and a freshly scanned one share the same shape:

```json
{
  "address": "AA:BB:CC:DD:EE:FF",
  "name": "JBL Go 3",
  "paired": true,
  "bonded": true,
  "trusted": true,
  "connected": true
}
```

`bonded` (since odio-api v0.14.0) means the node still holds the device's pairing key, so it can reconnect without re-pairing. `connected` is the live link state.

### Input control

```
POST /bluetooth/power_up
POST /bluetooth/power_down
POST /bluetooth/pairing_mode
```

Pairing mode makes the node discoverable for a configurable duration (default 60s). Devices are automatically trusted on first pairing.

### Output

```
GET  /bluetooth/devices
POST /bluetooth/scan
POST /bluetooth/scan/stop
POST /bluetooth/connect
POST /bluetooth/disconnect
```

- **`GET /bluetooth/devices`** returns the same device list as the `known_devices` field of `GET /bluetooth`.
- **`POST /bluetooth/scan`** starts active discovery (powering the adapter up if needed) and filters for classic audio devices. Discovered devices stream live through `bluetooth.discovered` events and are merged into the device list as they appear (since odio-api v0.14.0; also pushed via `bluetooth.updated`), then reconciled with BlueZ when the scan stops. The scan auto-stops after `scanTimeout` (default 60s).
- **`POST /bluetooth/scan/stop`** stops the scan (idempotent).
- **`POST /bluetooth/connect`** with `{"address": "AA:BB:CC:DD:EE:FF"}`. The address is validated first (malformed → `400`), then the call blocks until BlueZ answers (it can take a few seconds and may trigger pairing) and returns the real outcome. A not-yet-bonded device gets a brief pairable window for the connect; a bonded one reconnects without it. On success the device is trusted and any active scan is stopped.
- **`POST /bluetooth/disconnect`** with the same `{"address": ...}` body.

Connected output devices route through PulseAudio/PipeWire as a regular output sink.

## Events

| Event | Trigger |
|---|---|
| `bluetooth.updated` | Adapter or device state change (power, pairing, scan, connection) |
| `bluetooth.discovered` | A device appears during an active scan |

## Configuration

```yaml
bluetooth:
  enabled: true
  timeout: 5s
  pairingTimeout: 60s
  idleTimeout: 30m
  scanTimeout: 60s
```

`idleTimeout` auto-powers down the adapter when no device is connected (`0` to disable). `scanTimeout` auto-stops a scan after the given delay (`0` to disable).

## System setup

The backend requires BlueZ. The odio installer handles this automatically. For standalone installations, see [Configuration — Bluetooth](/api/configuration/#bluetooth).

## How it works

The backend communicates with BlueZ via D-Bus. On power-up, it auto-unblocks soft-blocked rfkill devices. Devices streaming *to* the node (A2DP sink) appear as MPRIS players and PulseAudio clients; devices the node connects *to* appear as PulseAudio output sinks.
