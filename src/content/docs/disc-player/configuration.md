---
title: Configuration
description: Configuration reference for go-mpd-discplayer and go-disc-cuer.
---

The odio installer generates `~/.config/mpd-discplayer/config.yaml`. You can also create it manually.

Configuration file locations (in order of precedence):
- Environment variables (highest priority)
- `~/.config/mpd-discplayer/config.yaml` (user-specific)
- `/etc/mpd-discplayer/config.yaml` (system-wide)

## Full config example

```yaml
gnuHelloEmail: "your-email@example.com"
gnuDbUrl: "https://gnudb.gnudb.org"

MPDConnection:
  Type: "unix"
  Address: "/run/user/1000/mpd/socket"
  ReconnectWait: 30

MPDLibraryFolder: "/var/lib/mpd/music"
MPDCueSubfolder: ".disc-cuer"
MPDUSBSubfolder: ".udisks"
MountConfig: "mpd"
DiscSpeed: 12

SoundsLocation: "/usr/local/share/mpd-discplayer"
AudioBackend: "pulse"
PulseServer: ""

Schedule: {}
```

## MPD connection

```yaml
MPDConnection:
  Type: "unix"              # "unix" (recommended) or "tcp"
  Address: "/run/user/1000/mpd/socket"  # socket path or host:port
  ReconnectWait: 30         # seconds between reconnection attempts
```

Using a Unix socket is recommended — it enables automatic discovery of MPD's `music_directory`, used to store CUE files and USB symlinks.

For TCP connections, set `Address` to `127.0.0.1:6600` (default).

## Audio CD

### Metadata sources

go-mpd-discplayer delegates CUE file generation to [go-disc-cuer](https://github.com/b0bbywan/go-disc-cuer), which queries GnuDB and MusicBrainz for track metadata and cover art.

```yaml
gnuHelloEmail: "your-email@example.com"  # required for GnuDB lookups
gnuDbUrl: "https://gnudb.gnudb.org"      # default
```

> **Note:** `gnuHelloEmail` is mandatory to enable GnuDB lookups. Leave empty to use MusicBrainz only.

### Disc speed

```yaml
DiscSpeed: 12    # playback speed (default: 12x)
```

The drive runs at full speed during disc initialization (metadata read), then slows down for quiet playback.

### CUE file storage

```yaml
MPDCueSubfolder: ".disc-cuer"   # subfolder in MPD music directory
```

CUE files are cached in `<MPDLibraryFolder>/<MPDCueSubfolder>/`.

See [disc-cuer](/disc-player/disc-cuer/) for standalone usage and configuration.

## USB flash drives

### Mount mode

```yaml
MountConfig: "mpd"          # "mpd" (native MPD mounting) or "symlink"
MPDLibraryFolder: "/var/lib/mpd/music"   # auto-discovered with unix socket
MPDUSBSubfolder: ".udisks"  # only used with "symlink" mode
```

- **`mpd`** — uses MPD's native udisks2 mounting. Requires the `neighbors` plugin in MPD config.
- **`symlink`** — creates symlinks in MPD's music directory. Works with any MPD setup.

### Polkit rule (headless systems)

On headless systems, udisks2 may deny mount requests. The odio installer deploys this rule automatically at `/etc/polkit-1/rules.d/80-mpd-udisks.rules`:

```javascript
polkit.addRule(function(action, subject) {
    if ((action.id == "org.freedesktop.udisks2.filesystem-mount" ||
         action.id == "org.freedesktop.udisks2.filesystem-mount-other-seat") &&
        subject.user == "<username>") {
        return polkit.Result.YES;
    }
});
```

On desktop systems with a graphical session, this rule is not needed.

## MPD configuration

mpd-discplayer requires specific MPD plugins to be enabled. Add the following to your MPD config:

```
# Audio CD support
input {
    plugin "cdio_paranoia"
}

# CUE sheet support (enables cover art in MPD clients)
playlist_plugin {
    name "cue"
    enabled "true"
    as_folder "true"
}
```

For USB support with `MountConfig: "mpd"`, also add:

```
# USB mounting via udisks2
neighbors {
    plugin "udisks"
}

# Required with neighbors plugin
database {
    plugin "simple"
    path "~/.local/share/mpd/db"
    cache_directory "~/.local/share/mpd/cache"
}
```

## Scheduled playback

Automate playback of any MPD-compatible URI on a cron schedule:

```yaml
Schedule:
  # Reggae radio on weekdays at 6:30 AM
  "30 6 * * 1-5": "//hd.lagrosseradio.info/lagrosseradio-reggae-192.mp3"
  # Audio CD on Saturdays at 9:00 AM
  "0 9 * * 6": "cdda://"
  # USB device on Sundays at 9:00 PM
  "0 21 * * 0": "{usb_label}"
```

Invalid cron expressions are discarded and logged on startup. A notification is triggered before starting scheduled playback.

## Audio notifications

```yaml
AudioBackend: "pulse"       # "pulse" (default), "alsa", or "none"
PulseServer: ""             # PulseAudio server string (empty = local socket)
SoundsLocation: "/usr/local/share/mpd-discplayer"
```

Notifications expect `in.pcm`, `out.pcm`, and `error.pcm` files in `SoundsLocation`. If missing, notifications are disabled.

## Environment variables

All options can be set via environment variables prefixed with `MPD_DISCPLAYER_`:

| Variable | Config key | Default |
|---|---|---|
| `MPD_DISCPLAYER_GNUHELLOEMAIL` | `gnuHelloEmail` | *(empty, disables GnuDB)* |
| `MPD_DISCPLAYER_GNUDBURL` | `gnuDbUrl` | `https://gnudb.gnudb.org` |
| `MPD_DISCPLAYER_MPDCONNECTION_TYPE` | `MPDConnection.Type` | `tcp` |
| `MPD_DISCPLAYER_MPDCONNECTION_ADDRESS` | `MPDConnection.Address` | `127.0.0.1:6600` |
| `MPD_DISCPLAYER_MPDCONNECTION_RECONNECTWAIT` | `MPDConnection.ReconnectWait` | `30` |
| `MPD_DISCPLAYER_MPDLIBRARYFOLDER` | `MPDLibraryFolder` | `/var/lib/mpd/music` |
| `MPD_DISCPLAYER_DISCSPEED` | `DiscSpeed` | `12` |
| `MPD_DISCPLAYER_MOUNTCONFIG` | `MountConfig` | `mpd` |
| `MPD_DISCPLAYER_MPDCUESUBFOLDER` | `MPDCueSubfolder` | `.disc-cuer` |
| `MPD_DISCPLAYER_MPDUSBSUBFOLDER` | `MPDUSBSubfolder` | `.udisks` |
| `MPD_DISCPLAYER_AUDIOBACKEND` | `AudioBackend` | `pulse` |
| `MPD_DISCPLAYER_PULSESERVER` | `PulseServer` | *(empty)* |
| `MPD_DISCPLAYER_SOUNDSLOCATION` | `SoundsLocation` | `/usr/local/share/mpd-discplayer` |
