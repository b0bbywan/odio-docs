---
title: Audio notifications
description: Audible feedback for system events — power, device connections, errors.
---

import { Badge } from '@astrojs/starlight/components';

<Badge text="Incoming" variant="caution" />

Audio notifications will provide audible feedback for key system events through PulseAudio:

- Power on / off
- Device connected / disconnected (Bluetooth, USB, CD)
- Error

Powered by [go-odio-notify](/notify/overview/), integrated into [go-mpd-discplayer](/disc-player/overview/) and [go-odio-api](/api/overview/).
