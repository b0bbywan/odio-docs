---
title: Zeroconf
description: mDNS auto-discovery on the local network.
---

The Zeroconf backend advertises the node on the local network via mDNS/DNS-SD as `_http._tcp.local.` (instance `odio-api`).

This lets native clients like Home Assistant discover nodes automatically — no manual IP entry. Web applications cannot use Zeroconf (browsers don't have access to UDP multicast), which is why the [odio application](/guides/pwa/) requires manual configuration.

## Endpoints

The Zeroconf backend has no REST endpoints — it only handles mDNS advertisement in the background.

## Configuration

```yaml
zeroconf:
  enabled: true
```

Zeroconf is automatically disabled when the API is bound to loopback only.
