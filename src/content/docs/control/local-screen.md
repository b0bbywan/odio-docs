---
title: How to show the odio UI on a screen wired to your node
description: Drive the embedded UI on a display attached to your odio node with a framebuffer browser, no X server and no desktop environment. Setup, screen sizing, and engine limits.
howto: true
---

The [embedded web UI](/control/embedded-ui/) is meant to be opened from another machine. It can also be shown on a screen wired to the node itself — a small panel on a Raspberry Pi, for instance — without installing a desktop.

A framebuffer browser draws straight onto `/dev/fb0`, so there is no X server, no Wayland compositor and no window manager in the picture. It is not free, though: the engine is still Chromium and it brings the Qt stack with it. What you save is the display server and the session around it, not the browser.

Credit where it is due: the approach, and this browser in particular, come from a [debian-fr thread](https://www.debian-fr.org/t/quel-navigateur-internet-faire-tourner-directement-en-framebuffer/92496/6) that worked through the alternatives first — Links2 has no framebuffer driver left, NetSurf renders SVG poorly, Dillo wants X11 — before landing on a Qt kiosk build.

## What you need

- a display the node can drive, and a framebuffer device at `/dev/fb0`
- [Framebuffer-browser](https://github.com/e1z0/Framebuffer-browser), a QtWebEngine browser for linuxfb
- your user in the `tty`, `video` and `input` groups:

```bash
sudo usermod -aG tty,video,input $USER
```

Group membership is read at login, so log out and back in — or reboot — before going further.

Build it on the node:

```bash
sudo apt install --no-install-recommends git cmake build-essential qtwebengine5-dev
git clone https://github.com/e1z0/Framebuffer-browser
cd Framebuffer-browser
mkdir build && cd build && cmake .. && make && cd ..
```

`qtwebengine5-dev` is only needed to compile. What the binary actually needs at runtime is `libqt5webenginewidgets5`, alongside `libqt5core5a`, `libqt5gui5`, `libqt5network5` and `libqt5widgets5` — the set upstream's own Debian packages declare. Building on the node itself pulls all of it in; it only matters if you compile elsewhere and copy the binary over.

It is not a small addition to a minimal node: the debian-fr thread above counted about 30 packages and 185 MB of Qt once installed.

:::note
If there's demand, none of this has to stay manual: odios could package the browser, install the service and expose the screen as a [component](/operations/settings/) like any other. It came up in [this discussion](https://github.com/b0bbywan/odios/discussions/82), about a Pi with a 7" touchscreen — say so there.
:::

## Setup

The launcher keeps its settings in `~/.config/fbrowser/config`. Write it yourself rather than walking the interactive menu:

```bash
mkdir -p ~/.config/fbrowser
cat > ~/.config/fbrowser/config <<'EOF'
BACKEND_DEV=fb
KEYBOARD_DEV=
EOF
```

Both names have to appear even when the value is empty: the launcher greps the file for `BACKEND_DEV` and `KEYBOARD_DEV` and drops into its configuration menu when either is missing, values unread at that point. Leaving them empty is the normal case. `TOUCHSCREEN_DEV` is not part of that check and can simply be absent, as above. See [what these keys do](#without-the-launcher-script) if you ever need to pin a device.

The equivalent through the menu is:

```bash
./fbrowser configure
```

where you choose `1` for the Linux framebuffer. Either way the keyboard and touchscreen entries stay optional: left empty, Qt discovers the devices itself and follows hotplug, which is usually what you want. Filling one pins Qt to that single device and claims it exclusively.

A plain display, with no touch panel and no keyboard, is a perfectly good target. The UI holds an SSE connection to `/ui/events` and swaps its own sections as the node's state changes, so a screen nobody touches still shows what is playing, the volume, and the state of every service.

Then point the browser at the local UI:

```bash
./fbrowser "http://localhost:8018/ui"
```

On startup the terminal prints `This plugin does not support createPlatformOpenGLContext!`. That is expected and harmless: linuxfb has no OpenGL by design, so the engine falls back to software rendering. Nothing on the page is lost.

## Without the launcher script

The `fbrowser` script is a configuration front-end: it reads its own config, exports a handful of Qt variables and execs the binary. Nothing stops you from exporting them yourself and calling the binary directly, which is what you want for a service.

Install it under the name upstream's packages use:

```bash
sudo install -m 755 build/FBrowser /usr/local/bin/fbrowser-bin-kiosk
```

The variables the script sets for the framebuffer backend are these, and only these:

```bash
export QT_QPA_PLATFORM=linuxfb:fb=/dev/fb0:nographicsmodeswitch=1
export QT_QPA_FB_NO_LIBINPUT=1
export QT_QPA_FB_FORCE_FULLSCREEN=1
export QT_QPA_ENABLE_TERMINAL_KEYBOARD=0
export QTWEBENGINE_CHROMIUM_FLAGS="--disable-gpu --disable-gpu-compositing"
fbrowser-bin-kiosk http://localhost:8018/ui
```

The device entries of `~/.config/fbrowser/config` are nothing more than a shorthand for two further variables, which the script only exports when the entry is filled:

| config key | exported as |
| --- | --- |
| `KEYBOARD_DEV=event3` | `QT_QPA_EVDEV_KEYBOARD_PARAMETERS=/dev/input/event3:grab=1` |
| `TOUCHSCREEN_DEV=event4` | `QT_QPA_EVDEV_TOUCHSCREEN_PARAMETERS=/dev/input/event4` |

Empty entries export nothing, which is what leaves Qt free to find the devices itself. Set them, here or in the unit, only to pin one device — the `grab=1` the script appends then claims the keyboard exclusively.

## Starting it at boot

odio-api runs as a user service, so its screen does too. Write `~/.config/systemd/user/odio-screen.service`:

```ini
[Unit]
Description=odio UI on the local screen
After=odio-api.service
StartLimitBurst=15
StartLimitIntervalSec=30

[Service]
Type=simple
Environment=QT_QPA_PLATFORM=linuxfb:fb=/dev/fb0:nographicsmodeswitch=1
Environment=QT_QPA_FB_NO_LIBINPUT=1
Environment=QT_QPA_FB_FORCE_FULLSCREEN=1
Environment=QT_QPA_ENABLE_TERMINAL_KEYBOARD=0
Environment="QTWEBENGINE_CHROMIUM_FLAGS=--disable-gpu --disable-gpu-compositing"
ExecStart=/usr/local/bin/fbrowser-bin-kiosk http://localhost:8018/ui
ExecStop=/bin/kill $MAINPID
Restart=on-failure
RestartSec=2
KillMode=mixed
TimeoutStopSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now odio-screen.service
```

The quotes around `QTWEBENGINE_CHROMIUM_FLAGS` are required: without them systemd stops at the first space and the second flag is lost.

The journal will show two lines on every start. Both are expected:

```
Failed to open tty (Permission denied)
Could not open config.json
```

The first is the linuxfb plugin trying to open `/dev/tty0` to act on the terminal keyboard, as `QT_QPA_ENABLE_TERMINAL_KEYBOARD=0` asks it to. A user service has no console to act on, and `/dev/tty0` grants the `tty` group write only, so the open fails whatever groups you are in. It changes nothing: keyboard and touch input reach the browser through evdev, which reads the input devices directly and never goes near a tty. The second is the URL coming from the command line instead, as intended.

Two things the script does that a unit does not: hiding the console cursor and blanking the framebuffer on exit. Both are cosmetic. For a screen that never shows anything else, `vt.global_cursor_default=0` on the kernel command line is the sturdier answer.

## Screen size

The UI lays out in one column, two from 640px wide, three from 1024px. A 7" panel at 800×480 therefore gets two columns, a 3.5" at 480×320 gets one. Both are usable; the 480px height is the tighter constraint, so expect to scroll.

## Engine limits

QtWebEngine 5.15, which the current framebuffer browser builds on, embeds Chromium 87. Several things the modern web takes for granted are missing there — `:where()`, `:is()`, `:has()`, container queries, `oklch()`, `color-mix()`, unprefixed `mask-*`. The failure mode is quiet: a single unknown pseudo-class invalidates a whole CSS rule, and nothing is reported.

Since [odio-api v0.17.2](https://github.com/b0bbywan/go-odio-api/releases/tag/v0.17.2), odio works around the ones that affect the embedded UI, so the interface renders correctly on that engine. Two cosmetic differences remain for now:

- the volume and seek sliders keep the browser's native blue instead of the gold accent, `accent-color` being a Chromium 93 feature
- text is rendered at its nominal size, which might be small on a 7" panel held at a distance
