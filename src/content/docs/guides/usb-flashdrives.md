---
title: USB flash drives
description: Plug in a USB stick and music starts playing automatically.
---

Plug a USB flash drive with audio files into your Pi. After a few seconds, playback starts automatically via [go-mpd-discplayer](https://github.com/b0bbywan/go-mpd-discplayer).

## How it works

[go-mpd-discplayer](https://github.com/b0bbywan/go-mpd-discplayer) monitors udev for USB block device events. When a stick is inserted, it mounts the filesystem via udisks2, triggers an MPD database update, and starts playback. The previous queue is replaced with the stick's content. See [MPD Disc Player](/disc-player/overview/) for installation, configuration, and standalone usage.

Video files (.mkv, .mp4, etc.) are ignored automatically.

When you remove the stick, its tracks are removed from the active queue.

### Polkit rule

Mounting USB devices from a user session requires a polkit rule to authorize udisks2 operations. The odio installer deploys this automatically:

```
/etc/polkit-1/rules.d/80-mpd-udisks.rules
```

```javascript
polkit.addRule(function(action, subject) {
    if ((action.id == "org.freedesktop.udisks2.filesystem-mount" ||
         action.id == "org.freedesktop.udisks2.filesystem-mount-other-seat") &&
        subject.user == "odio") {
        return polkit.Result.YES;
    }
});
```

On headless systems, the odio installer deploys this polkit rule to allow the odio user to mount USB filesystems as a normal user, without sudo.

On desktop systems with a graphical session, this rule is not needed — udisks2 already grants these permissions.

## Multiple sticks

If you plug in a second stick, it replaces the first in the queue. The first stick's content remains browsable in MPD's database as long as it stays plugged in.

## Playback controls

Same as any other MPD source — controllable from the odio application, Home Assistant, or any MPD client.

![Embedded UI playing a USB flash drive via MPD — track metadata displayed without cover art](../../../assets/usb-playback.png)

> **Note:** Cover art is not yet displayed in the embedded UI for USB playback. mpDris2 does not currently forward cover art via MPRIS — this is a work in progress.

From an MPD client like MALP, cover art and full track metadata are available — as long as the USB drive contains a `cover.jpg`, `cover.png`, `cover.tiff`, or `cover.bmp` in the same folder as the audio files (or embedded art in the file tags).

![MALP Android app playing a USB track with album cover art, seek bar, and playback controls](../../../assets/malp-usb-playback.png)

![MALP showing the full USB tracklist with artist, album, and track durations](../../../assets/malp-usb-tracklist.png)
