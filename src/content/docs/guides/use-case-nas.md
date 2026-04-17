---
title: NAS
description: How to use a NAS with an odio instance.
---

A NAS is where your music library lives. odio doesn't try to replace it, it uses it.

## Music library

Mount your NAS music folder into MPD's music directory via NFS, trigger a database update with `mpc update`, and browse your library from any [MPD client](/guides/mpd/). Playback goes through the odio node's audio output.

Alternatively, run a DLNA server like [MiniDLNA](https://sourceforge.net/projects/minidlna/) on your NAS and use a UPnP control point like BubbleDS Next or BubbleUPnP to browse the library and direct playback to the odio node acting as a [DLNA renderer](/guides/dlna/).

## MPD on the NAS

If your library is large, running [MPD](/guides/mpd/) directly on the NAS avoids slow database scans over NFS. Configure MPD on the NAS to output audio to the odio node over the network via [PulseAudio TCP](/guides/network-audio/). The NAS handles the library, the odio node handles the audio.

## Snapserver for multi-room

The NAS is the natural place to run a [Snapserver](/guides/snapcast/), it's always on, has the CPU for mixing, and sits at the center of your network.

Feed it audio sources, MPD, Librespot for Spotify, shairport-sync for AirPlay, and every odio node on the network receives synchronized streams as a Snapcast client. Each room can play a different source or all play the same thing, perfectly in sync.

## go-odio-api on the NAS

You can also install [go-odio-api](/api/overview/) directly on the NAS. It runs on any Linux system with a D-Bus user session, including OpenMediaVault. The NAS becomes an odio node with its own [embedded web UI](/guides/embedded-ui/), controllable from the [odio application](/guides/pwa/) and [Home Assistant](/guides/home-assistant/).

