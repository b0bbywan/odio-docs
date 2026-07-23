---
title: MPRIS player control in the odio API
description: The MPRIS backend auto-discovers every D-Bus media player on the node and exposes unified transport, position, volume, loop, shuffle, and tracklist endpoints.
---

The MPRIS backend auto-discovers every MPRIS-compatible player (Spotify, VLC, Firefox, MPD, Kodi, Bluetooth devices) and exposes unified playback controls. Players appear and disappear in real time — no configuration needed.

## Endpoints

### List players

```
GET /players
```

Returns all active players with their current state: playback status, track metadata, volume, shuffle, loop mode, position, and whether the player exposes a [tracklist](#tracklist).

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

## Tracklist

Since [odio-api v0.16.0](https://github.com/b0bbywan/go-odio-api/releases/tag/v0.16.0), players implementing the MPRIS `TrackList` interface expose their queue. `/players` reports `tracklist_supported` per player, and the routes below answer `404` on players that don't implement the interface.

### Who implements it

`TrackList` is optional in the [MPRIS spec](https://specifications.freedesktop.org/mpris-spec/latest/Track_List_Interface.html), and most players skip it — a player advertises it through the `HasTrackList` root property, which is what `tracklist_supported` mirrors.

| Player | Tracklist |
|---|---|
| [MPD](/guides/mpd/) via [mpd2mpris](https://github.com/b0bbywan/mpd2mpris) 0.13.0+ | The MPD queue, editable when the server allows queue edits |
| [VLC](https://www.videolan.org/vlc/) | Its playlist, always editable |
| Bluetooth devices via BlueZ `mpris-proxy` | Only when the connected phone or laptop exposes a browsable now-playing list over AVRCP |
| [spotifyd](/guides/spotify/) | Not implemented, `HasTrackList` is hardcoded to false |
| [Shairport Sync](/guides/airplay/) | Not implemented, the property isn't exposed at all |

### Read the queue

```
GET /players/{player}/tracklist
```
```json
{
  "can_edit_tracks": true,
  "tracks": [
    { "track_id": "/org/mpris/MediaPlayer2/Track/42", "metadata": { "xesam:title": "..." } }
  ]
}
```

The list is served from the player cache, kept live by the `TrackListReplaced`, `TrackAdded`, `TrackRemoved` and `TrackMetadataChanged` D-Bus signals.

### Jump, add, remove

```
POST /players/{player}/tracklist/goto/{trackid}
POST /players/{player}/tracklist/remove/{trackid}
```

```
POST /players/{player}/tracklist/add
```
```json
{ "uri": "file:///media/USB/album/01.flac", "after_track": "", "set_as_current": false }
```

`{trackid}` is either the last segment of the track's object path (`42`) or the full `%2F`-encoded path. `uri` must be absolute and its scheme must be one the player declares in `SupportedUriSchemes`, otherwise the request is rejected with `400`. An empty `after_track` appends, `NoTrack` prepends.

`add` and `remove` require `can_edit_tracks` and answer `403` otherwise. `goto` is not an edit operation per the spec, so it works on read-only tracklists too.

## Events

| Event | Trigger |
|---|---|
| `player.updated` | Playback state, volume, or metadata change |
| `player.added` | New player appeared |
| `player.removed` | Player closed |
| `player.position` | Periodic position tick |
| `player.tracklist.updated` | Queue replaced, or a track added, removed, or its metadata changed |

## How it works

The backend listens on D-Bus for `org.mpris.MediaPlayer2` interfaces. Player state is cached and invalidated via D-Bus signals, with a heartbeat for accurate position tracking.
