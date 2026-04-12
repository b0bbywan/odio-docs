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

## Desktop integration (PulseAudio / PipeWire)

On a Linux desktop, PulseAudio natively discovers AirPlay receivers on the network via its RAOP module. The odio node appears as a remote audio output in your sound settings, no extra software needed.

### On PipeWire desktops

PipeWire's PulseAudio compatibility layer handles RAOP discovery automatically. Install the RAOP discover module:

```bash
# Fedora
sudo dnf install pipewire-module-raop-discover

# Debian / Ubuntu
sudo apt install pipewire-pulse
```

Add to your PipeWire-pulse config (`~/.config/pipewire/pipewire-pulse.conf.d/raop.conf`):

```
context.modules = [
    { name = libpipewire-module-raop-discover }
]
```

Restart PipeWire:

```bash
systemctl --user restart pipewire-pulse
```

### On PulseAudio desktops

Load the RAOP discover module:

```
load-module module-raop-discover
```

Restart PulseAudio:

```bash
systemctl --user restart pulseaudio
```

The odio node appears as an AirPlay sink in your sound settings or `pavucontrol`.

## How it works

shairport-sync runs as a systemd user service, outputting audio to PulseAudio. It registers itself on D-Bus as an MPRIS player, which is how the odio API picks it up and exposes playback controls. The installer handles all of this — D-Bus policies, PulseAudio backend configuration, and service setup.
