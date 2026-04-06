---
title: MPD Disc Player
description: Automated audio CD and USB flash drive playback for MPD.
---

[go-mpd-discplayer](https://github.com/b0bbywan/go-mpd-discplayer) is a daemon that automates audio disc and USB flash drive playback with MPD. Insert a CD or plug in a USB stick — playback starts automatically with full metadata and cover art.

go-mpd-discplayer is part of the [odio project](https://odio.love) but is a standalone project — it works with any MPD setup. Installed and configured automatically by the [odio installer](/guides/installation/). For standalone use, see [Installation](/disc-player/installation/).

## Features

- **Audio CD playback** — detects disc insertion, fetches metadata from [GnuDB](https://gnudb.org/) and [MusicBrainz](https://musicbrainz.org/) via [go-disc-cuer](https://github.com/b0bbywan/go-disc-cuer), generates a CUE sheet, and feeds it to MPD. Individual tracks appear in the queue with proper names and cover art.
- **USB flash drive playback** — monitors udev for USB block device events, mounts via udisks2, triggers an MPD database update, and starts playback. Video files are ignored automatically.
- **Automatic cleanup** — eject a disc or remove a USB stick, its tracks are removed from the queue.
- **Scheduled playback** — cron-based scheduling for webradios, CDs, USB devices, or any MPD URI.
- **Audio notifications** — configurable sound notifications for device events (insertion, removal) and errors.
- **Reconnection** — automatic reconnection to the MPD server if the connection is lost.

## How it works

### Audio CDs

go-mpd-discplayer detects disc insertion, reads the disc ID, and delegates CUE file generation to [go-disc-cuer](https://github.com/b0bbywan/go-disc-cuer). disc-cuer queries GnuDB and MusicBrainz for artist, album, and track information, caches the result, and returns a CUE sheet. go-mpd-discplayer feeds it to MPD. The drive speed is managed automatically: full speed during disc initialization, then reduced for quiet playback.

### USB flash drives

go-mpd-discplayer monitors udev for USB block device events. When a stick is inserted, it mounts the filesystem via udisks2, triggers an MPD database update, and starts playback. The previous queue is replaced with the stick's content. If you plug in a second stick, it replaces the first in the queue.
