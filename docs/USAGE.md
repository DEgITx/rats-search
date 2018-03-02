## Usage

After installing the program and running, you should have access to the main program window:

[![After start](img/main_no_torrents.png)](https://github.com/DEgITx/rats-search)

After the start, initially you do not have a search database. You can use ready-made search when copy datatabase into the settings folder.

Collection of new torrents from the network should start automatically, in a minute or two after the program is launched (in case of correctly opened ports).
This can be tracked in the "you have information about X torrent" field, as well as in the list of torrent feeds under it. The speed of the collection of torrents will increase with time.

[![First](img/first_torrent.png)](https://github.com/DEgITx/rats-search)

In the case when the collection of torrents does not occur, or is very slow (1-2 torrents in a few minutes), make sure that the ports specified in the settings are opened. Check next paragraph.

### Port configuration

[![Settings](img/settings.png)](https://github.com/DEgITx/rats-search)

For correct operation, it is necessary that ports 4445 and 4446 (or others specified in the settings) are opened. Both types of ports (UDP and TCP) must be opened. On the router, the ports must necessarily be thrown through NAT (if enabled). In the case when router supports UPnP ports will be forwarded automatically. 

### Using search

Over time, your database of torrents will naturally grow up, and you can search for the torrent you are interested in using the search above.

[![A lot of torrents](img/base_big.png)](https://github.com/DEgITx/rats-search)

### Distributed search

In the case of the other ROTB clients found, there will be indicator at the bottom

[![A lot of torrents](img/peer.png)](https://github.com/DEgITx/rats-search)

You will be able to search advanced search among other ROTB clients, you need to perform a normal search, but additional results will be displayed. Depending on the number of peers and exactly those who found the result of the extended issue may vary.

### Настройка сканнера торрентов

[![Settings](img/settings.png)](https://github.com/DEgITx/rats-search)

In the settings there are 3 parameters responsible for configuring the search for torrents in the network, each of them affects the application load, the rate of collection of torrents, the generation of traffic, as well as the total load for equipping the intermediate nodes of the network (router, etc.)

Recommended values:
* Maximum fast search / high load:
  * Scanner walk speed: 5
  * Nodes usage: 0 (отключен = максимальное использование)
  * Reduce netowork packages: 0 (отключено = неограниченно)
* Average search speed / average load:
  * Scanner walk speed: 15
  * Nodes usage: 100
  * Reduce netowork packages: 600
* Low search speed / average load:
  * Scanner walk speed: 30
  * Nodes usage: 10
  * Reduce netowork packages: 450
