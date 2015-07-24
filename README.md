# WebChimera.js Player
**Description**

An Open Source Player for WebChimera.js (libvlc binding for node.js/io.js/NW.js/Electron)

**Prerequisites**
- [WebChimera.js prerequisites](https://github.com/RSATom/WebChimera.js#build-prerequisites)

**Install**
- ``npm install wcjs-player``

**Docs**
- [JavaScript API Docs](https://github.com/jaruba/wcjs-player/wiki/JavaScript-API)

**Suggestions**
- Please remember that in order for this player to work, you need to add the VLC binaries to your app. [see details](https://github.com/RSATom/WebChimera.js#build-prerequisites)

- For Windows distribution it is recommended to use the ``--disable-d3d11`` chromium arg because we have received reports of Win 8.1 using a very high amount of resources while running WebGL in Chromium on Direct3D 11

- Although we have measures set in place to restore a WebGL context if it is lost, you can also use the ``--gpu-no-context-lost`` chromium arg if you want chromium to keep the WebGL context through power saving mode, screen saving mode, etc.

- On Windows, if you changed the NW.js executable name from ``nw.exe``, then ``WebChimera.js.node`` cannot load the necessary dependencies from ``nw.exe`` anymore, to fix this, [download rename-import-dll](https://github.com/ironSource/rename-import-dll/releases), save ``rid.exe`` to your app's root directory, open a command prompt from your app folder and use:

```
rid.exe node_modules/wcjs-player/node_modules/wcjs-renderer/node_modules/webchimera.js/build/Release/WebChimera.js.node nw.exe app.exe
```

where ``app.exe`` is the new name of your executable. ``rid.exe`` can be deleted after this task.

**Usage Example 1**

*HTML*

	<div id="player"></div>

*JS*

	var wjs = require("wcjs-player");
	var player = new wjs("#player").addPlayer({ autoplay: true });

	player.addPlaylist("http://archive.org/download/CartoonClassics/Krazy_Kat_-_Keeping_Up_With_Krazy.mp4");

	// from here on you can either call the player with 'player' or 'new wjs("#player")'


**Usage Example 2 (two players)**

*CSS* (all player wrappers are natively assigned the ``webchimeras`` class)

	.webchimeras {
		float: left;
		width: 50%;
		height: 100%
	}

*HTML*

	<div id="player1"></div>
	<div id="player2"></div>

*JS*

	var wjs = require("wcjs-player");

	var player = new wjs("#player1").addPlayer({ autoplay: true });
	player.addPlaylist("http://archive.org/download/CrayonDragonAnAnimatedShortFilmByTonikoPantoja/Crayon%20Dragon%20-%20An%20animated%20short%20film%20by%20Toniko%20Pantoja.mp4");

	var player2 = new wjs("#player2").addPlayer({ autoplay: true });
	player2.addPlaylist("http://archive.org/download/CartoonClassics/Krazy_Kat_-_Keeping_Up_With_Krazy.mp4");

	// from here on you can either call the players with 'player' / 'player2' or 'new wjs("#player1")' / 'new wjs("#player2")'


**Screenshots**

WebChimera.js Player running on NW.js (Windows)

<img src="http://webchimera.org/samples/wcjs-player.png">

WebChimera.js Player running on Electron (Mac)

<img src="http://webchimera.org/samples/wcjs-player-2.png">

WebChimera.js Player Multiscreen Demo running on NW.js (Windows)

<img src="http://webchimera.org/samples/wcjs-player-5.png">
