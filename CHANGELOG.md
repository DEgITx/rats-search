<a name="0.19.1"></a>
## [0.19.1](https://github.com/DEgITx/rats-search/compare/v0.19.0...v0.19.1) (2018-04-30)


### Bug Fixes

* **donate:** more relevant donate view, display also patreon donate :) ([7152b36](https://github.com/DEgITx/rats-search/commit/7152b36))

<a name="0.19.0"></a>
# [0.19.0](https://github.com/DEgITx/rats-search/compare/v0.18.0...v0.19.0) (2018-04-26)


### Bug Fixes

* **content:** basic adult filtration ([6a85538](https://github.com/DEgITx/rats-search/commit/6a85538))
* **header:** more pleasant animation ([3690d3a](https://github.com/DEgITx/rats-search/commit/3690d3a))
* **peerdb:** transfer data fix ([cd054b3](https://github.com/DEgITx/rats-search/commit/cd054b3))
* **search:** fix some unsafe results in safe search ([541acca](https://github.com/DEgITx/rats-search/commit/541acca))
* **search:** show types of torrents on files search fix ([4b8ef41](https://github.com/DEgITx/rats-search/commit/4b8ef41))
* **store:** store on all peers ([ed9c323](https://github.com/DEgITx/rats-search/commit/ed9c323))
* **vote:** proper vote data sequencing ([e87e51e](https://github.com/DEgITx/rats-search/commit/e87e51e))
* **votes:** actual votes display works now ([75e7159](https://github.com/DEgITx/rats-search/commit/75e7159))


### Features

* **filters:** adult filter ([6aa952a](https://github.com/DEgITx/rats-search/commit/6aa952a))
* **filters:** some examples of regex [#25](https://github.com/DEgITx/rats-search/issues/25) ([b112900](https://github.com/DEgITx/rats-search/commit/b112900))
* **header:** fixed header on main window ([e7cda54](https://github.com/DEgITx/rats-search/commit/e7cda54))
* **peerDB:** store on peers feature ([912be10](https://github.com/DEgITx/rats-search/commit/912be10))
* **replication:** replicate torrent on open ([6acf17f](https://github.com/DEgITx/rats-search/commit/6acf17f))
* **search:** separate adult remote content on search ([660192e](https://github.com/DEgITx/rats-search/commit/660192e))
* **vote:** replicate torrent on voting ([d524ff4](https://github.com/DEgITx/rats-search/commit/d524ff4))
* **vote:** restored voting (now working over p2p) ([9caa593](https://github.com/DEgITx/rats-search/commit/9caa593))


### Performance Improvements

* **peerdb:** faster store sync ([fc0388c](https://github.com/DEgITx/rats-search/commit/fc0388c))
* **top:** less cpu usage on top page update ([b39a933](https://github.com/DEgITx/rats-search/commit/b39a933))

<a name="0.18.0"></a>
# [0.18.0](https://github.com/DEgITx/rats-search/compare/v0.17.1...v0.18.0) (2018-04-07)


### Bug Fixes

* **server:** little makeup for server version ([99115f9](https://github.com/DEgITx/rats-search/commit/99115f9))
* **server:** restored server messages ([e9da8db](https://github.com/DEgITx/rats-search/commit/e9da8db))


### Features

* **p2p:** random peer exchange ([c2a0933](https://github.com/DEgITx/rats-search/commit/c2a0933))
* **search:** show current request with text [#23](https://github.com/DEgITx/rats-search/issues/23) ([e3ab4d4](https://github.com/DEgITx/rats-search/commit/e3ab4d4))
* **server:** seperate server part and ability to run server without electron ([3246d15](https://github.com/DEgITx/rats-search/commit/3246d15))
* **web:** web version available again ([bfbc660](https://github.com/DEgITx/rats-search/commit/bfbc660))

<a name="0.17.1"></a>
## [0.17.1](https://github.com/DEgITx/rats-search/compare/v0.17.0...v0.17.1) (2018-04-04)


### Bug Fixes

* **db:** fix search index on replication ([969d8dc](https://github.com/DEgITx/rats-search/commit/969d8dc))
* **db:** ignore patching already created db ([4e22eb1](https://github.com/DEgITx/rats-search/commit/4e22eb1))
* **db:** optimization after patching ([f14aefd](https://github.com/DEgITx/rats-search/commit/f14aefd))
* **db:** resolving old database indexes ([cfd4459](https://github.com/DEgITx/rats-search/commit/cfd4459))
* **filter:** cleaning fix on big db ([07c931c](https://github.com/DEgITx/rats-search/commit/07c931c))
* **tests:** fixed patching on tests ([8d7359e](https://github.com/DEgITx/rats-search/commit/8d7359e))

<a name="0.17.0"></a>
# [0.17.0](https://github.com/DEgITx/rats-search/compare/v0.16.2...v0.17.0) (2018-04-01)


### Bug Fixes

* **p2p:** save only existing peers ([e74c68f](https://github.com/DEgITx/rats-search/commit/e74c68f))
* **peers:** fix display peers count in gui ([a255c47](https://github.com/DEgITx/rats-search/commit/a255c47))
* **tests:** fix net code on test env ([cb022b0](https://github.com/DEgITx/rats-search/commit/cb022b0))
* **tests:** fix quit timeout ([efff28a](https://github.com/DEgITx/rats-search/commit/efff28a))


### Features

* **bootstrap:** reserved p2p peers server ([13e0107](https://github.com/DEgITx/rats-search/commit/13e0107))
* **filter:** naming filtering [#17](https://github.com/DEgITx/rats-search/issues/17) ([d766f94](https://github.com/DEgITx/rats-search/commit/d766f94))
* **filter:** torrents filters (basic maxFiles filter) ([37d5d18](https://github.com/DEgITx/rats-search/commit/37d5d18))

<a name="0.16.2"></a>
## [0.16.2](https://github.com/DEgITx/rats-search/compare/v0.16.1...v0.16.2) (2018-03-31)


### Bug Fixes

* **replication:** show correct torrent types on replication ([3c6698e](https://github.com/DEgITx/rats-search/commit/3c6698e))

<a name="0.16.1"></a>
## [0.16.1](https://github.com/DEgITx/rats-search/compare/v0.16.0...v0.16.1) (2018-03-30)


### Bug Fixes

* **p2p:** fix torrents count ([d4b9958](https://github.com/DEgITx/rats-search/commit/d4b9958))

<a name="0.16.0"></a>
# [0.16.0](https://github.com/DEgITx/rats-search/compare/v0.15.2...v0.16.0) (2018-03-30)


### Bug Fixes

* **db:** fix some null values errors ([640cadd](https://github.com/DEgITx/rats-search/commit/640cadd))
* **linux:** 32bit linux builds [#21](https://github.com/DEgITx/rats-search/issues/21) ([5a0da90](https://github.com/DEgITx/rats-search/commit/5a0da90))
* **replication:** enable replication by default ([6e8b01a](https://github.com/DEgITx/rats-search/commit/6e8b01a))
* **replication:** fix error on replication ([7ab42e9](https://github.com/DEgITx/rats-search/commit/7ab42e9))


### Features

* **p2p:** app version on p2p ([8c4e659](https://github.com/DEgITx/rats-search/commit/8c4e659))
* **p2p:** show torrents number of other clients ([a4fa0b1](https://github.com/DEgITx/rats-search/commit/a4fa0b1))

<a name="0.15.2"></a>
## [0.15.2](https://github.com/DEgITx/rats-search/compare/v0.15.1...v0.15.2) (2018-03-28)


### Bug Fixes

* **settings:** save settings fix [#19](https://github.com/DEgITx/rats-search/issues/19) ([7544de3](https://github.com/DEgITx/rats-search/commit/7544de3))

<a name="0.15.1"></a>
## [0.15.1](https://github.com/DEgITx/rats-search/compare/v0.15.0...v0.15.1) (2018-03-27)


### Bug Fixes

* **top:** remote top shown fix ([2f66398](https://github.com/DEgITx/rats-search/commit/2f66398))

<a name="0.15.0"></a>
# [0.15.0](https://github.com/DEgITx/rats-search/compare/v0.14.1...v0.15.0) (2018-03-26)


### Bug Fixes

* **portable:** portable win32 build ([bec76e7](https://github.com/DEgITx/rats-search/commit/bec76e7))
* **top:** fix week and month top load ([84cd86d](https://github.com/DEgITx/rats-search/commit/84cd86d))


### Features

* **header:** back to main button at top ([0cb81ec](https://github.com/DEgITx/rats-search/commit/0cb81ec))
* **top:** categories to tab items and new items load ([6f1a3c3](https://github.com/DEgITx/rats-search/commit/6f1a3c3))
* **top:** p2p top search ([7f10267](https://github.com/DEgITx/rats-search/commit/7f10267))
* **win:** win 32bit build ([80f56aa](https://github.com/DEgITx/rats-search/commit/80f56aa)), closes [#18](https://github.com/DEgITx/rats-search/issues/18)

<a name="0.14.1"></a>
## [0.14.1](https://github.com/DEgITx/rats-search/compare/v0.14.0...v0.14.1) (2018-03-17)


### Bug Fixes

* **p2p:** still fix adding youself to list ([bfad498](https://github.com/DEgITx/rats-search/commit/bfad498))

<a name="0.14.0"></a>
# [0.14.0](https://github.com/DEgITx/rats-search/compare/v0.13.0...v0.14.0) (2018-03-17)


### Bug Fixes

* **p2p:** disconnect on protocol bad handshake on server side ([c6b73ee](https://github.com/DEgITx/rats-search/commit/c6b73ee))
* **portable:** fix error on renaming portable directory ([4714728](https://github.com/DEgITx/rats-search/commit/4714728))
* **ssh:** fix closing ssh on exit ([426886d](https://github.com/DEgITx/rats-search/commit/426886d))


### Features

* **menu:** new menu items (support) ([c6b28f0](https://github.com/DEgITx/rats-search/commit/c6b28f0))
* **menu:** version as menu item ([e139256](https://github.com/DEgITx/rats-search/commit/e139256))
* **p2p:** tunnels support for bad peers ([ec143d9](https://github.com/DEgITx/rats-search/commit/ec143d9))
* **ssh:** fix key store ([5b26500](https://github.com/DEgITx/rats-search/commit/5b26500))

<a name="0.13.0"></a>
# [0.13.0](https://github.com/DEgITx/rats-search/compare/v0.12.0...v0.13.0) (2018-03-13)


### Bug Fixes

* **gui:** fix date displaing in torrent details ([3d6baca](https://github.com/DEgITx/rats-search/commit/3d6baca))
* **gui:** loading progress when open top ([a06a81a](https://github.com/DEgITx/rats-search/commit/a06a81a))
* **info:** fix info files limitation in output ([6285ab4](https://github.com/DEgITx/rats-search/commit/6285ab4))
* **p2p:** fix connection by yourself in process ([ce08b3b](https://github.com/DEgITx/rats-search/commit/ce08b3b))
* **scanner:** always add id - replication fix ([979ef1b](https://github.com/DEgITx/rats-search/commit/979ef1b))


### Features

* **gui:** compact header design ([9566c77](https://github.com/DEgITx/rats-search/commit/9566c77))
* **gui:** new header design (more compressed) ([51ecfd0](https://github.com/DEgITx/rats-search/commit/51ecfd0))
* **gui:** settings on header ([93dd5af](https://github.com/DEgITx/rats-search/commit/93dd5af))
* **manual:** usage manual (help) in menu ([7420544](https://github.com/DEgITx/rats-search/commit/7420544))
* **p2p:** p2p torrents replication ([999ab0c](https://github.com/DEgITx/rats-search/commit/999ab0c))

<a name="0.12.0"></a>
# [0.12.0](https://github.com/DEgITx/rats-search/compare/v0.11.0...v0.12.0) (2018-03-10)


### Bug Fixes

* **gui:** typo in save settings ([8043f4a](https://github.com/DEgITx/rats-search/commit/8043f4a))
* **macos:** mac os icon size fix [#10](https://github.com/DEgITx/rats-search/issues/10) ([b6a7f85](https://github.com/DEgITx/rats-search/commit/b6a7f85))


### Features

* **config:** peers number settings ([61d0f25](https://github.com/DEgITx/rats-search/commit/61d0f25))
* **p2p:** bootstrap peers ([3292e8f](https://github.com/DEgITx/rats-search/commit/3292e8f))
* **p2p:** life peers exchange ([8035e57](https://github.com/DEgITx/rats-search/commit/8035e57))
* **p2p:** peers limitation to prevent connection spam ([9177691](https://github.com/DEgITx/rats-search/commit/9177691))
* **portable:** portable win64 version support [#9](https://github.com/DEgITx/rats-search/issues/9) ([f16393b](https://github.com/DEgITx/rats-search/commit/f16393b))
* **search:** add 100 mb interval to search [#12](https://github.com/DEgITx/rats-search/issues/12) ([ddaf9e1](https://github.com/DEgITx/rats-search/commit/ddaf9e1))

<a name="0.11.0"></a>
# [0.11.0](https://github.com/DEgITx/rats-search/compare/v0.10.0...v0.11.0) (2018-03-07)


### Bug Fixes

* **changelog:** fix modal peers display ([fb3a28b](https://github.com/DEgITx/rats-search/commit/fb3a28b))
* **p2p:** situation when ignoring yourself address is very slow ([d55c8f2](https://github.com/DEgITx/rats-search/commit/d55c8f2))
* **search:** show torrent page from remote peer ([9a69f07](https://github.com/DEgITx/rats-search/commit/9a69f07))


### Features

* **donate:** donate window ([da3a646](https://github.com/DEgITx/rats-search/commit/da3a646))
* **download:** torrent downloads manager ([73d2c3c](https://github.com/DEgITx/rats-search/commit/73d2c3c))
* **gui:** access to top from menu ([20bd280](https://github.com/DEgITx/rats-search/commit/20bd280))

<a name="0.10.0"></a>
# [0.10.0](https://github.com/DEgITx/rats-search/compare/v0.9.0...v0.10.0) (2018-03-03)


### Bug Fixes

* **gui:** cleanup footer ([ebda2d7](https://github.com/DEgITx/rats-search/commit/ebda2d7))
* **gui:** some incorrect information removed from top header ([894bcaf](https://github.com/DEgITx/rats-search/commit/894bcaf))
* **log:** dont show any upnp messages in log ([bf9af3f](https://github.com/DEgITx/rats-search/commit/bf9af3f))
* **network:** fix stun error on startup if no network available ([09de03a](https://github.com/DEgITx/rats-search/commit/09de03a)), closes [#7](https://github.com/DEgITx/rats-search/issues/7)
* **p2p:** fix back connection ([cce0f9a](https://github.com/DEgITx/rats-search/commit/cce0f9a))
* **p2p:** some ignoring of local addresses ([835038b](https://github.com/DEgITx/rats-search/commit/835038b))
* **search:** merge files in search when same torrent twice in a row ([22d3173](https://github.com/DEgITx/rats-search/commit/22d3173))
* **vote:** just disable for future improvements in p2p ([1d318d7](https://github.com/DEgITx/rats-search/commit/1d318d7))


### Features

* **p2p:** peers backup on exit ([449460d](https://github.com/DEgITx/rats-search/commit/449460d))
* **p2p:** peers exchange ([dfd8378](https://github.com/DEgITx/rats-search/commit/dfd8378))
* **p2p:** protocol check and support responce p2p connection ([b37bbb4](https://github.com/DEgITx/rats-search/commit/b37bbb4))
* **search:** visual separate p2p torrents ([43780bc](https://github.com/DEgITx/rats-search/commit/43780bc))
* **secure:** responce only to rats messages ([16aa63e](https://github.com/DEgITx/rats-search/commit/16aa63e))

<a name="0.9.0"></a>
# [0.9.0](https://github.com/DEgITx/rats-search/compare/v0.8.0...v0.9.0) (2018-03-02)


### Features

* **network:** UPnP support ([6ba0d05](https://github.com/DEgITx/rats-search/commit/6ba0d05))

<a name="0.8.0"></a>
# [0.8.0](https://github.com/DEgITx/rats-search/compare/v0.7.1...v0.8.0) (2018-03-01)


### Features

* **config:** new scanning options ([b946877](https://github.com/DEgITx/rats-search/commit/b946877))
* **config:** some network limitations ([1751ad6](https://github.com/DEgITx/rats-search/commit/1751ad6))
* **menu:** report bug in application ([1a8af14](https://github.com/DEgITx/rats-search/commit/1a8af14))


### Performance Improvements

* **network:** limit package usage ([f6a8e89](https://github.com/DEgITx/rats-search/commit/f6a8e89))
* **network:** network usage optimization ([e1e0074](https://github.com/DEgITx/rats-search/commit/e1e0074))

<a name="0.7.1"></a>
## [0.7.1](https://github.com/DEgITx/rats-search/compare/v0.7.0...v0.7.1) (2018-02-21)


### Bug Fixes

* **config:** settings port descriptions ([e7b30ab](https://github.com/DEgITx/rats-search/commit/e7b30ab))
* **p2p:** errors on peers ignore ([4b21c38](https://github.com/DEgITx/rats-search/commit/4b21c38))

<a name="0.7.0"></a>
# [0.7.0](https://github.com/DEgITx/rats-search/compare/v0.6.1...v0.7.0) (2018-02-18)


### Bug Fixes

* **app:** messaging on closing ([f117b61](https://github.com/DEgITx/rats-search/commit/f117b61))
* **config:** color of search indicator ([69c391b](https://github.com/DEgITx/rats-search/commit/69c391b))
* **p2p:** closing on end ([a1c9adb](https://github.com/DEgITx/rats-search/commit/a1c9adb))
* **p2p:** closing on end reverted (it was ok by default) ([ee3df81](https://github.com/DEgITx/rats-search/commit/ee3df81))
* **p2p:** compact convert ip's ([b84c9da](https://github.com/DEgITx/rats-search/commit/b84c9da))
* **p2p:** fix disconnects after each call ([12d66ff](https://github.com/DEgITx/rats-search/commit/12d66ff))
* **p2p:** ignore errors on conn ([8e81bbc](https://github.com/DEgITx/rats-search/commit/8e81bbc))


### Features

* **app:** p2p peers indicator ([3d4dbd5](https://github.com/DEgITx/rats-search/commit/3d4dbd5))
* **config:** p2p enable/disable ([5bd2e75](https://github.com/DEgITx/rats-search/commit/5bd2e75))
* **p2p:** basic search retransfer ([da7ea2a](https://github.com/DEgITx/rats-search/commit/da7ea2a))
* **p2p:** files search also ([8c79960](https://github.com/DEgITx/rats-search/commit/8c79960))
* **p2p:** ignore your address ([f0f3692](https://github.com/DEgITx/rats-search/commit/f0f3692))
* **p2p:** other rats peers detection ([24c50d3](https://github.com/DEgITx/rats-search/commit/24c50d3))


### Performance Improvements

* **p2p:** reduce traffic of p2p calls ([cd6d0a2](https://github.com/DEgITx/rats-search/commit/cd6d0a2))

<a name="0.6.1"></a>
## [0.6.1](https://github.com/DEgITx/rats-search/compare/v0.6.0...v0.6.1) (2018-02-12)


### Bug Fixes

* **macos:** fix closing under some platforms ([c765145](https://github.com/DEgITx/rats-search/commit/c765145))

<a name="0.6.0"></a>
# [0.6.0](https://github.com/DEgITx/rats-search/compare/v0.5.0...v0.6.0) (2018-02-12)


### Bug Fixes

* **macos:** fix updates on Mac OS X ([91e4f93](https://github.com/DEgITx/rats-search/commit/91e4f93))
* **macos:** normal icon ([d138c85](https://github.com/DEgITx/rats-search/commit/d138c85))
* **windows:** start fix in some cases (possible win7 fix) ([45c408f](https://github.com/DEgITx/rats-search/commit/45c408f))


### Features

* **app:** allow run only single application at same time ([e942c03](https://github.com/DEgITx/rats-search/commit/e942c03))
* **log:** log autoupdate info ([1e5392d](https://github.com/DEgITx/rats-search/commit/1e5392d))
* **log:** system information ([023d33f](https://github.com/DEgITx/rats-search/commit/023d33f))

<a name="0.5.0"></a>
# [0.5.0](https://github.com/DEgITx/rats-search/compare/v0.4.0...v0.5.0) (2018-02-11)


### Bug Fixes

* **autoupdate:** fix error on downloading updater ([023bb97](https://github.com/DEgITx/rats-search/commit/023bb97))


### Features

* **autoupdate:** autoupdate on statup ([b308bb5](https://github.com/DEgITx/rats-search/commit/b308bb5))

<a name="0.4.0"></a>
# [0.4.0](https://github.com/DEgITx/rats-search/compare/v0.3.1...v0.4.0) (2018-02-10)


### Bug Fixes

* **app:** fix removing events on render process ([f1bfd41](https://github.com/DEgITx/rats-search/commit/f1bfd41))
* **app:** support additional arguments on messages ([f306c53](https://github.com/DEgITx/rats-search/commit/f306c53))
* **download:** bug when cancel button not appear in main page ([d317c30](https://github.com/DEgITx/rats-search/commit/d317c30))
* **download:** cancel controls on torrent element ([cd1f89c](https://github.com/DEgITx/rats-search/commit/cd1f89c))
* **download:** problem on dht api after delete torrent ([ea8bc01](https://github.com/DEgITx/rats-search/commit/ea8bc01))
* **image:** restored spinner on downloading metadata ([387945a](https://github.com/DEgITx/rats-search/commit/387945a))
* **unix:** resolve problem with icon part at some systems ([0e5e045](https://github.com/DEgITx/rats-search/commit/0e5e045)), closes [#3](https://github.com/DEgITx/rats-search/issues/3)


### Features

* **config:** download torrents directory in config ([9ac5539](https://github.com/DEgITx/rats-search/commit/9ac5539))
* **download:** basic torrent download support ([0abd516](https://github.com/DEgITx/rats-search/commit/0abd516))
* **download:** cancel downloading ([fd03491](https://github.com/DEgITx/rats-search/commit/fd03491))
* **download:** more control over torrent download ([395a30e](https://github.com/DEgITx/rats-search/commit/395a30e))
* **download:** torrent progress on torrent element ([70a7daa](https://github.com/DEgITx/rats-search/commit/70a7daa))
* **menu:** new context menu with copy/paste ([2bf8970](https://github.com/DEgITx/rats-search/commit/2bf8970))

<a name="0.3.1"></a>
## [0.3.1](https://github.com/DEgITx/rats-search/compare/v0.3.0...v0.3.1) (2018-02-06)


### Bug Fixes

* **windows:** resolve some encoding problem with search daemon process ([91c99d1](https://github.com/DEgITx/rats-search/commit/91c99d1))

<a name="0.3.0"></a>
# [0.3.0](https://github.com/DEgITx/rats-search/compare/v0.2.0...v0.3.0) (2018-02-05)


### Bug Fixes

* **config:** fixed saving configuration on develop builds ([b640bd4](https://github.com/DEgITx/rats-search/commit/b640bd4))
* **feed:** disabled fake torrents for desktop ([101c1b6](https://github.com/DEgITx/rats-search/commit/101c1b6))


### Features

* **changelog:** changelog inside application ([988d714](https://github.com/DEgITx/rats-search/commit/988d714))
* **config:** database place path ([8d58a7f](https://github.com/DEgITx/rats-search/commit/8d58a7f))
* **config:** message when settings saved ([6b793aa](https://github.com/DEgITx/rats-search/commit/6b793aa))
* **config:** new settings for application (port, cpu usage eth.) ([6b5ee01](https://github.com/DEgITx/rats-search/commit/6b5ee01))

<a name="0.2.0"></a>
# [0.2.0](https://github.com/DEgITx/rats-search/compare/v0.1.0...v0.2.0) (2018-02-04)


### Bug Fixes

* **app:** fast and proper closing ([3123a82](https://github.com/DEgITx/rats-search/commit/3123a82))
* **config:** saving config restored ([ddc309e](https://github.com/DEgITx/rats-search/commit/ddc309e))
* **interface:** back button on save page ([342a64e](https://github.com/DEgITx/rats-search/commit/342a64e))
* **linux:** options on start ([a069a0e](https://github.com/DEgITx/rats-search/commit/a069a0e))
* **linux:** proper db use under linux ([0c60c0d](https://github.com/DEgITx/rats-search/commit/0c60c0d))
* **macos:** network category of application ([34c8f33](https://github.com/DEgITx/rats-search/commit/34c8f33))
* **macos:** proper work under MacOS X ([5a86c51](https://github.com/DEgITx/rats-search/commit/5a86c51))
* **scanner:** scanner second enable call ([c77f056](https://github.com/DEgITx/rats-search/commit/c77f056))
* **tests:** disable scanner tests ([7958a19](https://github.com/DEgITx/rats-search/commit/7958a19))


### Features

* **build:** semantic release messages scan ([af591e8](https://github.com/DEgITx/rats-search/commit/af591e8))
* **config:** saving configuration ([7247044](https://github.com/DEgITx/rats-search/commit/7247044))
* **db:** new database ([2703f8a](https://github.com/DEgITx/rats-search/commit/2703f8a))
* **readme:** readme ([adb0b49](https://github.com/DEgITx/rats-search/commit/adb0b49))
* **readme:** semantic release in readme ([8319dce](https://github.com/DEgITx/rats-search/commit/8319dce))
* **readme:** travis status build in readme ([f5b8b88](https://github.com/DEgITx/rats-search/commit/f5b8b88))
* **tests:** db test ([fdf528e](https://github.com/DEgITx/rats-search/commit/fdf528e))
* **tests:** new scanner test ([0c6544f](https://github.com/DEgITx/rats-search/commit/0c6544f))
