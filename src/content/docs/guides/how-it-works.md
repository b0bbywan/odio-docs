---
title: How it works
description: Architecture and design decisions behind odio.
---

## User session

odio runs in your **systemd user session**. Not as root — [go-odio-api](https://github.com/b0bbywan/go-odio-api) actually refuses to run as root. This is the architectural foundation, not an implementation detail.

Because odio lives in your user session, it has natural access to the entire multimedia stack: the D-Bus session bus, PulseAudio, MPRIS, logind, BlueZ user-level profiles. No privilege escalation, no setuid tricks. The security model is the standard UNIX model.

Every audio service (MPD, shairport-sync, spotifyd, upmpdcli, Snapclient) runs as a systemd user unit. They can be started, stopped, and monitored through the API — no SSH, no reboot needed.

![odio network diagram](https://beta.odio.love/architecture-network.svg)

## Why PulseAudio, not ALSA

Most audio appliances use ALSA directly. ALSA gives exclusive access to the sound card — one process at a time. When you try to run multiple audio sources (Bluetooth, Spotify, MPD, AirPlay), they fight for control, causing cracks, glitches, and lag.

[PulseAudio](https://www.freedesktop.org/wiki/Software/PulseAudio/) sits on top of ALSA and solves this at the root. It's a sound server that mixes all audio sources in the same session. There is no source switching in odio because there is no exclusive lock. MPD, shairport-sync, Snapclient, Bluetooth — all live in the same PulseAudio mixer at once. You don't select a source. You just play.

PulseAudio also enables features that ALSA alone cannot provide: per-application volume control, Bluetooth audio (A2DP), network audio (TCP sink with Zeroconf), and dynamic output routing.

Some audio distributions stick to ALSA for "audiophile" reasons. I chose PulseAudio for the comfort it brings — seamless mixing, per-app volume, and above all [PulseAudio TCP](/guides/network-audio/), which lets any desktop on your network use the node as an audio output. I don't hear the difference with ALSA, but I definitely feel the usability difference.

When you commit to PulseAudio, every audio application must output to it directly. MPD, shairport-sync, spotifyd — all configured with PulseAudio as their audio backend.

### Equalizer and volume normalization

odio ships without equalizer or volume normalization — I don't use them and prefer a clean, unprocessed signal. If there is demand and concrete proposals, this could be considered ([open an issue](https://github.com/b0bbywan/odios/issues)).

### PipeWire

[PipeWire](https://pipewire.org/) is the future of Linux audio. It provides lower latency, better device management, and full PulseAudio compatibility via `pipewire-pulse`. From the outside, nothing changes — all existing clients keep working.

odio currently runs PulseAudio, backed by six years of production use. PipeWire will arrive as an option in the future.

## go-odio-api

[go-odio-api](https://github.com/b0bbywan/go-odio-api) is what makes the stack programmable. A REST API written in Go that bridges every component into a single coherent interface: playback, volume, Bluetooth pairing, power management, output routing — all exposed as HTTP endpoints, with SSE for real-time updates.

The architecture is event-driven. No polling, no busy loops. go-odio-api listens to D-Bus signals, MPRIS events, and PulseAudio state changes, and reacts. A cache layer prevents redundant system access. On a Pi B+, idle cost is near zero.

Every audio source (Spotify, Bluetooth, AirPlay, MPD, ...) exposes itself as an [MPRIS](https://specifications.freedesktop.org/mpris/latest/) player on D-Bus. go-odio-api discovers them all automatically and provides a unified control surface — regardless of the source.

![odio architecture diagram](https://beta.odio.love/architecture.svg)

The binary ships with an [embedded web UI](/guides/embedded-ui/). The API and the interface are the same process. But the API is the product. The embedded UI is one client among many. See the full [API documentation](/api/overview/).

## The ecosystem

| Repository | Language | What it does |
|---|---|---|
| [go-odio-api](https://github.com/b0bbywan/go-odio-api) | Go | REST API + embedded web UI |
| [odios](https://github.com/b0bbywan/odios) | Ansible | Installer and service orchestrator |
| [odio-pwa](https://github.com/b0bbywan/odio-pwa) | Svelte | Web application for multi-node management |
| [odio-ha](https://github.com/b0bbywan/odio-ha) | Python | Home Assistant integration |
| [go-mpd-discplayer](https://github.com/b0bbywan/go-mpd-discplayer) | Go | CD and USB auto-play daemon |
| [go-disc-cuer](https://github.com/b0bbywan/go-disc-cuer) | Go | CUE sheet library (GnuDB, MusicBrainz) |
| [mpDris2](https://github.com/b0bbywan/mpDris2) (fork) | Python | MPRIS bridge for MPD with CD cover art support |
| [go-odio-notify](https://github.com/b0bbywan/go-odio-notify) | Go | Audio notification library (PulseAudio) |
| [odio-apt-repo](https://github.com/b0bbywan/odio-apt-repo) | CI | apt repository, CI-managed |

For the full architecture deep-dive, see [How odio works](https://beta.odio.love/how-it-works).
