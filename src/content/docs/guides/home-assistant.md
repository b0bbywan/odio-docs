---
title: Home Assistant
description: Native Home Assistant integration — your full odio stack as HA entities.
---

[odio-ha](https://github.com/b0bbywan/odio-ha) is a native Home Assistant integration, installable via [HACS](https://hacs.xyz/). Each odio node appears as a single HA device with the entire stack exposed as entities.

![Home Assistant device view of an odio node — device info, full list of controls (Bluetooth, MPD, MPD services, Odio Remote media player with transport, pairing, remote audio clients), and activity log](../../../assets/home-assistant-odio-remote.png)

## Installation

1. Open HACS in Home Assistant.
2. Search for **odio** or use the direct link:

   [![Add to HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=b0bbywan&repository=odio-ha&category=integration)

3. Install the integration and restart Home Assistant.
4. Your odio nodes are auto-discovered via Zeroconf — no manual IP configuration needed.

## Entities

### Media players

- **Main player** — the audio backend (PulseAudio or pipewire-pulse) with global volume, mute, and output selection.
- **MPRIS players** — each active player (Spotify, VLC, Firefox, MPD, shairport-sync, any MPRIS source) appears as a child media player with transport controls, metadata, and live position. Players are discovered in real time — start Spotify, it shows up instantly.
- **Bluetooth** — when a phone is connected via Bluetooth, the node appears as a media player with the connected device's playback info.
- **Remote audio clients** — connected TCP clients (PulseAudio/PipeWire desktops) appear as media players with per-client volume control.

### Bluetooth entities

- Power switch
- Pairing mode button
- Connected device and status

### Service switches

Whitelisted systemd user services exposed as start/stop switches. System units are read-only.

### System controls

- Reboot and power-off buttons

## Entity mapping

odio-ha doesn't replace existing HA integrations. MPD, Snapcast, spotifyd, and upmpdcli all have their own dedicated HA integrations for rich playback control.

![Home Assistant MPD integration picking up the odio node as a Music Player Daemon device in the Salon area](../../../assets/home-assistant-mpd.png)

![Home Assistant Snapcast client view for the raspodio node in the Salon, with a source selector listing MPD, SpotifyHD, Airplay, and PipeWire streams from bobby-laptop, rasponkyold, and bobby-desktop](../../../assets/home-assistant-snapcast.png)

In the odio-ha configuration, any managed entity (service, MPRIS player, or remote audio client) can be mapped to an existing HA media player so Home Assistant treats them as one.

## Real-time updates

The integration uses SSE (Server-Sent Events) — all state changes push instantly to HA. No polling.
