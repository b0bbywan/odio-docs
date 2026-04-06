---
title: Installation
description: Install go-mpd-discplayer from APT, packages, or source.
---

go-mpd-discplayer requires runtime libraries for disc ID reading and device monitoring (`libdiscid`, `libgudev`, `libcdio-paranoia`). These are installed automatically by the deb package.

## Platform support

| Architecture | Package | Tested on |
|---|---|---|
| amd64 | deb | Fedora 43, Debian 13 |
| arm64 | deb | Raspberry Pi 3/4/5 (64-bit) |
| armv7hf | deb | Raspberry Pi 2/3 (32-bit) |
| armhf (ARMv6) | deb | Raspberry Pi B / B+ / Zero |

## APT repository (Debian / Raspberry Pi OS)

```bash
curl -fsSL https://apt.odio.love/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/odio.gpg
echo "deb [signed-by=/usr/share/keyrings/odio.gpg] https://apt.odio.love stable main" | sudo tee /etc/apt/sources.list.d/odio.list
sudo apt update
sudo apt install mpd-discplayer
```

## Packages (deb)

Pre-built packages for all architectures are available as artifacts on each [build workflow run](https://github.com/b0bbywan/go-mpd-discplayer/actions/workflows/build.yml).

Download the binary for your architecture from the [releases page](https://github.com/b0bbywan/go-mpd-discplayer/releases) and install the required runtime libraries:

```bash
# Debian Bookworm
sudo apt install libcdparanoia0 libdiscid0 libgudev-1.0-0

# Debian Trixie / Raspberry Pi OS (latest)
sudo apt install libcdio-paranoia2t64 libdiscid0 libgudev-1.0-0
```

## From source

Install the dev libraries first:

```bash
# Debian
sudo apt install gcc libdiscid-dev libgudev-1.0-dev libasound2-dev pkg-config

# Fedora
sudo dnf install gcc libdiscid-devel libgudev-devel alsa-lib-devel pkgconf
```

Then build:

```bash
git clone https://github.com/b0bbywan/go-mpd-discplayer.git
cd go-mpd-discplayer
go build -o mpd-discplayer .
```

## systemd user service

The deb package installs the service automatically. If you installed from source:

```bash
sudo cp share/mpd-discplayer.service /usr/lib/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now mpd-discplayer
```

**Headless systems:** enable lingering so the user session survives without an active login:

```bash
sudo loginctl enable-linger <username>
```
