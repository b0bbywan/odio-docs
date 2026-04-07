---
title: MPD
description: Music Player Daemon — local playback and NAS library integration.
---

[MPD (Music Player Daemon)](https://www.musicpd.org/) is the local music player on your odio node. It handles audio CD, USB flash drive playback, and can also serve a full music library from a NAS.

## No library management by default

odio is designed as a streamer, not a library manager. A large music database on a Pi (especially older models like the B+) causes long scan times, high CPU usage, and corrupted database files — particularly over NFS.

By default, MPD only maintains a lightweight local database for CD and USB playback via [go-mpd-discplayer](https://github.com/b0bbywan/go-mpd-discplayer).

If you want library browsing, you have two options: mount a NAS share locally, or run MPD on the NAS and output audio to the odio node.

## Mounting a NAS share

Mount your NAS music folder via NFS into MPD's music directory:

```
/media/USB/Music  nfs  192.168.1.21:/export/Music
```

After mounting, trigger a database update:

```bash
mpc update
```

Your library is now browsable from any MPD client (MALP, mympd, etc.).

## Using a remote MPD on your NAS

Instead of running the database locally, you can run MPD on your NAS and have it output audio to the odio node over the network via PulseAudio TCP.

### NAS side

Configure MPD on your NAS to send audio to the odio node:

```
# /etc/mpd.conf on the NAS

audio_output {
    type    "pulse"
    name    "odio"
    server  "192.168.1.6"
}
```
Restart MPD on the NAS:

```bash
systemctl --user restart mpd.service
```

### Browsing

Point your MPD client (MALP, mympd, etc.) at the NAS address instead of the odio node. The NAS handles the library and database, the odio node handles the audio output.

The NAS MPD instance appears as a PulseAudio client on the odio node, with per-client volume control available from the embedded UI and the odio application.

## Playback controls

MPD exposes itself as an MPRIS player via [mpDris2](https://github.com/b0bbywan/mpDris2). This is what allows the odio API to discover and control MPD playback alongside all other sources. Playback is controllable from the embedded UI, the odio application, Home Assistant, or any MPD client.

odio uses a [fork of mpDris2](https://github.com/b0bbywan/mpDris2) that adds cover art retrieval from MPD via the `readpicture` and `albumart` commands. The upstream version only looks for cover art on the local filesystem, which doesn't work for CD playback where the current song is a `cdda://` URI.

For CDs, MPD's CUE playlist plugin is configured with `as_directory "true"`, which exposes the CUE sheet as a virtual directory. The fork resolves this virtual path and finds the `cover.jpg` fetched by [go-disc-cuer](https://github.com/b0bbywan/go-disc-cuer) in the parent directory. The upstream mpDris2 crashed with this configuration.

## MPD clients

For library browsing and queue management, you can use any MPD client:

- [M.A.L.P.](https://gitlab.com/gateship-one/malp) — Android MPD client with cover art support
- [myMPD](https://github.com/jcorporation/myMPD) — lightweight web-based MPD client ([vote to integrate it in odio](https://github.com/b0bbywan/odios/issues))
