---
title: UPnP / DLNA
description: Stream from your NAS or any DLNA source to your Pi.
---

Your odio node acts as a UPnP/DLNA renderer via [upmpdcli](https://www.lesbonscomptes.com/upmpdcli/). Browse your media library on a NAS or phone and direct playback to the Pi.

## Usage

1. Use a DLNA control point app — [BubbleUPnP](https://play.google.com/store/apps/details?id=com.bubblesoft.android.bubbleupnp) on Android, or any UPnP app.
2. Browse your DLNA server (NAS, phone, any media server on your network).
3. Select your odio node as the renderer.
4. Play.

You can browse multiple servers and direct playback to any renderer on your network.

## Integration

upmpdcli uses MPD as its backend. Playback is controllable from the odio application, Home Assistant, or any MPD client.

upmpdcli also supports [Tidal and Qobuz](/guides/tidal-qobuz/) streaming.

## How it works

DLNA uses three entities: a **server** (your NAS or media library), a **renderer** (the odio node via upmpdcli), and a **control point** (your phone app). The control point browses the server and tells the renderer what to play.

upmpdcli runs as a systemd user service and feeds audio to MPD, which outputs to PulseAudio. Since MPD is an MPRIS player via mpDris2, playback is automatically visible in the odio API.
