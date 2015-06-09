/*****************************************************************************
* Copyright (c) 2015 Branza Victor-Alexandru <branza.alex[at]gmail.com>
*
* This program is free software; you can redistribute it and/or modify it
* under the terms of the GNU Lesser General Public License as published by
* the Free Software Foundation; either version 2.1 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public License
* along with this program; if not, write to the Free Software Foundation,
* Inc., 51 Franklin Street, Fifth Floor, Boston MA 02110-1301, USA.
*****************************************************************************/

// WebChimera.js Player v0.0.1

var vlcs = {},
	$ = require('jquery'),
	seekDrag = false,
	volDrag = false,
	hideUI;

var wjs = function(context) {
	// Call the constructor
	return new wjs.init(context);
};

// Static methods
wjs.init = function(context) {
	
	this.version = "v0.0.1";

	// Save the context
	this.context = (typeof context === "undefined") ? "#webchimera" : context;  // if no playerid set, default to "webchimera"
	
	this.video = { }; // Video Object (holds width, height, pixelFormat)

	if (this.context.substring(0,1) == "#") {
		this.canvas = document.getElementById(this.context.substring(1)).firstChild;
		this.allElements = [document.getElementById(this.context.substring(1))];
	} else if (this.context.substring(0,1) == ".") {
		this.allElements = document.getElementsByClassName(this.context.substring(1));
		this.canvas = this.allElements[0].firstChild;
	} else {
		this.allElements = document.getElementsByTagName(this.context);
		this.canvas = this.allElements[0].firstChild;
	}
	if (vlcs[this.context]) {
		this.vlc = vlcs[this.context].vlc;
		if (vlcs[this.context].y) this.y = vlcs[this.context].y;
		if (vlcs[this.context].u) this.u = vlcs[this.context].u;
		if (vlcs[this.context].v) this.v = vlcs[this.context].v;
		if (vlcs[this.context].width) {
			this.video = {};
			this.video.width = vlcs[this.context].width;
			this.video.height = vlcs[this.context].height;
			this.video.pixelFormat = vlcs[this.context].pixelFormat;
		}
	}
	
};

wjs.init.prototype.addPlayer = function(wcpSettings,cb) {
	
	if (!$("link[href='player/css/webchimera.css']").length)
	$('<link href="player/css/webchimera.css" rel="stylesheet">').appendTo("head");
	
	if (typeof wcpSettings === 'function') {
		cb = wcpSettings;
		wcpSettings = null;
	}
	
	if (wcpSettings) newid = (typeof wcpSettings["id"] === "undefined") ? "webchimera" : wcpSettings["id"]; // if no id set, default to "webchimera"
	else newid = "webchimera";
	
	if (typeof newid === 'string') {
		if (newid.substring(0,1) == "#") var targetid = ' id="'+newid.substring(1)+'" class="wcp-wrapper"';
		else if (newid.substring(0,1) == ".") { var targetid = ' id="webchimera" class="'+newid.substring(1)+' wcp-wrapper"'; newid = "#webchimera"; }
		else { var targetid = ' id="'+newid+'" class="wcp-wrapper"'; newid = "#"+newid; }
	} else { var targetid = ' id="webchimera" class="wcp-wrapper"'; newid = "#webchimera"; }
	
	playerbody = '<div' + targetid + ' style="height: 100%"><canvas class="wcp-canvas wcp-center"></canvas><div class="wcp-surface"></div><div class="wcp-pause-anim wcp-center"><i class="wcp-anim-basic wcp-anim-icon-play"></i></div><div class="wcp-toolbar"><div class="wcp-toolbar-background"></div><div class="wcp-progress-bar"><div class="wcp-progress-seen"></div><div class="wcp-progress-pointer"></div></div><div class="wcp-button wcp-left wcp-pause"></div><div class="wcp-button wcp-left wcp-vol-button wcp-volume-medium"></div><div class="wcp-vol-control"><div class="wcp-vol-bar"><div class="wcp-vol-bar-full"></div><div class="wcp-vol-bar-pointer"></div></div></div><div class="wcp-time"><span class="wcp-time-current">00:00</span> / <span class="wcp-time-total">00:00</span></div><div class="wcp-button wcp-right wcp-maximize"></div></div><div class="wcp-status"></div><div class="wcp-tooltip"><div class="wcp-tooltip-arrow"></div><div class="wcp-tooltip-inner">00:00</div></div></div>';

	$(this.context).each(function(ij,el) { el.innerHTML = playerbody; });
	
	wjs(newid).canvas = $(".wcp-wrapper")[0].firstChild;

	// resize video when window is resized
	window.onresize = function() { return wjs(newid).autoResize.call(wjs(newid)); };

	// clean up previous listeners
	$(".wcp-button").unbind();
	$(".wcp-surface").unbind();
	$(".wcp-progress-bar").unbind();
	$(".wcp-vol-button").unbind();
	$(".wcp-vol-control").unbind();

	// toolbar button actions
	$(".wcp-button").click(function() {
		vlc = wjs("#"+$(this).parents(".wcp-wrapper")[0].id).vlc;
		buttonClass = this.className.replace("wcp-button","").replace("wcp-left","").replace("wcp-vol-button","").replace("wcp-right","").split(" ").join("");
		if ([3,4,6].indexOf(vlc.state) > -1) {
			if (buttonClass == "wcp-play") {
				switchClass($(".wcp-anim-basic")[0],"wcp-anim-icon-pause","wcp-anim-icon-play");
				animatePause();
				vlc.togglePause();
				switchClass(this,"wcp-play","wcp-pause");
			} else if (buttonClass == "wcp-pause") {
				switchClass($(".wcp-anim-basic")[0],"wcp-anim-icon-play","wcp-anim-icon-pause");
				animatePause();
				vlc.togglePause();
				switchClass(this,"wcp-pause","wcp-play");
			} else if (buttonClass == "wcp-replay") {
				switchClass($(".wcp-anim-basic")[0],"wcp-anim-icon-pause","wcp-anim-icon-play");
				animatePause();
				vlc.stop();
				vlc.play();
				switchClass(this,"wcp-replay","wcp-pause");
				$(".wcp-progress-seen").css("width","0%");
				$(".wcp-time-current").text("00:00");
			} else if (["wcp-volume-low","wcp-volume-medium","wcp-volume-high"].indexOf(buttonClass) > -1) {
				switchClass(this,buttonClass,"wcp-mute");
				vlc.toggleMute();
			} else if (buttonClass == "wcp-mute") {
				switchClass(this,buttonClass,"wcp-volume-medium");
				vlc.toggleMute();
			}
		}
		if (buttonClass == "wcp-minimize") {
			if (document.webkitCancelFullScreen) document.webkitCancelFullScreen();
			else if (document.cancelFullScreen) document.cancelFullScreen();
			switchClass(this,"wcp-minimize","wcp-maximize");
		} else if (buttonClass == "wcp-maximize") {
			wcpWrapper = $(this).parents(".wcp-wrapper")[0];
			if (wcpWrapper.webkitRequestFullscreen) wcpWrapper.webkitRequestFullscreen();
			else if (wcpWrapper.requestFullscreen) wcpWrapper.requestFullscreen();
			switchClass(this,"wcp-maximize","wcp-minimize");
		}
	});
	
	// surface click actions
	$(".wcp-surface").click(function() {
		vlc = wjs("#"+$(this).parents(".wcp-wrapper")[0].id).vlc;
		if (vlc.state == 6) {
			$(".wcp-replay").trigger("click");
			return;
		}
		if ([3,4].indexOf(vlc.state) > -1) {
			if (vlc.state == 4) {
				switchClass($(".wcp-anim-basic")[0],"wcp-anim-icon-pause","wcp-anim-icon-play");
				switchClass($(".wcp-play")[0],"wcp-play","wcp-pause");
			} else if (vlc.state == 3) {
				switchClass($(".wcp-anim-basic")[0],"wcp-anim-icon-play","wcp-anim-icon-pause");
				switchClass($(".wcp-pause")[0],"wcp-pause","wcp-play");
			}
			animatePause();
			vlc.togglePause();
		}
	});
	
	$(".wcp-surface").dblclick(function() {
		$(".wcp-anim-basic").finish();
		$(".wcp-pause-anim").finish();
		if (document.webkitFullscreenElement == null) {
			wcpWrapper = $(this).parents(".wcp-wrapper")[0];
			if (wcpWrapper.webkitRequestFullscreen) wcpWrapper.webkitRequestFullscreen();
			else if (wcpWrapper.requestFullscreen) wcpWrapper.requestFullscreen();
			
			if ($(this).parents(".wcp-wrapper").find(".wcp-maximize") > 0) {
				switchClass($(this).parents(".wcp-wrapper").find(".wcp-maximize"),"wcp-maximize","wcp-minimize");
			}
		} else {
			if (document.webkitCancelFullScreen) document.webkitCancelFullScreen();
			else if (document.cancelFullScreen) document.cancelFullScreen();

			if ($(this).parents(".wcp-wrapper").find(".wcp-maximize") > 0) {
				switchClass($(this).parents(".wcp-wrapper").find(".wcp-minimize"),"wcp-minimize","wcp-maximize");
			}
		}
	});
	
	$(".wcp-wrapper").parent().bind("mousemove",function(e) {
		clearInterval(hideUI);
		$(".wcp-wrapper").parent().css({cursor: 'default'})
		$(".wcp-toolbar").fadeIn();
		if (!volDrag && !seekDrag) hideUI = setTimeout(function() { $(".wcp-toolbar").fadeOut(); $(".wcp-wrapper").parent().css({cursor: 'none'}); },3000);
	});
	
    /* Progress and Volume Bars */
	$(".wcp-progress-bar").hover(function(e) {
		vlc = wjs("#"+$(".wcp-wrapper")[0].id).vlc;
		if (vlc.length) {
			var rect = $(".wcp-wrapper")[0].getBoundingClientRect();
			if (e.pageX >= rect.left && e.pageX <= rect.right) {
				var newtime = Math.floor(vlc.length * ((e.pageX - rect.left) / $(this).width()));
				if (newtime > 0) {
					$(".wcp-tooltip-inner").text(parseTime(newtime));
					var offset = Math.floor($(".wcp-tooltip").width() / 2);
					if (e.pageX >= (offset + rect.left) && e.pageX <= (rect.right - offset)) {
						$(".wcp-tooltip").css("left",((e.pageX - rect.left) - offset)+"px");
					} else if (e.pageX < (rect.left + offset)) $(".wcp-tooltip").css("left",rect.left+"px");
					else if (e.pageX > (rect.right - offset)) $(".wcp-tooltip").css("left",(rect.right - $(".wcp-tooltip").width())+"px");
					$(".wcp-tooltip").show(0);
				}
			} else $(".wcp-tooltip").hide(0);
		}
	}, function(e) {
		if (!seekDrag) $(".wcp-tooltip").hide(0);
	});
	$(".wcp-progress-bar").bind("mousemove",function(e) {
		vlc = wjs("#"+$(".wcp-wrapper")[0].id).vlc;
		if (vlc.length) {
			var rect = $(".wcp-wrapper")[0].getBoundingClientRect();
			if (e.pageX >= rect.left && e.pageX <= rect.right) {
				var newtime = Math.floor(vlc.length * ((e.pageX - rect.left) / $(this).width()));
				if (newtime > 0) {
					$(".wcp-tooltip-inner").text(parseTime(newtime));
					var offset = Math.floor($(".wcp-tooltip").width() / 2);
					if (e.pageX >= (offset + rect.left) && e.pageX <= (rect.right - offset)) {
						$(".wcp-tooltip").css("left",((e.pageX - rect.left) - offset)+"px");
					} else if (e.pageX < (rect.left + offset)) $(".wcp-tooltip").css("left",rect.left+"px");
					else if (e.pageX > (rect.right - offset)) $(".wcp-tooltip").css("left",(rect.right - $(".wcp-tooltip").width())+"px");
					$(".wcp-tooltip").show(0);
				}
			} else $(".wcp-tooltip").hide(0);
		}
	});
	$(window).bind("mouseup",function(e) {
		clearInterval(hideUI);
		$(".wcp-wrapper").parent().css({cursor: 'default'})
		hideUI = setTimeout(function() { $(".wcp-toolbar").fadeOut(); $(".wcp-wrapper").parent().css({cursor: 'none'}); },3000);
		if (seekDrag) {
			seekDrag = false;
			var rect = $(".wcp-wrapper")[0].getBoundingClientRect();
			if (e.pageX >= rect.left && e.pageX <= rect.right) {
				vlc = wjs("#"+$(".wcp-wrapper")[0].id).vlc;
				p = (e.pageX - rect.left) / (rect.right - rect.left);
				$(".wcp-progress-seen").css("width", (p*100)+"%");
				vlc.position = p;
			}
			$(".wcp-tooltip").hide(0);
			$(".wcp-time-current").text($(".wcp-tooltip-inner").text());
		}
		if (volDrag) {
			volDrag = false;
			var rect = $(".wcp-vol-bar")[0].getBoundingClientRect();
			if (e.pageX >= rect.right) {
				p = 1;
				offset = 116;
				setTimeout(function() { $(".wcp-vol-control").animate({ width: 0 },200); },1500);
			} else if (e.pageX <= rect.left)  {
				p = 0;
				offset = 0;
				setTimeout(function() { $(".wcp-vol-control").animate({ width: 0 },200); },1500);
			} else {
				p = (e.pageX - rect.left) / (rect.right - rect.left);
				offset = e.pageX - rect.left;
				if (e.pageY < rect.top) setTimeout(function() { $(".wcp-vol-control").animate({ width: 0 },200); },1500);
				else if (e.pageY > rect.bottom) setTimeout(function() { $(".wcp-vol-control").animate({ width: 0 },200); },1500);
			}
			if (offset) {
				$(".wcp-vol-bar-full").css("width", offset+"px");
				if (offset > 116) offset = 116;
				if (offset < 0) offset = 0;
				vlc = wjs("#"+$(".wcp-wrapper")[0].id).vlc;
				vlc.volume = Math.floor(200* p);
			}
		}
	})
	.bind("mousemove",function(e) {
		if (seekDrag) {
			var rect = $(".wcp-wrapper")[0].getBoundingClientRect();
			if (e.pageX >= rect.left && e.pageX <= rect.right) {
				p = (e.pageX - rect.left) / (rect.right - rect.left);
				$(".wcp-progress-seen").css("width", (p*100)+"%");

				var newtime = Math.floor(vlc.length * ((e.pageX - rect.left) / $(this).width()));
				if (newtime > 0) {
					$(".wcp-tooltip-inner").text(parseTime(newtime));
					var offset = Math.floor($(".wcp-tooltip").width() / 2);
					if (e.pageX >= (offset + rect.left) && e.pageX <= (rect.right - offset)) {
						$(".wcp-tooltip").css("left",((e.pageX - rect.left) - offset)+"px");
					} else if (e.pageX < (rect.left + offset)) $(".wcp-tooltip").css("left",rect.left+"px");
					else if (e.pageX > (rect.right - offset)) $(".wcp-tooltip").css("left",(rect.right - $(".wcp-tooltip").width())+"px");
					$(".wcp-tooltip").show(0);
				}
			}
		}
		if (volDrag) {
			var rect = $(".wcp-vol-bar")[0].getBoundingClientRect();
			if (e.pageX >= rect.left && e.pageX <= rect.right) {
				p = (e.pageX - rect.left) / (rect.right - rect.left);
				$(".wcp-vol-bar-full").css("width", Math.floor(p*116)+"px");
				vlc = wjs("#"+$(".wcp-wrapper")[0].id).vlc;
				vlc.volume = Math.floor(200* p);
			}
		}
	});
	
    $(".wcp-progress-bar").bind("mousedown", function(e) {
		seekDrag = true;
		p = e.pageX / $(this).width();
		$(this).find(".wcp-progress-seen").css("width", (p*100)+"%");
	});

    $(".wcp-vol-bar").bind("mousedown", function(e) {
		volDrag = true;
		var rect = $(".wcp-vol-bar")[0].getBoundingClientRect();
		p = (e.pageX - rect.left) / $(this).width();
		$(this).find(".wcp-vol-bar-full").css("width", Math.floor(p*116)+"px");
	});

	$(".wcp-vol-button").hover(function() {
		$($(this).parents(".wcp-wrapper")[0]).find(".wcp-vol-control").animate({ width: 133 },200);
	},function() {
		if (!$($('.wcp-vol-control').selector + ":hover").length > 0 && !volDrag) {
			$($(this).parents(".wcp-wrapper")[0]).find(".wcp-vol-control").animate({ width: 0 },200);
		}
	});
	
	$('.wcp-vol-control').mouseout(function() {
		if (!$($('.wcp-vol-button').selector + ":hover").length > 0 && !$($('.wcp-vol-bar').selector + ":hover").length > 0 && !$($('.wcp-vol-control').selector + ":hover").length > 0 && !volDrag) {
			$($(this).parents(".wcp-wrapper")[0]).find(".wcp-vol-control").animate({ width: 0 },200);
		}
	});
	
	// set initial status message font size
	var fontSize = (parseInt($(this.allElements[0]).height())/15);
	if (fontSize < 20) fontSize = 20;
	$(wjs(newid).allElements[0].childNodes[4]).css('fontSize', fontSize);

	// create player and attach event handlers
	var wcAddon = require("webchimera.js");

	vlcs[newid] = {};
	vlcs[newid].vlc = wcAddon.createPlayer();
	
	vlcs[newid].vlc.onPositionChanged = function(arg1) {
		return wjs(newid).positionChanged.call(wjs(newid),arg1);
	};

	vlcs[newid].vlc.onTimeChanged = function(arg1) {
		return wjs(newid).timePassed.call(wjs(newid),arg1);
	};
	
	vlcs[newid].vlc.onOpening = function() {
		return wjs(newid).isOpening.call(wjs(newid));
	};
	
	vlcs[newid].vlc.onBuffering = function(arg1) {
		return wjs(newid).isBuffering.call(wjs(newid),arg1);
	};
	
	vlcs[newid].vlc.onPlaying = function() {
		return wjs(newid).isPlaying.call(wjs(newid));
	};
	
	vlcs[newid].vlc.onEndReached = function() {
		return wjs(newid).hasEnded.call(wjs(newid));
	};
	
	try { tryGl = wjs(newid).canvas.getContext("webgl"); }
	catch (x) { tryGl = null; }
	
	if (tryGl == null) {
		vlcs[newid].vlc.pixelFormat = vlcs[newid].vlc.RV32;
		vlcs[newid].vlc.onFrameSetup = function(arg1,arg2,arg3) {
			return wjs(newid).frameSetup2D.call(wjs(newid),arg1,arg2,arg3);
		};
	} else {
		vlcs[newid].vlc.onFrameSetup = function(arg1,arg2,arg3) {
			return wjs(newid).frameSetup.call(wjs(newid),arg1,arg2,arg3);
		};
	}
	
	cb.call(wjs(newid));

	return wjs(newid);
};

// event handlers
wjs.init.prototype.timePassed = function(t) {
	$(this.allElements[0]).find(".wcp-time-current").text(parseTime(t,this.vlc.length));
};

wjs.init.prototype.positionChanged = function(position) {
	if (!seekDrag) this.allElements[0].childNodes[3].childNodes[1].childNodes[0].style.width = (position*100)+"%";
};

wjs.init.prototype.isOpening = function(position) {
	var style = window.getComputedStyle(this.allElements[0].childNodes[4]);
	if (style.display === 'none') $(this.allElements[0].childNodes[4]).show();
	$(this.allElements[0].childNodes[4]).text("Opening");
};

wjs.init.prototype.isBuffering = function(percent) {
	var style = window.getComputedStyle(this.allElements[0].childNodes[4]);
	if (style.display === 'none') $(this.allElements[0].childNodes[4]).show();
	$(this.allElements[0].childNodes[4]).text("Buffering "+percent+"%");
	if (percent == 100) $(this.allElements[0].childNodes[4]).fadeOut(1200);
};

wjs.init.prototype.isPlaying = function() {
	var style = window.getComputedStyle(this.allElements[0].childNodes[4]);
	if (style.display !== 'none') $(this.allElements[0].childNodes[4]).fadeOut(1200);
	$(this.allElements[0]).find(".wcp-time-total").text(parseTime(this.vlc.length));
//	$(this.allElements[0]).find(".wcp-time").show();
//	var style = window.getComputedStyle($(this.allElements[0]).find(".wcp-time")[0]);
//	if (style.display === 'none') $(this.allElements[0]).find(".wcp-time").fadeIn();
};

wjs.init.prototype.hasEnded = function() {
	switchClass($(this.allElements[0]).find(".wcp-pause")[0],"wcp-pause","wcp-replay");
};
// end event handlers

wjs.init.prototype.autoResize = function() {
	// resize status font size
	var fontSize = (parseInt($(this.allElements[0]).height())/15);
	if (fontSize < 20) fontSize = 20;
	$(this.allElements[0].childNodes[4]).css('fontSize', fontSize);
	
	// resize video layer
	var container = $(this.context);
	var sourceAspect = this.video.width / this.video.height;
	var destAspect = container.width() / container.height();
	var cond = destAspect > sourceAspect;

	if (cond) {
		this.canvas.style.height = "100%";
		this.canvas.style.width = ( (container.height() * sourceAspect) / container.width() ) * 100 + "%";
	} else {
		this.canvas.style.height = ( (container.width() / sourceAspect) / container.height() ) * 100 + "%";
		this.canvas.style.width = "100%";
	}
}

wjs.init.prototype.render = function(videoFrame) {
	var len = videoFrame.length;

	this.y.fill(videoFrame.subarray(0, videoFrame.uOffset));
	this.u.fill(videoFrame.subarray(videoFrame.uOffset, videoFrame.vOffset));
	this.v.fill(videoFrame.subarray(videoFrame.vOffset, len));

	vlcs[this.context].gl.drawArrays(vlcs[this.context].gl.TRIANGLE_STRIP, 0, 4);
}

wjs.init.prototype.frameSetup2D = function(width, height, pixelFormat) {
    this.canvas.width = width;
    this.canvas.height = height; 
    var ctx = this.canvas.getContext('2d');
    var img = ctx.createImageData(width, height);
    var buf;
    this.vlc.onFrameReady = function render(videoFrame) {
        set_frame(img.data, videoFrame, width, height); 
        ctx.putImageData(img, 0, 0);
    }
}

wjs.init.prototype.frameSetup = function(width, height, pixelFormat) {
	if (!vlcs[this.context]) vlcs[this.context] = {};
	vlcs[this.context].width = width;
	vlcs[this.context].height = height;
	vlcs[this.context].pixelFormat = pixelFormat;
	
	 // TODO: re-init on video change or window re-size
	this.canvas.width = width;
	this.canvas.height = height; 
		
	saveContext = this.context;
	
	this.vlc.onFrameReady = function(arg1) {
		return wjs(saveContext).render.call(wjs(saveContext),arg1);
	};

	gl = this.canvas.getContext("webgl");
	vlcs[this.context].gl = gl;
	
	gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	wjs(this.context).autoResize();

	var vertexShaderSource = [
		"attribute highp vec4 aVertexPosition;",
		"attribute vec2 aTextureCoord;",
		"varying highp vec2 vTextureCoord;",
		"void main(void) {",
		" gl_Position = aVertexPosition;",
		" vTextureCoord = aTextureCoord;", "}"].join("\n");

	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderSource);
	gl.compileShader(vertexShader);

	var fragmentShaderSource = [
		"precision highp float;",
		"varying lowp vec2 vTextureCoord;",
		"uniform sampler2D YTexture;",
		"uniform sampler2D UTexture;",
		"uniform sampler2D VTexture;",
		"const mat4 YUV2RGB = mat4",
		"(",
		" 1.1643828125, 0, 1.59602734375, -.87078515625,",
		" 1.1643828125, -.39176171875, -.81296875, .52959375,",
		" 1.1643828125, 2.017234375, 0, -1.081390625,",
		" 0, 0, 0, 1",
		");", "void main(void) {",
		" gl_FragColor = vec4( texture2D(YTexture, vTextureCoord).x, texture2D(UTexture, vTextureCoord).x, texture2D(VTexture, vTextureCoord).x, 1) * YUV2RGB;", "}"].join("\n");
		
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderSource);
	gl.compileShader(fragmentShader);

	program = gl.createProgram();
	gl.attachShader(program, vertexShader); 
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	gl.useProgram(program);

	if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.log("Shader link failed.");
	}

	var vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
	gl.enableVertexAttribArray(vertexPositionAttribute);

	var textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");
	gl.enableVertexAttribArray(textureCoordAttribute);
	
	var verticesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,
				  new Float32Array([1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]),
				  gl.STATIC_DRAW);

	var texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,
				  new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0]),
				  gl.STATIC_DRAW);

	vlcs[this.context].y = new Texture(gl, width, height);
	vlcs[this.context].u = new Texture(gl, width >> 1, height >> 1);
	vlcs[this.context].v = new Texture(gl, width >> 1, height >> 1);

	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
	
	vlcs[this.context].y.bind(0, program, "YTexture");
	vlcs[this.context].u.bind(1, program, "UTexture");
	vlcs[this.context].v.bind(2, program, "VTexture"); 
};

function Texture(gl, width, height) {
	this.gl = gl;
	this.width = width; this.height = height;

	this.texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

Texture.prototype.bind = function (n, program, name)
{
	var gl = this.gl;
	gl.activeTexture([gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2][n]);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.uniform1i(gl.getUniformLocation(program, name), n);
}

Texture.prototype.fill = function (data) {
	var gl = this.gl;
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, this.width, this.height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
}

// Does rv32 -> rgba convertion
var set_frame = function(buf, frame, width, height) {
    for (var i = 0; i < height; ++i) {
        for (var j = 0; j < width; ++j) {
            var o = (j + (width*i))*4;
            buf[o + 0] = frame[o+2];
            buf[o + 1] = frame[o+1];
            buf[o + 2] = frame[o+0];
            buf[o + 3] = frame[o+3];
        }
    } 
}

function hasClass(el,check) { 
	if (el) return el.classList.contains(check);
	else return false;
}

function switchClass(el,fclass,sclass) {
	if (hasClass(el,fclass)) {
		el.classList.remove(fclass);
		el.classList.add(sclass);
	}
}

function animatePause() {
	$(".wcp-anim-basic").css("fontSize", "50px");
	$(".wcp-anim-basic").css("padding", "7px 27px");
	$(".wcp-anim-basic").css("borderRadius", "12px");
	$(".wcp-pause-anim").fadeIn(200).fadeOut(200);
	$(".wcp-anim-basic").animate({ fontSize: "80px", padding: "7px 30px" },400);
}

function findVolOffset(el,e) {
	if (e.originalEvent.path[0].classList[0] == "wcp-vol-bar-pointer") {
		var cOffset = parseInt(el.find(".wcp-vol-bar-full")[0].style.width.replace("px",""));
		if (e.offsetX == 0) var offset = cOffset -2;
		else if (e.offsetX == 1) var offset = cOffset -1;
		else if (e.offsetX == 2) var offset = cOffset +1;
		else if (e.offsetX == 3) var offset = cOffset +2;
	} else if (e.originalEvent.path[0].classList[0] == "wcp-vol-bar" || e.originalEvent.path[0].classList[0] == "wcp-vol-bar-full") {
		var offset = e.offsetX;
	} else var offset = parseInt(el.find(".wcp-vol-bar-full")[0].style.width.replace("px",""));
	
	if (offset) return offset;
	else return false;
}

function parseTime(t,total) {
	if (typeof total === 'undefined') total = t;
	var tempHour = ("0" + Math.floor(t / 3600000)).slice(-2);
	var tempMinute = ("0" + (Math.floor(t / 60000) %60)).slice(-2);
	var tempSecond = ("0" + (Math.floor(t / 1000) %60)).slice(-2);

	if (total >= 3600000) {
		return tempHour + ":" + tempMinute + ":" + tempSecond;
	} else {
		return tempMinute + ":" + tempSecond;
	}
}