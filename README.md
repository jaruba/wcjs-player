# WebChimera.js Player
**Description:**

An Open Source Player for WebChimera.js (libvlc binding for node.js/io.js/NW.js/Electron)

**Prerequisites:**
- [WebChimera.js prerequisites](https://github.com/RSATom/WebChimera.js#build-prerequisites)

**Install:**
- ``npm install wcjs-player``

**API:**
- ``wjs(element).addPlayer(parameters,cb)`` - adds the player to any element of the page

 --- ``parameters`` - optional JSON object containing either ``id`` (string, defaults to "webchimera", "webchimera2", etc., used for the selection of the player after it is created, ie: ``wjs("#webchimera")`` ) or ``multiscreen`` (boolean, defaults to "false", [see multiscreen demo](https://github.com/jaruba/node-vlc-multiscreen/))
- ``wjs(element).vlc`` - holds the [WebChimera.js API](https://github.com/RSATom/WebChimera.js/wiki/JS-API)

**Usage Example 1:**

*HTML*

	<div id="player_wrapper"></div>

*JS*

	var wcp = require("wcjs-player");
	var player = new wcp("#player_wrapper");

	player.addPlayer(function(){
		this.vlc.play("http://archive.org/download/CartoonClassics/Krazy_Kat_-_Keeping_Up_With_Krazy.mp4");
	});


**Usage Example 2 (two players):**

*CSS* (all player wrappers are natively assigned the ``webchimeras`` class)

	.webchimeras {
		float: left;
		width: 50%;
		height: 100%
	}

*HTML*

	<div id="player_wrapper1"></div>
	<div id="player_wrapper2"></div>

*JS*

	var wcp = require("wcjs-player");
	var player = new wcp("#player_wrapper1");
	
	player.addPlayer(function(){
		this.vlc.play("http://archive.org/download/CrayonDragonAnAnimatedShortFilmByTonikoPantoja/Crayon%20Dragon%20-%20An%20animated%20short%20film%20by%20Toniko%20Pantoja.mp4");
	});
	
	var player2 = new wcp("#player_wrapper2");
	
	player2.addPlayer(function(){
		this.vlc.play("http://archive.org/download/CartoonClassics/Krazy_Kat_-_Keeping_Up_With_Krazy.mp4");
	});


**Screenshots:**

WebChimera.js Player running on NW.js (Windows)

<img src="http://webchimera.org/samples/wcjs-player.png">

WebChimera.js Player running on Electron (Mac)

<img src="http://webchimera.org/samples/wcjs-player-2.png">
