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
