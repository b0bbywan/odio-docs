---
title: MPRIS
description: Auto-discover and control all media players on the node.
---

The MPRIS backend auto-discovers every MPRIS-compatible player (Spotify, VLC, Firefox, MPD, Kodi, Bluetooth devices) and exposes unified playback controls. Players appear and disappear in real time — no configuration needed.

## Endpoints

### List players

```
GET /players
```

Returns all active players with their current state: playback status, track metadata, volume, shuffle, loop mode, and position.

### Playback control

```
POST /players/{player}/play
POST /players/{player}/pause
POST /players/{player}/play_pause
POST /players/{player}/stop
POST /players/{player}/next
POST /players/{player}/previous
```

### Seek and position

```
POST /players/{player}/seek
```
```json
{ "offset": 1000000 }
```

```
POST /players/{player}/position
```
```json
{ "track_id": "...", "position": 0 }
```

### Volume, loop, shuffle

```
POST /players/{player}/volume
```
```json
{ "volume": 0.5 }
```

```
POST /players/{player}/loop
```
```json
{ "loop": "None|Track|Playlist" }
```

```
POST /players/{player}/shuffle
```
```json
{ "shuffle": true }
```

## Events

| Event | Trigger |
|---|---|
| `player.updated` | Playback state, volume, or metadata change |
| `player.added` | New player appeared |
| `player.removed` | Player closed |
| `player.position` | Periodic position tick |

## How it works

The backend listens on D-Bus for `org.mpris.MediaPlayer2` interfaces. Player state is cached and invalidated via D-Bus signals, with a heartbeat for accurate position tracking.
