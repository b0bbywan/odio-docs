---
title: Bluetooth
description: Use your Pi as a Bluetooth speaker — pair, play, and control from your phone.
---

Your odio node works like a commercial Bluetooth speaker via [BlueZ](https://www.bluez.org/). Pair your phone, play music, control everything from the odio UI or Home Assistant.

## First pairing

1. Tap **Pairing** from the embedded UI, the application, or Home Assistant — this powers on Bluetooth automatically if needed and makes the node discoverable until a device connects or the timeout expires (60 seconds by default).

![odio embedded UI in pairing mode with countdown timer](../../../assets/bt-pairing-countdown.png)

2. On your phone, go to Bluetooth settings — your odio node appears with a headphone icon.

![Android Bluetooth settings showing the odio node as an available device](../../../assets/bt-phone-discover.png)

3. Tap the odio node. Your phone asks to confirm the pairing — accept it.

![Android pairing confirmation dialog for the odio node](../../../assets/bt-phone-confirm.png)

4. That's it. The device is automatically trusted for future connections. No PIN, no confirmation on the Pi.

![Android showing the odio node as a connected active media device](../../../assets/bt-phone-connected.png)

## Reconnecting

Once paired, your phone remembers the odio node. To reconnect:

1. Power on Bluetooth on the odio node.
2. Your phone reconnects automatically if odio was the last paired speaker.

If your phone doesn't reconnect on its own, just select the odio node from your phone's Bluetooth settings — no need to enter pairing mode again.

## Playback controls

Once connected, your phone streams audio to the Pi over A2DP. The connected device appears as a media player in the embedded UI and Home Assistant with:

- Track info (artist, title, album) via AVRCP/MPRIS
- Play / pause / next / previous
- Bidirectional volume sync — change volume on your phone or in the UI

This works with any app on your phone: Spotify, YouTube, Apple Music, podcasts, anything.

![Embedded UI showing a Bluetooth device streaming music — phone appears as a media player and audio client](../../../assets/bt-playing.png)

## Power management

Bluetooth can be powered on and off from the API, the application, or Home Assistant. If no device is connected for a configurable period, the adapter auto-powers down to save energy.

## Configuration

The Bluetooth device name shown during pairing and the full BlueZ setup (device class, group membership, mpris-proxy) are documented in [API Configuration — Bluetooth](/api/configuration/#bluetooth). The installer configures this automatically — edit `/etc/bluetooth/main.conf` if you want to change the advertised name.
