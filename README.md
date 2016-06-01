# <img alt="WebChimera.js Player" src="https://raw.githubusercontent.com/jaruba/wcjs-logos/master/logos/small/wcjs-player.png">

**Description**

An Open Source Player for WebChimera.js (libvlc binding for node.js/io.js/NW.js/Electron)

**Install**
- ``npm install wcjs-player``
- ``npm install wcjs-prebuilt`` ([configuration](https://github.com/Ivshti/wcjs-prebuilt#configuration))

  **OR**

  ``npm install webchimera.js`` (will build `WebChimera.js.node`, [prerequisites](https://github.com/RSATom/WebChimera.js#build-prerequisites))

  **OR**

  not use `wcjs-prebuilt` or `webchimera.js`, but implement a post install script or a grunt task that fetches the correct package from [the prebuilts](https://github.com/RSATom/WebChimera.js/releases)

**Docs**
- [JavaScript API Docs](https://github.com/jaruba/wcjs-player/wiki/JavaScript-API)
- [Crazy Hacks](https://github.com/jaruba/wcjs-player/wiki/Crazy-Hacks)
- [Known issues and workarounds](https://github.com/RSATom/WebChimera.js#known-issues-and-workarounds)

**Usage Example 1**

*HTML*

	<div id="player"></div>

*JS*

	var wjs = require("wcjs-player");
	var player = new wjs("#player").addPlayer({
		autoplay: true,
		wcjs: require('wcjs-prebuilt')
		// OR
		// wcjs: require('webchimera.js')
		// OR
		// wcjs: require([path-to-Webchimera.js.node-file])
	});

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

	var conf = {
		autoplay: true,
		wcjs: require('wcjs-prebuilt')
		// OR
		// wcjs: require('webchimera.js')
		// OR
		// wcjs: require([path-to-Webchimera.js.node-file])
	};

	var player = new wjs("#player1").addPlayer(conf);
	player.addPlaylist("http://archive.org/download/CrayonDragonAnAnimatedShortFilmByTonikoPantoja/Crayon%20Dragon%20-%20An%20animated%20short%20film%20by%20Toniko%20Pantoja.mp4");

	var player2 = new wjs("#player2").addPlayer(conf);
	player2.addPlaylist("http://archive.org/download/CartoonClassics/Krazy_Kat_-_Keeping_Up_With_Krazy.mp4");

	// from here on you can either call the players with 'player' / 'player2' or 'new wjs("#player1")' / 'new wjs("#player2")'


**Screenshots**

WebChimera.js Player running on NW.js (Windows)

<img src="http://webchimera.org/samples/wcjs-player.png">

WebChimera.js Player running on Electron (Mac)

<img src="http://webchimera.org/samples/wcjs-player-2.png">

WebChimera.js Player Multiscreen Demo running on NW.js (Windows)

<img src="http://webchimera.org/samples/wcjs-player-5.png">
