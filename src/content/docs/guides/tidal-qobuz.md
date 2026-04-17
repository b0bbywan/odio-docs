---
title: Tidal & Qobuz
description: Tidal Connect and Qobuz streaming support via upmpdcli.
---

Tidal Connect and Qobuz streaming are available via [upmpdcli](https://www.lesbonscomptes.com/upmpdcli/). Configuration is done in upmpdcli's config file — see the official documentation:

- [Tidal streaming parameters](https://www.lesbonscomptes.com/upmpdcli/pages/upmpdcli-manual.html#_tidal_streaming_service_parameters)
- [Qobuz streaming parameters](https://www.lesbonscomptes.com/upmpdcli/pages/upmpdcli-manual.html#_qobuz_streaming_service_parameters)

Once configured, restart upmpdcli:

```bash
systemctl --user restart upmpdcli.service
```

With Tidal or Qobuz enabled, upmpdcli becomes a full music library — you can browse, search, and play directly from any UPnP control point (e.g. BubbleDS Next or BubbleUPnP), in addition to its role as a DLNA renderer.

If you have set up Tidal or Qobuz with odio, help us improve this page — [open an issue](https://github.com/b0bbywan/odios/issues).
