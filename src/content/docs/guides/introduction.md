---
title: Introduction
description: What odio is and how to get started.
---

odio turns a Raspberry Pi (or any Debian-based system) into a complete audio streamer: Bluetooth speaker, AirPlay 2, Spotify Connect, UPnP/DLNA, multi-room, CD player, USB playback — all running in your user session on standard Debian-based systems.

## Why odio?

odio started as a personal setup in 2020 — a Raspberry Pi wired to a stereo amplifier, replacing a pile of dedicated devices with a single board. After years of daily use and iteration, odio packages that setup for anyone to use. Every component is independent and can be set up from scratch individually.

The full journey that led to odio is documented on [Medium](https://mathieu-requillart.medium.com/my-ultimate-guide-to-the-raspberry-pi-audio-server-i-wanted-introduction-650020d135e1).

## Getting started

Two paths, same result:

- **Flash an image** — use [Raspberry Pi Imager](https://www.raspberrypi.com/software/) with a custom repository URL. Configure hostname, SSH & WiFi, then flash. Your Pi boots ready.

![Raspberry Pi Imager showing odio images available for arm64 and armhf architectures](../../../assets/rpi-imager.png)
- **Run the installer** — on an existing Debian 13 (trixie) or Ubuntu system:

  ```bash
  curl -fsSL https://beta.odio.love/install | bash
  ```

  <details>
  <summary>Example installer output</summary>

  ```
  ╔═══════════════════════════════════════════════════════════╗
  ║                 odio Streamer Installer                   ║
  ╚═══════════════════════════════════════════════════════════╝

  Running pre-flight checks...
  ✓ OS: debian 13
  ✓ Architecture: x86_64
  ✓ Python 3.13
  ✓ Sudo access available
  ✓ Disk space: 7994 MB available in /tmp
  ✓ curl available
  ✓ Systemd available

  Installing python3-jinja2...
  ✓ python3-jinja2 installed

  Downloading odio archive...
  ✓ Archive extracted

  Running Ansible playbook...

  PLAY [Odio Streamer Installation] **********************************************

  ...

  ═══════════════════════════════════════════════════
    Audio Streaming System - Installation Complete
  ═══════════════════════════════════════════════════

  Hostname: raspodio
  User: odio

  Core services installed:
    ✓ PulseAudio with network streaming
    ✓ Bluetooth audio (A2DP sink)
    ✓ MPD (Music Player Daemon)
    ✓ Odio API (REST control interface)

  Optional services:
    ✓ MPD disc player
    ✓ Spotifyd (Spotify Connect)
    ✓ Shairport Sync (AirPlay)
    ✓ Snapcast client
    ✓ UPnP/DLNA renderer

  System should already be running !
  Visit http://localhost:8018/ui

  ═══════════════════════════════════════════════════

  Playbook completed in 2m 20s

  ═══════════════════════════════════════════════════════════
  Installation complete!
  ═══════════════════════════════════════════════════════════
  ```

  </details>

Both paths produce the same stack: same packages, same services, same configuration.

## What you get

Once installed, your odio node is controllable from:

- **[Embedded web UI](/guides/embedded-ui/)** — built into the API, accessible from any browser on your network.
- **[odio application](https://pwa.odio.love)** — web app installable from your browser, manage all your nodes from one place.
- **[Home Assistant](https://github.com/b0bbywan/odio-ha)** — native integration via HACS. Every feature exposed as HA entities.
- **Any MPD client** — for library browsing and playback control.
- **The REST API** — for automation, scripting, or building your own client.

For a deeper look at how the stack is put together, see [How it works](/guides/how-it-works/).
