// Projects odio builds on, where the fix went upstream instead of into a fork.
// The stats script asks GitHub for merged PRs and issues authored by the
// maintainer in these repos only: an unscoped `author:` search also returns
// years of work on unrelated projects, which has nothing to do with odio.
// `why` says what the project does for odio, so a reader can tell why the
// contribution was made at all.
export const upstreamProjects = [
  {
    repo: 'jfreymuth/pulse',
    why: 'Pure-Go PulseAudio client library behind go-odio-notify',
  },
  {
    repo: 'diwic/alsa-sys',
    why: 'Rust bindings to libasound, hit while cross-compiling audio software for 32-bit Raspberry Pi OS',
  },
  {
    repo: 'vicrodh/qbz',
    why: 'Qobuz client, being packaged for the Raspberry Pi',
  },
  {
    repo: 'MusicPlayerDaemon/website',
    why: "MPD's client directory, where mpd2mpris and go-mpd-discplayer are listed",
  },
  {
    repo: 'jcorporation/myMPD',
    why: 'MPD web client shipped by odio and republished to apt.odio.love',
  },
  {
    repo: 'jcorporation/webradiodb',
    why: "Station database behind myMPD's webradio browser",
  },
];
