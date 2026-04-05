---
title: AirPlay
description: Stream audio from any Apple device to your Pi.
---

Your odio node appears as an AirPlay 2 receiver on your local network via [shairport-sync](https://github.com/mikebrady/shairport-sync). No configuration needed on the client side.

## Usage

1. On your iPhone, iPad, or Mac, open Control Center or the AirPlay menu in any app.
2. Select your odio node from the list of available speakers.
3. Audio streams to the Pi.

Works with any app — Apple Music, Spotify, YouTube, podcasts, system audio.

## Integration

AirPlay sessions appear as MPRIS players in the odio application and Home Assistant. You can see what's playing and control playback from the UI.

In Snapcast mode, AirPlay audio is distributed to all rooms via Snapserver — see [Snapcast setup](/guides/snapcast/).

## How it works

shairport-sync runs as a systemd user service, outputting audio to PulseAudio. It registers itself on D-Bus as an MPRIS player, which is how the odio API picks it up and exposes playback controls. The installer handles all of this — D-Bus policies, PulseAudio backend configuration, and service setup.
