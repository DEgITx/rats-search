## [1.1.1](https://github.com/DEgITx/rats-search/compare/v1.1.0...v1.1.1) (2019-01-26)


### Bug Fixes

* **portative:** fix updater check [#71](https://github.com/DEgITx/rats-search/issues/71) ([b524845](https://github.com/DEgITx/rats-search/commit/b524845))

# [1.1.0](https://github.com/DEgITx/rats-search/compare/v1.0.0...v1.1.0) (2019-01-26)


### Bug Fixes

* **1337x:** proper poster in some cases ([515d30c](https://github.com/DEgITx/rats-search/commit/515d30c))
* **arm:** ignore relay on arm [#66](https://github.com/DEgITx/rats-search/issues/66) ([e8cb4d8](https://github.com/DEgITx/rats-search/commit/e8cb4d8))
* **build:** fix production build after upgrade to new engine ([09ef602](https://github.com/DEgITx/rats-search/commit/09ef602))
* **p2p:** fix files in db count on new architecture ([073eefe](https://github.com/DEgITx/rats-search/commit/073eefe))
* **p2p:** potencial problem with some p2p decoding messages ([db48f44](https://github.com/DEgITx/rats-search/commit/db48f44))
* **tests:** fix check of starting download ([0dee20d](https://github.com/DEgITx/rats-search/commit/0dee20d))
* **tests:** more timeout time for some strategies ([471efc1](https://github.com/DEgITx/rats-search/commit/471efc1))


### Features

* **arm:** added testing arm support ([8b9f9f6](https://github.com/DEgITx/rats-search/commit/8b9f9f6))
* **core:** updated to new browser engine ([2370847](https://github.com/DEgITx/rats-search/commit/2370847))
* **strategies:** 1337 strategie ([3f75cce](https://github.com/DEgITx/rats-search/commit/3f75cce))
* **strategies:** autoload trackers strategies ([4367da9](https://github.com/DEgITx/rats-search/commit/4367da9))
* **ui:** settings tabs ([5cb119f](https://github.com/DEgITx/rats-search/commit/5cb119f))


### Performance Improvements

* **start:** simplify some init statistic calls ([c788569](https://github.com/DEgITx/rats-search/commit/c788569))

# [1.0.0](https://github.com/DEgITx/rats-search/compare/v0.30.1...v1.0.0) (2018-12-02)


### Bug Fixes

* **feed:** rating also accumulate for times over ([b72d365](https://github.com/DEgITx/rats-search/commit/b72d365))


### Performance Improvements

* **architecture:** Big performance improvements over big databases and files highlight in search. ([#63](https://github.com/DEgITx/rats-search/issues/63)) ([92d0d13](https://github.com/DEgITx/rats-search/commit/92d0d13))


### BREAKING CHANGES

* **architecture:** databases v6 and v7 are incompatible and need a lot of time for updating (may be even some days/a lot of hours on very big databases)

## [0.30.1](https://github.com/DEgITx/rats-search/compare/v0.30.0...v0.30.1) (2018-10-17)


### Bug Fixes

* **config:** fully disable p2p activity if option with p2p search disabled ([20f9a6b](https://github.com/DEgITx/rats-search/commit/20f9a6b))
* **downloading:** fix continue downloading on selection ([d4608b6](https://github.com/DEgITx/rats-search/commit/d4608b6))
* **downloading:** fix finishing files in some cases ([b7cd443](https://github.com/DEgITx/rats-search/commit/b7cd443))
* **windows:** fix starting under some path'es ([2c11120](https://github.com/DEgITx/rats-search/commit/2c11120))

# [0.30.0](https://github.com/DEgITx/rats-search/compare/v0.29.3...v0.30.0) (2018-09-02)


### Bug Fixes

* **feed:** temporary hide adult torrents from feed ([b23fabd](https://github.com/DEgITx/rats-search/commit/b23fabd))
* **gui:** fix some warnings ([cb1c1f4](https://github.com/DEgITx/rats-search/commit/cb1c1f4))
* **rutor:** fix problems with dir creation ([b09dc9b](https://github.com/DEgITx/rats-search/commit/b09dc9b))
* **rutor:** fix x rutor file update ([c2d8de5](https://github.com/DEgITx/rats-search/commit/c2d8de5))
* **rutor:** little fix ([9ec6aaf](https://github.com/DEgITx/rats-search/commit/9ec6aaf))
* **tests:** rutor test ([9316463](https://github.com/DEgITx/rats-search/commit/9316463))
* **top:** fix top tab redraw bug regression in v0.29.3 ([860bb30](https://github.com/DEgITx/rats-search/commit/860bb30))
* **transfer:** fix multiple transfer requests ([654767c](https://github.com/DEgITx/rats-search/commit/654767c))


### Features

* **downloading:** ability to choose files which you wanna download ([11275e7](https://github.com/DEgITx/rats-search/commit/11275e7))
* **downloading:** choose dir on new download ([c771af7](https://github.com/DEgITx/rats-search/commit/c771af7))
* **p2p:** file transfer p2p feature ([e69ced7](https://github.com/DEgITx/rats-search/commit/e69ced7))
* **p2p:** folder transfer feature ([64be590](https://github.com/DEgITx/rats-search/commit/64be590))
* **rutor:** category rutor ([c675974](https://github.com/DEgITx/rats-search/commit/c675974))
* **rutor:** rutor strategie ([ad01a77](https://github.com/DEgITx/rats-search/commit/ad01a77))
* **rutor:** visual gui display ([8f3b936](https://github.com/DEgITx/rats-search/commit/8f3b936))
* **search:** search among info indexes ([f196071](https://github.com/DEgITx/rats-search/commit/f196071))
* **trackers:** closing ability ([073479d](https://github.com/DEgITx/rats-search/commit/073479d))
* **transfer:** download everything to tmp dir to prevent unfinish transfers ([a3ae966](https://github.com/DEgITx/rats-search/commit/a3ae966))

## [0.29.3](https://github.com/DEgITx/rats-search/compare/v0.29.2...v0.29.3) (2018-08-26)


### Bug Fixes

* **gui:** fix memory leak on events handling ([4801a24](https://github.com/DEgITx/rats-search/commit/4801a24))
* **log:** display render log in main log ([3719d53](https://github.com/DEgITx/rats-search/commit/3719d53))


### Performance Improvements

* **top:** fix unnecessary drawing on top page ([55eda2b](https://github.com/DEgITx/rats-search/commit/55eda2b))
* **top:** opmization on top load ([44d2495](https://github.com/DEgITx/rats-search/commit/44d2495))

## [0.29.2](https://github.com/DEgITx/rats-search/compare/v0.29.1...v0.29.2) (2018-08-20)


### Bug Fixes

* **feed:** fix check adding record on info table ([58ea5cb](https://github.com/DEgITx/rats-search/commit/58ea5cb))
* **nyaa:** fix errors on nyaa ([64547e8](https://github.com/DEgITx/rats-search/commit/64547e8))
* **translations:** fix translations change on server version ([6b4a1bd](https://github.com/DEgITx/rats-search/commit/6b4a1bd))

## [0.29.1](https://github.com/DEgITx/rats-search/compare/v0.29.0...v0.29.1) (2018-08-19)


### Bug Fixes

* **gui:** display feed fix ([e3d7c73](https://github.com/DEgITx/rats-search/commit/e3d7c73))

# [0.29.0](https://github.com/DEgITx/rats-search/compare/v0.28.0...v0.29.0) (2018-08-18)


### Bug Fixes

* **closing:** another part of closing fixes ([24a3fa0](https://github.com/DEgITx/rats-search/commit/24a3fa0))
* **db:** broke remote connection (security purposes) ([0ba03c7](https://github.com/DEgITx/rats-search/commit/0ba03c7))
* **db:** fix external sphinx openning check in some cases [#57](https://github.com/DEgITx/rats-search/issues/57) ([d46ede3](https://github.com/DEgITx/rats-search/commit/d46ede3))
* **gui:** fix new window on middle clicks and open external on link clicks ([505787c](https://github.com/DEgITx/rats-search/commit/505787c))
* **linux:** fix closing on linux in some cases ([125a857](https://github.com/DEgITx/rats-search/commit/125a857))
* **nyaa:** nyaa test fix ([aa97708](https://github.com/DEgITx/rats-search/commit/aa97708))
* **replication:** fix replication from object info ([49c52d7](https://github.com/DEgITx/rats-search/commit/49c52d7))
* **rutracker:** encoding fix ([16d9dc1](https://github.com/DEgITx/rats-search/commit/16d9dc1))
* **rutracker:** fix first post ([d0e5d29](https://github.com/DEgITx/rats-search/commit/d0e5d29))
* **rutracker:** rutracker id feat ([e358587](https://github.com/DEgITx/rats-search/commit/e358587))
* **ssh:** prevent ssh relay startup on exit ([229752b](https://github.com/DEgITx/rats-search/commit/229752b))
* **trackers:** fix updating trackers on page open ([ae6111a](https://github.com/DEgITx/rats-search/commit/ae6111a))


### Features

* **config:** add config to disable trackers ([0551402](https://github.com/DEgITx/rats-search/commit/0551402))
* **drop:** support torrents folder drag and drop with recursive scan torrents files ([aa78216](https://github.com/DEgITx/rats-search/commit/aa78216))
* **gui:** trackers basic display ([c8e1dcf](https://github.com/DEgITx/rats-search/commit/c8e1dcf))
* **nyaa:** support of nyaa torrents ([cfb8235](https://github.com/DEgITx/rats-search/commit/cfb8235))
* **rutracker:** category and torrent name from rutracker ([8d77e0c](https://github.com/DEgITx/rats-search/commit/8d77e0c))
* **rutracker:** rutracker basic integratioin ([34f2344](https://github.com/DEgITx/rats-search/commit/34f2344))
* **search:** support japanese, korean, chinese propper search ([1411b83](https://github.com/DEgITx/rats-search/commit/1411b83))
* **tests:** search test ([ee7fa63](https://github.com/DEgITx/rats-search/commit/ee7fa63))
* **trackers:** basic trackers integration ([abd1b85](https://github.com/DEgITx/rats-search/commit/abd1b85))
* **trackers:** display descriptions ([73cfc89](https://github.com/DEgITx/rats-search/commit/73cfc89))
* **trackers:** merge trackers info ([d7a10d3](https://github.com/DEgITx/rats-search/commit/d7a10d3))
* **udp-trackers:** more alternative ([47afb46](https://github.com/DEgITx/rats-search/commit/47afb46))

# [0.28.0](https://github.com/DEgITx/rats-search/compare/v0.27.0...v0.28.0) (2018-08-07)


### Bug Fixes

* **closing:** fix errors on closing ([e04548a](https://github.com/DEgITx/rats-search/commit/e04548a))
* **db:** under mac and linux using alternative pool mechanism ([a3644c0](https://github.com/DEgITx/rats-search/commit/a3644c0))
* **log:** color log (part 2) ([ea8d93e](https://github.com/DEgITx/rats-search/commit/ea8d93e))
* **log:** color log (part 3) ([bc23379](https://github.com/DEgITx/rats-search/commit/bc23379))
* **log:** color messages (part 1) ([27b224d](https://github.com/DEgITx/rats-search/commit/27b224d))
* **server:** color log server fix ([17b377c](https://github.com/DEgITx/rats-search/commit/17b377c))


### Features

* **log:** color log ([62bbc46](https://github.com/DEgITx/rats-search/commit/62bbc46))
* **log:** error display with separate color [#31](https://github.com/DEgITx/rats-search/issues/31) ([70dd4a3](https://github.com/DEgITx/rats-search/commit/70dd4a3))


### Performance Improvements

* **replication:** replicate number accordion to cpu usage ([6af3b7a](https://github.com/DEgITx/rats-search/commit/6af3b7a))
* **torrents:** ability to disable integrity check on torrents adding torrents [#47](https://github.com/DEgITx/rats-search/issues/47) ([080fc92](https://github.com/DEgITx/rats-search/commit/080fc92))

# [0.27.0](https://github.com/DEgITx/rats-search/compare/v0.26.2...v0.27.0) (2018-08-06)


### Bug Fixes

* **background:** one closing pattern ([63158dc](https://github.com/DEgITx/rats-search/commit/63158dc))
* **closing:** window can be closing on event ([84e9573](https://github.com/DEgITx/rats-search/commit/84e9573))
* **gui:** top tabs text overlap ([45168a2](https://github.com/DEgITx/rats-search/commit/45168a2))
* **linux:** fix closing on linux ([75ad00a](https://github.com/DEgITx/rats-search/commit/75ad00a))
* **linux:** fix console control after exit ([29cd05a](https://github.com/DEgITx/rats-search/commit/29cd05a))
* **macos:** fix crashes under Mac OS X ([015447c](https://github.com/DEgITx/rats-search/commit/015447c))
* **macos:** stabilization with connection pool ([769521f](https://github.com/DEgITx/rats-search/commit/769521f))
* **scanner:** fix enconding names in some cases [#55](https://github.com/DEgITx/rats-search/issues/55) ([f1043eb](https://github.com/DEgITx/rats-search/commit/f1043eb))
* **server:** fix exit on server version [#54](https://github.com/DEgITx/rats-search/issues/54) [#52](https://github.com/DEgITx/rats-search/issues/52) ([4109ef9](https://github.com/DEgITx/rats-search/commit/4109ef9))
* **translations:** hash translation ([f5a6f17](https://github.com/DEgITx/rats-search/commit/f5a6f17))


### Features

* **cleaning:** fix cleaning checking and removing torrents (also display cleaning status in more details) [#52](https://github.com/DEgITx/rats-search/issues/52) ([7e0c565](https://github.com/DEgITx/rats-search/commit/7e0c565))
* **closing:** fast window closing/hiding ([019700e](https://github.com/DEgITx/rats-search/commit/019700e))
* **search:** add remote torrents in db via dht and search requests ([1e44164](https://github.com/DEgITx/rats-search/commit/1e44164))
* **search:** hash/magnet search support in db ([1e57789](https://github.com/DEgITx/rats-search/commit/1e57789))
* **torrents:** add support for dropping torrent to base just with window ([6d82291](https://github.com/DEgITx/rats-search/commit/6d82291))


### Performance Improvements

* **replication:** replication thread optimization ([c5427a6](https://github.com/DEgITx/rats-search/commit/c5427a6))

## [0.26.2](https://github.com/DEgITx/rats-search/compare/v0.26.1...v0.26.2) (2018-07-22)


### Bug Fixes

* **feed:** fix store unsync case ([c3b99c4](https://github.com/DEgITx/rats-search/commit/c3b99c4))

## [0.26.1](https://github.com/DEgITx/rats-search/compare/v0.26.0...v0.26.1) (2018-07-22)


### Bug Fixes

* **feed:** fix fileList coruption of feed replication ([27fa805](https://github.com/DEgITx/rats-search/commit/27fa805))
* **feed:** keep feed alive on down votes ([0e33c93](https://github.com/DEgITx/rats-search/commit/0e33c93))
* **feed:** replicate all feed record on new feed ([3e4460f](https://github.com/DEgITx/rats-search/commit/3e4460f))
* **filters:** fix filter cleanup on categories [#51](https://github.com/DEgITx/rats-search/issues/51) ([7ec95cb](https://github.com/DEgITx/rats-search/commit/7ec95cb))

# [0.26.0](https://github.com/DEgITx/rats-search/compare/v0.25.0...v0.26.0) (2018-07-20)


### Bug Fixes

* **feed:** exchage feeds with same size but more new ([0223ad9](https://github.com/DEgITx/rats-search/commit/0223ad9))


### Features

* **gui:** remember scroll on back [#13](https://github.com/DEgITx/rats-search/issues/13) ([71ce6b9](https://github.com/DEgITx/rats-search/commit/71ce6b9))

# [0.25.0](https://github.com/DEgITx/rats-search/compare/v0.24.0...v0.25.0) (2018-07-19)


### Bug Fixes

* **bootstrap:** parallel bootstrap saving ([908163e](https://github.com/DEgITx/rats-search/commit/908163e))
* **feed:** feed error ordering resolved ([a442964](https://github.com/DEgITx/rats-search/commit/a442964))
* **feed:** fix feed synchronization ([d602003](https://github.com/DEgITx/rats-search/commit/d602003))
* **network:** fix network availability detection [#45](https://github.com/DEgITx/rats-search/issues/45) ([5be36fa](https://github.com/DEgITx/rats-search/commit/5be36fa))
* **scroll:** fix jolting on menu clicks ([d429b8a](https://github.com/DEgITx/rats-search/commit/d429b8a))
* **web:** set default nodejs version 8 for web version ([743b27b](https://github.com/DEgITx/rats-search/commit/743b27b))


### Features

* **filters:** add size filter ([1e941f5](https://github.com/DEgITx/rats-search/commit/1e941f5))
* **filters:** content type filters [#49](https://github.com/DEgITx/rats-search/issues/49) ([785dc7c](https://github.com/DEgITx/rats-search/commit/785dc7c))
* **p2p:** information about feed ([37ff661](https://github.com/DEgITx/rats-search/commit/37ff661))
* **portative:** display message about update in portative version [#41](https://github.com/DEgITx/rats-search/issues/41) ([a89c390](https://github.com/DEgITx/rats-search/commit/a89c390))
* **scroll:** smaller scrollbar for more comport view ([25a2aae](https://github.com/DEgITx/rats-search/commit/25a2aae))


### Performance Improvements

* **torrents:** optimization files saving ([a84f8c7](https://github.com/DEgITx/rats-search/commit/a84f8c7))

# [0.24.0](https://github.com/DEgITx/rats-search/compare/v0.23.0...v0.24.0) (2018-07-13)


### Bug Fixes

* **db:** fix startup on broken db after hardware shutdown [#43](https://github.com/DEgITx/rats-search/issues/43) ([2c00d8c](https://github.com/DEgITx/rats-search/commit/2c00d8c))
* **ignore:** ignore more server files ([77035f1](https://github.com/DEgITx/rats-search/commit/77035f1))
* **menu:** new page struct update in menu list ([3fad6c2](https://github.com/DEgITx/rats-search/commit/3fad6c2))
* **patch:** fix memory issue ([a339d01](https://github.com/DEgITx/rats-search/commit/a339d01))
* **updater:** fix errors messages on updater if no internet connection [#45](https://github.com/DEgITx/rats-search/issues/45) ([6ec6609](https://github.com/DEgITx/rats-search/commit/6ec6609))


### Features

* **bootstrap:** always load bootstrap peers when no peers situation (not only on startup) ([3a5c934](https://github.com/DEgITx/rats-search/commit/3a5c934))
* **p2p:** new optimized peer exchange algorithm ([65e61c5](https://github.com/DEgITx/rats-search/commit/65e61c5))
* **search:** part words search feature ([8836607](https://github.com/DEgITx/rats-search/commit/8836607))

# [0.23.0](https://github.com/DEgITx/rats-search/compare/v0.22.0...v0.23.0) (2018-07-02)


### Bug Fixes

* **db:** fix broken connections in some cases [#37](https://github.com/DEgITx/rats-search/issues/37) ([57e7b18](https://github.com/DEgITx/rats-search/commit/57e7b18))
* **db:** fix connection limitation ([4a0b04d](https://github.com/DEgITx/rats-search/commit/4a0b04d))
* **downloading:** always show downloading on list even if download not started ([76cb896](https://github.com/DEgITx/rats-search/commit/76cb896))
* **downloading:** fix recheck progress indication on start and finish ([048c0f6](https://github.com/DEgITx/rats-search/commit/048c0f6))
* **downloading:** fix state on some torrent cases ([125ce95](https://github.com/DEgITx/rats-search/commit/125ce95))
* **feed:** keep downloading values seperate ([8d04df4](https://github.com/DEgITx/rats-search/commit/8d04df4))
* **gui:** padding on some long torrent names ([e1f83a6](https://github.com/DEgITx/rats-search/commit/e1f83a6))
* **header:** replaced button places in top header ([f262af6](https://github.com/DEgITx/rats-search/commit/f262af6))
* **replication:** fix replication on some cases of downloading ([ac046d0](https://github.com/DEgITx/rats-search/commit/ac046d0))
* **tests:** fix intersect test case ([88644ec](https://github.com/DEgITx/rats-search/commit/88644ec))
* **tests:** simplify tests ([c3d62f5](https://github.com/DEgITx/rats-search/commit/c3d62f5))


### Features

* **config:** p2p replication client and server separate for performance optimization ([a5e0afc](https://github.com/DEgITx/rats-search/commit/a5e0afc))
* **downloading:** download speed ([f9ac98f](https://github.com/DEgITx/rats-search/commit/f9ac98f))
* **downloading:** removing after download ability ([886c4d1](https://github.com/DEgITx/rats-search/commit/886c4d1))
* **downloading:** save download session support ([652f9a0](https://github.com/DEgITx/rats-search/commit/652f9a0))
* **downloading:** tooltips on torrent element ([e73ca1c](https://github.com/DEgITx/rats-search/commit/e73ca1c))
* **downloading:** torrent pause feature ([6d8c04e](https://github.com/DEgITx/rats-search/commit/6d8c04e))

# [0.22.0](https://github.com/DEgITx/rats-search/compare/v0.21.1...v0.22.0) (2018-06-24)


### Bug Fixes

* **closing:** more proper closing without errors ([b3fa8bf](https://github.com/DEgITx/rats-search/commit/b3fa8bf))
* **linux:** fix AppImage build [#35](https://github.com/DEgITx/rats-search/issues/35) ([fd3d2cd](https://github.com/DEgITx/rats-search/commit/fd3d2cd))
* **p2p:** p2p proper closing ([d839859](https://github.com/DEgITx/rats-search/commit/d839859))
* **replication:** fix partitial torrent adding ([260afc5](https://github.com/DEgITx/rats-search/commit/260afc5))


### Features

* **debug:** debug rejections ([c9e0fb2](https://github.com/DEgITx/rats-search/commit/c9e0fb2))
* **gui:** tips over some buttons ([a1bdaa5](https://github.com/DEgITx/rats-search/commit/a1bdaa5))

## [0.21.1](https://github.com/DEgITx/rats-search/compare/v0.21.0...v0.21.1) (2018-06-19)


### Bug Fixes

* **download:** crash on download page click in some cases [#34](https://github.com/DEgITx/rats-search/issues/34) ([3f4812e](https://github.com/DEgITx/rats-search/commit/3f4812e))

# [0.21.0](https://github.com/DEgITx/rats-search/compare/v0.20.1...v0.21.0) (2018-06-18)


### Bug Fixes

* **feed:** always insert new feed item ([385e701](https://github.com/DEgITx/rats-search/commit/385e701))
* **feed:** fix feed build ([7111988](https://github.com/DEgITx/rats-search/commit/7111988))
* **feed:** fix feed live update ([8fa9ed3](https://github.com/DEgITx/rats-search/commit/8fa9ed3))
* **feed:** fix p2p load error ([27ec3cc](https://github.com/DEgITx/rats-search/commit/27ec3cc))
* **feed:** type in adding feed entity ([ecac7f4](https://github.com/DEgITx/rats-search/commit/ecac7f4))
* **gui:** always back to main from torrent page, even torrent is loading ([9365219](https://github.com/DEgITx/rats-search/commit/9365219))
* **gui:** fix potencial false window load ([6e0fec2](https://github.com/DEgITx/rats-search/commit/6e0fec2))
* **gui:** little fixes ([7325fc2](https://github.com/DEgITx/rats-search/commit/7325fc2))
* **spider:** fix compiling error on start ([672d14d](https://github.com/DEgITx/rats-search/commit/672d14d))
* **store:** fix limitation on records sync ([81c471b](https://github.com/DEgITx/rats-search/commit/81c471b))
* **store:** fix potential out of records on find request ([3579d24](https://github.com/DEgITx/rats-search/commit/3579d24))
* **trackers:** fix tracker response error ([f74b129](https://github.com/DEgITx/rats-search/commit/f74b129))
* **translations-ru:** fix some messages (thanks to Viktor Lukash) ([deb6c79](https://github.com/DEgITx/rats-search/commit/deb6c79))
* **vote:** ignore voting if already vote ([a9ebef7](https://github.com/DEgITx/rats-search/commit/a9ebef7))


### Features

* **activity:** activity page / feed separate ([e296289](https://github.com/DEgITx/rats-search/commit/e296289))
* **feed:** feed widget support ([3aefdc8](https://github.com/DEgITx/rats-search/commit/3aefdc8))
* **feed:** replicate remote feed from peers ([d2cc42f](https://github.com/DEgITx/rats-search/commit/d2cc42f))
* **gui:** display rating in torrent line (gui part) ([605672b](https://github.com/DEgITx/rats-search/commit/605672b))
* **p2p:** p2p feed ([e368910](https://github.com/DEgITx/rats-search/commit/e368910))
* **search:** new search navigation ([96f347b](https://github.com/DEgITx/rats-search/commit/96f347b))
* **server:** update dependecy server module babel installation [#33](https://github.com/DEgITx/rats-search/issues/33) ([4f60539](https://github.com/DEgITx/rats-search/commit/4f60539))
* **store:** live sync store records on connection to every peer ([9c7379e](https://github.com/DEgITx/rats-search/commit/9c7379e))
* **translations-ua:** Ukraine translation (thanks to Viktor Lukash) ([476fc7e](https://github.com/DEgITx/rats-search/commit/476fc7e))
* **tray:** tray hide on closing [#32](https://github.com/DEgITx/rats-search/issues/32) ([d7d3939](https://github.com/DEgITx/rats-search/commit/d7d3939))
* **vote:** rating update on torrent request ([8c28728](https://github.com/DEgITx/rats-search/commit/8c28728))


### Performance Improvements

* **db:** little faster cycles over small requests ([3f76d11](https://github.com/DEgITx/rats-search/commit/3f76d11))

<a name="0.20.1"></a>
## [0.20.1](https://github.com/DEgITx/rats-search/compare/v0.20.0...v0.20.1) (2018-05-20)


### Bug Fixes

* **changelog:** fix changelog display ([6705b86](https://github.com/DEgITx/rats-search/commit/6705b86))
* **header:** fix panel stick ([be3347b](https://github.com/DEgITx/rats-search/commit/be3347b))

<a name="0.20.0"></a>
# [0.20.0](https://github.com/DEgITx/rats-search/compare/v0.19.2...v0.20.0) (2018-05-20)


### Bug Fixes

* **cicleci:** fix build on cicleci ([d9ca345](https://github.com/DEgITx/rats-search/commit/d9ca345))
* **header:** fix advanced search ([1907f68](https://github.com/DEgITx/rats-search/commit/1907f68))
* **header:** fix header wrap ([5257ffd](https://github.com/DEgITx/rats-search/commit/5257ffd))
* **header:** more enchantment over header ([006bb2c](https://github.com/DEgITx/rats-search/commit/006bb2c))
* **header:** normal error padding on search panel ([eadbcde](https://github.com/DEgITx/rats-search/commit/eadbcde))
* **log:** clear query log on every start ([bcc8e8f](https://github.com/DEgITx/rats-search/commit/bcc8e8f))
* **search:** fix container width ([5ae7106](https://github.com/DEgITx/rats-search/commit/5ae7106))
* **search:** fix search more button indication on peer search ([5549c12](https://github.com/DEgITx/rats-search/commit/5549c12))
* **top:** bold like styling on tab chose ([5552284](https://github.com/DEgITx/rats-search/commit/5552284))
* **translations:** checked language at menu ([520a359](https://github.com/DEgITx/rats-search/commit/520a359))
* **translations:** init app translations ([8cd1309](https://github.com/DEgITx/rats-search/commit/8cd1309))
* **translations:** more translations ([b3e04f5](https://github.com/DEgITx/rats-search/commit/b3e04f5))


### Features

* **core:** dependency update ([e75cb48](https://github.com/DEgITx/rats-search/commit/e75cb48))
* **core:** more deps update ([542dd2e](https://github.com/DEgITx/rats-search/commit/542dd2e))
* **filtering:** negative name filter ([b16ca68](https://github.com/DEgITx/rats-search/commit/b16ca68))
* **header:** statistic panel interface ([71c86e2](https://github.com/DEgITx/rats-search/commit/71c86e2))
* **p2p:** mapping all peers dicts ([ba5fb63](https://github.com/DEgITx/rats-search/commit/ba5fb63))
* **p2p:** peerId protocol handshake ([a216279](https://github.com/DEgITx/rats-search/commit/a216279))
* **search:** moved search to header (now search are always on) ([5a870a0](https://github.com/DEgITx/rats-search/commit/5a870a0))
* **top:** top over different time over all types [#26](https://github.com/DEgITx/rats-search/issues/26) ([663325a](https://github.com/DEgITx/rats-search/commit/663325a))
* **translations:** basic translations support ([87f23e7](https://github.com/DEgITx/rats-search/commit/87f23e7))
* **translations:** generate words on translation ([d24c793](https://github.com/DEgITx/rats-search/commit/d24c793))
* **translations:** menu translations ([8f76005](https://github.com/DEgITx/rats-search/commit/8f76005))
* **translations-ru:** more translations (part 2) ([7f91b9e](https://github.com/DEgITx/rats-search/commit/7f91b9e))
* **translations-ru:** translation to russian (part 1) ([09688e6](https://github.com/DEgITx/rats-search/commit/09688e6))

<a name="0.19.2"></a>
## [0.19.2](https://github.com/DEgITx/rats-search/compare/v0.19.1...v0.19.2) (2018-05-04)


### Bug Fixes

* **linux:** fix patching on some systems without electron ([7c39658](https://github.com/DEgITx/rats-search/commit/7c39658))
* **search:** error on sorting files in search ([63768a2](https://github.com/DEgITx/rats-search/commit/63768a2))
* **trackers:** fix possible trackers error on scrape ([81b5ead](https://github.com/DEgITx/rats-search/commit/81b5ead))

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
