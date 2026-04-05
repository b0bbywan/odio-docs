---
title: Network audio (TCP sink)
description: Send your desktop audio to the Pi over the network.
---

Your odio node advertises itself as a network audio sink via [PulseAudio](https://www.freedesktop.org/wiki/Software/PulseAudio/) Zeroconf. Any Linux desktop on the same network can use it as an audio output — browser, media players, games, system sounds, everything.

## On PipeWire desktops (recommended)

Most modern Linux distributions ship PipeWire by default (Fedora 34+, Debian 12+, Ubuntu 22.10+).

1. Install the Zeroconf discovery module:

   ```bash
   # Fedora
   sudo dnf install pipewire-module-zeroconf-discover

   # Debian / Ubuntu
   sudo apt install pipewire-pulse
   ```

2. Add to your PipeWire-pulse config (`~/.config/pipewire/pipewire-pulse.conf.d/zeroconf.conf`):

   ```
   context.modules = [
       { name = libpipewire-module-zeroconf-discover }
   ]
   ```

3. Restart PipeWire:

   ```bash
   systemctl --user restart pipewire-pulse
   ```

Your odio node appears in your system's sound settings as an audio output. Select it and all desktop audio routes to the Pi.

### Verify discovery

Check that your desktop sees the odio sink via Zeroconf:

```
$ avahi-browse -a | grep pulse
+ enp2s0 IPv4 pi@odio: Audio interne Stéréo        _pulse-sink._tcp     local
```

And via PipeWire:

```
$ wpctl status
PipeWire 'pipewire-0' [1.4.9, bobby@bobby-desktop, cookie:**********]
...
 ├─ Sinks:
 │ ...
 │      83. Audio interne Stéréo on pi@odio          [vol: 1.00]
```

## PulseAudio cookie

If authentication is required, download the cookie from your odio node and save it locally:

```bash
curl -o ~/.config/pulse/cookie http://<hostname>.local:8018/audio/cookie
chmod 600 ~/.config/pulse/cookie
```

## On PulseAudio desktops

1. Install the Zeroconf module:

   ```bash
   sudo apt install pulseaudio-module-zeroconf avahi-daemon
   ```

2. Enable network discovery in PulseAudio (via `paprefs` or by adding to your PulseAudio config):

   ```
   load-module module-zeroconf-discover
   ```

3. Restart PulseAudio:

   ```bash
   systemctl --user restart pulseaudio
   ```

### Verify discovery

Check that your desktop sees the odio sink:

```
$ avahi-browse -a | grep Pulse
+ enp2s0 IPv4 pi@odio: Built-in Audio Stereo   PulseAudio Sound Sink   local
```

```
$ pactl list sinks
...
Sink #49
  State: SUSPENDED
  Name: tunnel.odio.local.alsa_output.platform-soc_sound.stereo-fallback
  Description: Built-in Audio Stereo on pi@odio
  Driver: module-tunnel.c
  ...
```

The Pi appears as an audio sink in your sound settings or `pavucontrol`.

## Integration

Connected TCP clients appear in the odio application and Home Assistant. You can control per-client volume and mute from the UI.
