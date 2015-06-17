# WebChimera.js Player
**Description:**

An Open Source Player for WebChimera.js (libvlc binding for node.js/io.js/NW.js/Electron)

**Prerequisites:**
- [WebChimera.js prerequisites](https://github.com/RSATom/WebChimera.js#build-prerequisites)

**Install:**
- ``npm install wcjs-player``

**API:**
- ``wjs(element).addPlayer(parameters)`` - adds the player to any element of the page

 --- ``parameters`` - optional JSON object containing parameters, currently only supports ``multiscreen`` (boolean, defaults to "false", [see multiscreen demo](https://github.com/jaruba/node-vlc-multiscreen/))
- ``wjs(element).vlc`` - holds the [WebChimera.js API](https://github.com/RSATom/WebChimera.js/wiki/JavaScript-API)

**Usage Example 1:**

*HTML*

	<div id="player"></div>

*JS*

	var wjs = require("wcjs-player");
	var player = new wjs("#player").addPlayer();

	player.vlc.play("http://archive.org/download/CartoonClassics/Krazy_Kat_-_Keeping_Up_With_Krazy.mp4");

	// from here on you can either call the player with 'player' or 'wjs("#player")'


**Usage Example 2 (two players):**

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

	var wcp = require("wcjs-player");

	var player = new wcp("#player1").addPlayer();
	player.vlc.play("http://archive.org/download/CrayonDragonAnAnimatedShortFilmByTonikoPantoja/Crayon%20Dragon%20-%20An%20animated%20short%20film%20by%20Toniko%20Pantoja.mp4");

	var player2 = new wcp("#player2").addPlayer();
	player2.vlc.play("http://archive.org/download/CartoonClassics/Krazy_Kat_-_Keeping_Up_With_Krazy.mp4");
	
	// from here on you can either call the players with 'player' / 'player2' or 'wjs("#player1")' / 'wjs("#player2")'


**Screenshots:**

WebChimera.js Player running on NW.js (Windows)

<img src="http://webchimera.org/samples/wcjs-player.png">

WebChimera.js Player running on Electron (Mac)

<img src="http://webchimera.org/samples/wcjs-player-2.png">

WebChimera.js Player Multiscreen Demo running on NW.js (Windows)

<img src="http://webchimera.org/samples/wcjs-player-multiscreen.png">
