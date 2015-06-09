# WebChimera.js Player
**Description:**

An Open Source Player for WebChimera.js (libvlc binding for node.js/io.js/NW.js/Electron)

**Dependencies:**
- [WebChimera.js](https://github.com/RSATom/WebChimera.js)
- [jQuery](https://www.npmjs.com/package/jquery)

**Install the Demo:**
- ``git clone https://github.com/RSATom/wcjs-player.git``
- ``cd wcjs-player``
- ``npm install``
- add contents of the vlc version package you want to use to your app's root folder (for Win: [latest vlc release](http://www.videolan.org/vlc/download-windows.html))
- add [NW.js](http://nwjs.io/) or [Electron](http://electron.atom.io/) to the folder

**Adding the Player to Your App:**
- [download the latest WebChimera.js Player](https://github.com/jaruba/wcjs-player/archive/master.zip)
- copy the ``/player`` folder from the archive to your app's root folder
- ``npm install jquery``
- ``npm install webchimera.js``
- add contents of the vlc version package you want to use to your app's root folder (for Win: [latest vlc release](http://www.videolan.org/vlc/download-windows.html))
- add ``<script src="player/wcp.js"></script>`` to your HTML file

**API:**
- ``wjs(element).addPlayer(cb)`` - adds the player to any element of the page
- ``wjs(element).vlc`` - holds the [WebChimera.js API](https://github.com/RSATom/WebChimera.js/wiki/JS-API)

**Notes:**

Usage example can be seen in ``index.html``, for the current experimental version the ``/player`` folder needs to be in the root path of your app.

**Screenshots:**

WebChimera.js Player running on NW.js (Windows)

<img src="http://webchimera.org/samples/wcjs-player.png">

WebChimera.js Player running on Electron (Mac)

<img src="http://webchimera.org/samples/wcjs-player-2.png">
