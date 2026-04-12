---
title: Phone & Tablet
description: How to use your phone or tablet with an odio instance.
---

Your phone is both an audio source and a remote control for odio. You keep using the apps you already have.

## As a source

### Bluetooth

Pair your phone with the odio node like any Bluetooth speaker, open pairing mode from the [embedded UI](/guides/embedded-ui/), the [odio application](/guides/pwa/), or [Home Assistant](/guides/home-assistant/), and connect. Anything your phone plays, Spotify, YouTube, Apple Music, podcasts, streams to the node. Track info, playback controls, and volume sync work over [Bluetooth](/guides/bluetooth/) via AVRCP.

### AirPlay

On iPhone or iPad, open Control Center and select the odio node from AirPlay outputs. Audio streams over the network, works with any app. The [AirPlay](/guides/airplay/) session appears as a controllable media player in the odio stack.

### Spotify Connect

Open Spotify, tap the device icon, and select the odio node. Music streams directly from Spotify's servers, your phone is just a remote. You can close the app and keep controlling playback from any other [Spotify Connect](/guides/spotify/) client.

## As a remote control

### odio application

Install the [odio App](https://pwa.odio.love) on your phone, add your nodes by hostname or IP and get the full interface for each: playback, volume, audio routing, Bluetooth, services, power. Manage all your nodes from one place.

### BubbleUPnP

Use [BubbleUPnP](https://play.google.com/store/apps/details?id=com.bubblesoft.android.bubbleupnp) to browse a DLNA server on your network, your NAS for example, and direct playback to the odio node as a [DLNA renderer](/guides/dlna/). With [Tidal or Qobuz](/guides/tidal-qobuz/) configured, you can also browse and stream cloud libraries. If you know a good open-source alternative, [let us know](https://github.com/b0bbywan/odios/discussions).

### Home Assistant

The [Home Assistant companion app](https://companion.home-assistant.io/) gives you full control over every odio node, media players, Bluetooth, services, power, with real-time updates. Nodes are [auto-discovered](/guides/home-assistant/), no manual IP configuration needed.

### M.A.L.P.

[M.A.L.P.](https://play.google.com/store/apps/details?id=org.gateshipone.malp) on Android lets you browse your music library, manage the playback queue, and control [MPD](/guides/mpd/) with full cover art support.
