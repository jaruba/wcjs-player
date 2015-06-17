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

// WebChimera.js Player v0.2.3

var vlcs = {},
	$ = require('jquery'),
	seekDrag = false,
	volDrag = false,
	firstTime = true;
		
		
if (!$("link[href='"+__dirname.replace("\\","/")+"/public/general.css']").length)
$('<link href="'+__dirname.replace("\\","/")+'/public/general.css" rel="stylesheet">').appendTo("head");

function wjs(context) {
	
	this.version = "v0.2.3";

	// Save the context
	this.context = (typeof context === "undefined") ? "#webchimera" : context;  // if no playerid set, default to "webchimera"
	
	this.video = { }; // Video Object (holds width, height, pixelFormat)

	if (this.context.substring(0,1) == "#") {
		this.canvas = window.document.getElementById(this.context.substring(1)).firstChild;
		this.allElements = [window.document.getElementById(this.context.substring(1))];
	} else if (this.context.substring(0,1) == ".") {
		this.allElements = window.document.getElementsByClassName(this.context.substring(1));
		this.canvas = this.allElements[0].firstChild;
	} else {
		this.allElements = window.document.getElementsByTagName(this.context);
		this.canvas = this.allElements[0].firstChild;
	}
	if (vlcs[this.context]) {
		this.vlc = vlcs[this.context].vlc;
		if (vlcs[this.context].width) {
			this.video = {};
			this.video.width = vlcs[this.context].width;
			this.video.height = vlcs[this.context].height;
			this.video.pixelFormat = vlcs[this.context].pixelFormat;
		}
	}
	
	return this;
};

wjs.prototype.addPlayer = function(wcpSettings,cb) {
	
	if (typeof wcpSettings === 'function') {
		cb = wcpSettings;
		wcpSettings = null;
	}
	
	if (wcpSettings) newid = (typeof wcpSettings["id"] === "undefined") ? "webchimera" : wcpSettings["id"]; // if no id set, default to "webchimera"
	else newid = "webchimera";
	
	if (window.document.getElementById(newid) !== null) {
		for (i = 2; window.document.getElementById(newid +i) !== null; i++) { }
		newid = newid +i;
	}
	
	if (typeof newid === 'string') {
		if (newid.substring(0,1) == "#") var targetid = ' id="'+newid.substring(1)+'" class="wcp-wrapper"';
		else if (newid.substring(0,1) == ".") { var targetid = ' id="webchimera" class="'+newid.substring(1)+' wcp-wrapper"'; newid = "#webchimera"; }
		else { var targetid = ' id="'+newid+'" class="wcp-wrapper"'; newid = "#"+newid; }
	} else { var targetid = ' id="webchimera" class="wcp-wrapper"'; newid = "#webchimera"; }
	
	vlcs[newid] = {};
	if (wcpSettings) {
		vlcs[newid].multiscreen = (typeof wcpSettings["multiscreen"] === "undefined") ? false : wcpSettings["multiscreen"];
	} else {
		vlcs[newid].multiscreen = false;
	}

	playerbody = '<div' + targetid + ' style="height: 100%"><canvas class="wcp-canvas wcp-center"></canvas><div class="wcp-surface"></div><div class="wcp-pause-anim wcp-center"><i class="wcp-anim-basic wcp-anim-icon-play"></i></div><div class="wcp-toolbar"><div class="wcp-toolbar-background"></div><div class="wcp-progress-bar"><div class="wcp-progress-seen"></div><div class="wcp-progress-pointer"></div></div><div class="wcp-button wcp-left wcp-pause"></div><div class="wcp-button wcp-left wcp-vol-button wcp-volume-medium"></div><div class="wcp-vol-control"><div class="wcp-vol-bar"><div class="wcp-vol-bar-full"></div><div class="wcp-vol-bar-pointer"></div></div></div><div class="wcp-time"><span class="wcp-time-current">00:00</span> / <span class="wcp-time-total">00:00</span></div><div class="wcp-button wcp-right wcp-maximize"></div></div><div class="wcp-status"></div><div class="wcp-tooltip"><div class="wcp-tooltip-arrow"></div><div class="wcp-tooltip-inner">00:00</div></div></div>';
	
	$(this.context).each(function(ij,el) { if (!hasClass(el,"webchimeras")) $(el).addClass("webchimeras"); el.innerHTML = playerbody; });
	
	if (vlcs[newid].multiscreen) {
		vlcs[newid].multiscreen = (typeof wcpSettings["multiscreen"] === "undefined") ? false : wcpSettings["multiscreen"];
		$(newid).find(".wcp-toolbar").hide(0);
		$(newid).find(".wcp-tooltip").hide(0);
		$(newid).css({cursor: 'pointer'});
	}

	wjs(newid).canvas = $(".wcp-wrapper")[0].firstChild;

	// resize video when window is resized
	if (firstTime) {
		firstTime = false;
		window.onresize = function() { autoResize(); };
		$(window).bind("mouseup",function(i) {
			return function(event) {
				mouseClickEnd(wjs(i),event);
			}
		}(newid)).bind("mousemove",function(i) {
			return function(event) {
				mouseMoved(wjs(i),event);
			}
		}(newid));
	}

	// toolbar button actions
	$(wjs(newid).canvas).parent().find(".wcp-button").click(function() {
		wjsPlayer = wjs("#"+$(this).parents(".wcp-wrapper")[0].id);
		vlc = wjsPlayer.vlc;
		buttonClass = this.className.replace("wcp-button","").replace("wcp-left","").replace("wcp-vol-button","").replace("wcp-right","").split(" ").join("");
		if ([3,4,6].indexOf(vlc.state) > -1) {
			if (buttonClass == "wcp-play") {
				switchClass($(this).parents(".wcp-wrapper").find(".wcp-anim-basic")[0],"wcp-anim-icon-pause","wcp-anim-icon-play");
				animatePause($(wjsPlayer.canvas).parent()[0].id);
				vlc.togglePause();
				switchClass(this,"wcp-play","wcp-pause");
			} else if (buttonClass == "wcp-pause") {
				switchClass($(this).parents(".wcp-wrapper").find(".wcp-anim-basic")[0],"wcp-anim-icon-play","wcp-anim-icon-pause");
				animatePause($(wjsPlayer.canvas).parent()[0].id);
				vlc.togglePause();
				switchClass(this,"wcp-pause","wcp-play");
			} else if (buttonClass == "wcp-replay") {
				switchClass($(this).parents(".wcp-wrapper").find(".wcp-anim-basic")[0],"wcp-anim-icon-pause","wcp-anim-icon-play");
				animatePause($(wjsPlayer.canvas).parent()[0].id);
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
			if (window.document.webkitCancelFullScreen) window.document.webkitCancelFullScreen();
			else if (window.document.cancelFullScreen) window.document.cancelFullScreen();
			switchClass(this,"wcp-minimize","wcp-maximize");
			if (vlcs["#"+$(this).parents(".wcp-wrapper")[0].id].multiscreen) {
				$(this).parents(".wcp-wrapper").find(".wcp-toolbar").hide(0);
				$(this).parents(".wcp-wrapper").find(".wcp-tooltip").hide(0);
				$(this).parents(".wcp-wrapper").css({cursor: 'pointer'});
				if (!wjs("#"+$(this).parents(".wcp-wrapper")[0].id).vlc.mute) {
					wjs("#"+$(this).parents(".wcp-wrapper")[0].id).vlc.mute = true;
				}
			}
		} else if (buttonClass == "wcp-maximize") {
			wcpWrapper = $(this).parents(".wcp-wrapper")[0];
			if (wcpWrapper.webkitRequestFullscreen) wcpWrapper.webkitRequestFullscreen();
			else if (wcpWrapper.requestFullscreen) wcpWrapper.requestFullscreen();
			switchClass(this,"wcp-maximize","wcp-minimize");
		}
	});
	
	// surface click actions
	$(wjs(newid).canvas).parent().find(".wcp-surface").click(function() {
		wjsPlayer = wjs("#"+$(this).parent()[0].id);
		vlc = wjsPlayer.vlc;
		if (vlc.state == 6) {
			$(this).parent().find(".wcp-replay").trigger("click");
			return;
		}
		if ([3,4].indexOf(vlc.state) > -1) {
			if (vlcs["#"+$(this).parents(".wcp-wrapper")[0].id].multiscreen && window.document.webkitFullscreenElement == null) {
				wcpWrapper = $(this).parents(".wcp-wrapper")[0];
				if (wcpWrapper.webkitRequestFullscreen) wcpWrapper.webkitRequestFullscreen();
				else if (wcpWrapper.requestFullscreen) wcpWrapper.requestFullscreen();
				$(wcpWrapper).css({cursor: 'default'});
				if (wjs("#"+$(this).parents(".wcp-wrapper")[0].id).vlc.mute) {
					wjs("#"+$(this).parents(".wcp-wrapper")[0].id).vlc.mute = false;
				}
				switchClass($(this).parent().find(".wcp-maximize")[0],"wcp-maximize","wcp-minimize");
			} else {
				if (vlc.state == 4) {
					switchClass($(this).parent().find(".wcp-anim-basic")[0],"wcp-anim-icon-pause","wcp-anim-icon-play");
					switchClass($(this).parent().find(".wcp-play")[0],"wcp-play","wcp-pause");
				} else if (vlc.state == 3) {
					switchClass($(this).parent().find(".wcp-anim-basic")[0],"wcp-anim-icon-play","wcp-anim-icon-pause");
					switchClass($(this).parent().find(".wcp-pause")[0],"wcp-pause","wcp-play");
				}
				animatePause($(this).parent()[0].id);
				vlc.togglePause();
			}
		}
	});
	
	$(wjs(newid).canvas).parent().find(".wcp-surface").dblclick(function() {
		$(this).parents(".wcp-wrapper").find(".wcp-anim-basic").finish();
		$(this).parents(".wcp-wrapper").find(".wcp-pause-anim").finish();
		if (window.document.webkitFullscreenElement == null) {
			wcpWrapper = $(this).parents(".wcp-wrapper")[0];
			if (wcpWrapper.webkitRequestFullscreen) wcpWrapper.webkitRequestFullscreen();
			else if (wcpWrapper.requestFullscreen) wcpWrapper.requestFullscreen();
			
			if ($(this).parents(".wcp-wrapper").find(".wcp-maximize").length > 0) {
				switchClass($(this).parents(".wcp-wrapper").find(".wcp-maximize")[0],"wcp-maximize","wcp-minimize");
			}
		} else {
			if (window.document.webkitCancelFullScreen) window.document.webkitCancelFullScreen();
			else if (window.document.cancelFullScreen) window.document.cancelFullScreen();

			if ($(this).parents(".wcp-wrapper").find(".wcp-maximize") > 0) {
				switchClass($(this).parents(".wcp-wrapper").find(".wcp-minimize"),"wcp-minimize","wcp-maximize");
			}
			if (vlcs["#"+$(this).parents(".wcp-wrapper")[0].id].multiscreen) {
				$(this).parents(".wcp-wrapper").find(".wcp-toolbar").hide(0);
				$(this).parents(".wcp-wrapper").find(".wcp-tooltip").hide(0);
				$(this).parents(".wcp-wrapper").css({cursor: 'pointer'});
				if (!wjs("#"+$(this).parents(".wcp-wrapper")[0].id).vlc.mute) {
					wjs("#"+$(this).parents(".wcp-wrapper")[0].id).vlc.mute = true;
				}
			}
		}
	});
	
	$(wjs(newid).canvas).parent().parent().bind("mousemove",function(e) {
		if (vlcs["#"+$(this).find(".wcp-wrapper")[0].id].multiscreen && window.document.webkitFullscreenElement == null) {
			$(this).css({cursor: 'default'});
		} else {
			clearTimeout(vlcs["#"+$(this).find(".wcp-wrapper")[0].id].hideUI);
			$(this).css({cursor: 'default'});
			
			$(this).find(".wcp-toolbar").stop().show(0);
			if (!volDrag && !seekDrag) {
				if ($($(this).find(".wcp-toolbar").selector + ":hover").length > 0) {
					vlcs["#"+$(this).find(".wcp-wrapper")[0].id].hideUI = setTimeout(function(i) { return function() { wcp_hideUI($(i).parent()); } }($(this)),3000);
					vlcs["#"+$(this).find(".wcp-wrapper")[0].id].timestampUI = Math.floor(Date.now() / 1000);
				} else vlcs["#"+$(this).find(".wcp-wrapper")[0].id].hideUI = setTimeout(function(i) { return function() { wcp_hideUI(i); } }($(this)),3000);
			}
		}
	});
	
    /* Progress and Volume Bars */
	$(wjs(newid).canvas).parent().find(".wcp-progress-bar").hover(function(arg1) {
		return progressHoverIn.call(this,arg1);
	}, function(e) {
		if (!seekDrag) sel.call(this,".wcp-tooltip").hide(0);
	});
	$(wjs(newid).canvas).parent().find(".wcp-progress-bar").bind("mousemove",function(arg1) {
		return progressMouseMoved.call(this,arg1);
	});

    $(wjs(newid).canvas).parent().find(".wcp-progress-bar").bind("mousedown", function(e) {
		seekDrag = true;
		var rect = $(this).parents(".wcp-wrapper")[0].getBoundingClientRect();
		p = (e.pageX - rect.left) / $(this).width();
		sel.call(this,".wcp-progress-seen").css("width", (p*100)+"%");
	});

    $(wjs(newid).canvas).parent().find(".wcp-vol-bar").bind("mousedown", function(e) {
		volDrag = true;
		var rect = sel.call(this,".wcp-vol-bar")[0].getBoundingClientRect();
		p = (e.pageX - rect.left) / $(this).width();
		sel.call(this,".wcp-vol-bar-full").css("width", Math.floor(p*116)+"px");
	});

	$(wjs(newid).canvas).parent().find(".wcp-vol-button").hover(function() {
		$(sel.call(this,".wcp-vol-control")).animate({ width: 133 },200);
	},function() {
		if (!$($(sel.call(this,".wcp-vol-control")).selector + ":hover").length > 0 && !volDrag) {
			$(sel.call(this,".wcp-vol-control")).animate({ width: 0 },200);
		}
	});
	
	$(wjs(newid).canvas).parent().find('.wcp-vol-control').mouseout(function() {
		if (!$(sel.call(this,".wcp-vol-button").selector + ":hover").length > 0 && !$(sel.call(this,".wcp-vol-bar").selector + ":hover").length > 0 && !$(sel.call(this,".wcp-vol-control").selector + ":hover").length > 0 && !volDrag) {
			sel.call(this,".wcp-vol-control").animate({ width: 0 },200);
		}
	});
	
	// set initial status message font size
	var fontSize = (parseInt($(this.allElements[0]).height())/15);
	if (fontSize < 20) fontSize = 20;
	$(this.allElements[0]).find(".wcp-status").css('fontSize', fontSize);

	// create player and attach event handlers
	wjsPlayer = wjs(newid);
	vlcs[newid].hideUI = setTimeout(function(i) { return function() { wcp_hideUI($(i).parent()); } }(newid),6000);
	vlcs[newid].timestampUI = 0;
	vlcs[newid].firstPlay = true;
	vlcs[newid].vlc = require("wcjs-renderer").init(wjs(newid).canvas);

	vlcs[newid].vlc.onPositionChanged = function(i) {
		return function(event) {
			positionChanged(wjs(i),event);
		}
	}(newid);

	vlcs[newid].vlc.onTimeChanged = function(i) {
		return function(event) {
			timePassed(wjs(i),event);
		}
	}(newid);
	
	vlcs[newid].vlc.onOpening = function(i) {
		return function() {
			isOpening(wjs(i));
		}
	}(newid);

	vlcs[newid].vlc.onBuffering = function(i) {
		return function(event) {
			isBuffering(wjs(i),event);
		}
	}(newid);

	vlcs[newid].vlc.onPlaying = function(i) {
		return function() {
			isPlaying(wjs(i));
		}
	}(newid);

	vlcs[newid].vlc.onEndReached = function(i) {
		return function() {
			hasEnded(wjs(i));
		}
	}(newid);

	cb.call(wjs(newid));

	return wjs(newid);
};

function progressHoverIn(e) {
	wjsPlayer = wjs("#"+$(this).parents(".wcp-wrapper")[0].id);
	vlc = wjsPlayer.vlc;
	if (vlc.length) {
		var rect = $(wjsPlayer.canvas).parent()[0].getBoundingClientRect();
		if (e.pageX >= rect.left && e.pageX <= rect.right) {
			var newtime = Math.floor(vlc.length * ((e.pageX - rect.left) / $(this).width()));
			if (newtime > 0) {
				$(wjsPlayer.canvas).parent().find(".wcp-tooltip-inner").text(parseTime(newtime));
				var offset = Math.floor($(wjsPlayer.canvas).parent().find(".wcp-tooltip").width() / 2);
				if (e.pageX >= (offset + rect.left) && e.pageX <= (rect.right - offset)) {
					$(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",((e.pageX - rect.left) - offset)+"px");
				} else if (e.pageX < (rect.left + offset)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",rect.left+"px");
				else if (e.pageX > (rect.right - offset)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",(rect.right - $(wjsPlayer.canvas).parent().find(".wcp-tooltip").width())+"px");
				$(wjsPlayer.canvas).parent().find(".wcp-tooltip").show(0);
			}
		} else $(wjsPlayer.canvas).parent().find(".wcp-tooltip").hide(0);
	}
}

function progressMouseMoved(e) {
	wjsPlayer = wjs("#"+$(this).parents(".wcp-wrapper")[0].id);
	vlc = wjsPlayer.vlc;
	if (vlc.length) {
		var rect = $(wjsPlayer.canvas).parent()[0].getBoundingClientRect();
		if (e.pageX >= rect.left && e.pageX <= rect.right) {
			var newtime = Math.floor(vlc.length * ((e.pageX - rect.left) / $(this).width()));
			if (newtime > 0) {
				$(wjsPlayer.canvas).parent().find(".wcp-tooltip-inner").text(parseTime(newtime));
				var offset = Math.floor($(wjsPlayer.canvas).parent().find(".wcp-tooltip").width() / 2);
				if (e.pageX >= (offset + rect.left) && e.pageX <= (rect.right - offset)) {
					$(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",((e.pageX - rect.left) - offset)+"px");
				} else if (e.pageX < (rect.left + offset)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",rect.left+"px");
				else if (e.pageX > (rect.right - offset)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",(rect.right - $(wjsPlayer.canvas).parent().find(".wcp-tooltip").width())+"px");
				$(wjsPlayer.canvas).parent().find(".wcp-tooltip").show(0);
			}
		} else $(wjsPlayer.canvas).parent().find(".wcp-tooltip").hide(0);
	}
}

function mouseClickEnd(wjsPlayer,e) {
	clearInterval(vlcs["#"+$(wjsPlayer.canvas).parent()[0].id].hideUI);
	$(wjsPlayer.canvas).parent().parent().css({cursor: 'default'});
	vlcs["#"+$(wjsPlayer.canvas).parent()[0].id].hideUI = setTimeout(function(i) { return function() { wcp_hideUI($(i).parent()); } }(wjsPlayer.context),3000);
	if (seekDrag) {
		seekDrag = false;
		if (window.document.webkitFullscreenElement != null) {
			vlc = wjs("#"+window.document.webkitFullscreenElement.id).vlc;
			p = e.pageX / window.document.webkitFullscreenElement.offsetWidth;
			$(window.document.webkitFullscreenElement).find(".wcp-progress-seen").css("width", (p*100)+"%");
			vlc.position = p;
			$(window.document.webkitFullscreenElement).find(".wcp-tooltip").hide(0);
			$(window.document.webkitFullscreenElement).find(".wcp-time-current").text($(window.document.webkitFullscreenElement).find(".wcp-tooltip-inner").text());
		} else {
			$('.webchimeras').each(function(i, obj) {
				var rect = obj.getBoundingClientRect();
				if (e.pageX >= rect.left && e.pageX <= rect.right && e.pageY >= rect.top && e.pageY <= rect.bottom) {
					vlc = wjs("#"+$(obj).find(".wcp-wrapper")[0].id).vlc;
					p = (e.pageX - rect.left) / (rect.right - rect.left);
					$(obj).find(".wcp-progress-seen").css("width", (p*100)+"%");
					vlc.position = p;
				}
				$(obj).find(".wcp-tooltip").hide(0);
				$(obj).find(".wcp-time-current").text($(obj).find(".wcp-tooltip-inner").text());
			});
		}
	}
	if (volDrag) {
		volDrag = false;
		if (window.document.webkitFullscreenElement != null) {
			obj = window.document.webkitFullscreenElement;
			rect = $(obj).find(".wcp-vol-bar")[0].getBoundingClientRect();
			if (e.pageX >= rect.right) {
				p = 1;
				offset = 116;
				setTimeout(function() { $(obj).find(".wcp-vol-control").animate({ width: 0 },200); },1500);
			} else if (e.pageX <= rect.left)  {
				p = 0;
				offset = 0;
				setTimeout(function() { $(obj).find(".wcp-vol-control").animate({ width: 0 },200); },1500);
			} else {
				p = (e.pageX - rect.left) / (rect.right - rect.left);
				offset = e.pageX - rect.left;
				if (e.pageY < rect.top) setTimeout(function() { $(obj).find(".wcp-vol-control").animate({ width: 0 },200); },1500);
				else if (e.pageY > rect.bottom) setTimeout(function() { $(obj).find(".wcp-vol-control").animate({ width: 0 },200); },1500);
			}
			if (offset) {
				$(obj).find(".wcp-vol-bar-full").css("width", offset+"px");
				if (offset > 116) offset = 116;
				if (offset < 0) offset = 0;
				vlc = wjs("#"+obj.id).vlc;
				vlc.volume = Math.floor(200* p);
			}
		} else {
			$('.webchimeras').each(function(i, obj) {
				var rect = obj.getBoundingClientRect();
				if (e.pageX >= rect.left && e.pageX <= rect.right && e.pageY >= rect.top && e.pageY <= rect.bottom) {
					rect = $(obj).find(".wcp-vol-bar")[0].getBoundingClientRect();
					if (e.pageX >= rect.right) {
						p = 1;
						offset = 116;
						setTimeout(function() { $(obj).find(".wcp-vol-control").animate({ width: 0 },200); },1500);
					} else if (e.pageX <= rect.left)  {
						p = 0;
						offset = 0;
						setTimeout(function() { $(obj).find(".wcp-vol-control").animate({ width: 0 },200); },1500);
					} else {
						p = (e.pageX - rect.left) / (rect.right - rect.left);
						offset = e.pageX - rect.left;
						if (e.pageY < rect.top) setTimeout(function() { $(obj).find(".wcp-vol-control").animate({ width: 0 },200); },1500);
						else if (e.pageY > rect.bottom) setTimeout(function() { $(obj).find(".wcp-vol-control").animate({ width: 0 },200); },1500);
					}
					if (offset) {
						$(obj).find(".wcp-vol-bar-full").css("width", offset+"px");
						if (offset > 116) offset = 116;
						if (offset < 0) offset = 0;
						vlc = wjs("#"+$(obj).find(".wcp-wrapper")[0].id).vlc;
						vlc.volume = Math.floor(200* p);
					}
				}
			});
		}
	}
}

function mouseMoved(wjsPlayer,e) {
	if (seekDrag) {
		if (window.document.webkitFullscreenElement != null) {
			p = e.pageX / window.document.webkitFullscreenElement.offsetWidth;
			wjsPlayer = wjs("#"+window.document.webkitFullscreenElement.id);
			$(wjsPlayer.canvas).parent().find(".wcp-progress-seen").css("width", (p*100)+"%");
			var newtime = Math.floor(vlc.length * (e.pageX / window.document.webkitFullscreenElement.offsetWidth));
			if (newtime > 0) {
				$(wjsPlayer.canvas).parent().find(".wcp-tooltip-inner").text(parseTime(newtime));
				var offset = Math.floor($(wjsPlayer.canvas).parent().find(".wcp-tooltip").width() / 2);
				if (e.pageX >= (offset + 0) && e.pageX <= (window.document.webkitFullscreenElement.offsetWidth - offset)) {
					$(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",(e.pageX - offset)+"px");
				} else if (e.pageX < (window.document.webkitFullscreenElement.offsetWidth + offset)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left","0px");
				else if (e.pageX > offset*(-1)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",(0 - $(".wcp-tooltip").width())+"px");
				$(wjsPlayer.canvas).parent().find(".wcp-tooltip").show(0);
			}
			
		} else {
			var rect = $(wjsPlayer.canvas).parent()[0].getBoundingClientRect();
			$('.webchimeras').each(function(i, obj) {
				var rect = obj.getBoundingClientRect();
				if (e.pageX >= rect.left && e.pageX <= rect.right && e.pageY >= rect.top && e.pageY <= rect.bottom) {
					p = (e.pageX - rect.left) / (rect.right - rect.left);
					wjsPlayer = wjs("#"+$(obj).find(".wcp-wrapper")[0].id);
					$(wjsPlayer.canvas).parent().find(".wcp-progress-seen").css("width", (p*100)+"%");
					var newtime = Math.floor(vlc.length * ((e.pageX - rect.left) / $(this).width()));
					if (newtime > 0) {
						$(wjsPlayer.canvas).parent().find(".wcp-tooltip-inner").text(parseTime(newtime));
						var offset = Math.floor($(wjsPlayer.canvas).parent().find(".wcp-tooltip").width() / 2);
						if (e.pageX >= (offset + rect.left) && e.pageX <= (rect.right - offset)) {
							$(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",((e.pageX - rect.left) - offset)+"px");
						} else if (e.pageX < (rect.left + offset)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",rect.left+"px");
						else if (e.pageX > (rect.right - offset)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",(rect.right - $(".wcp-tooltip").width())+"px");
						$(wjsPlayer.canvas).parent().find(".wcp-tooltip").show(0);
					}
				}
			});
		}
	}
	if (volDrag) {
		if (window.document.webkitFullscreenElement != null) {
			wjsPlayer = wjs("#"+window.document.webkitFullscreenElement.id);
			var rect = $(wjsPlayer.canvas).parent().find(".wcp-vol-bar")[0].getBoundingClientRect();
			if (e.pageX >= rect.left && e.pageX <= rect.right) {
				p = (e.pageX - rect.left) / (rect.right - rect.left);
				$(wjsPlayer.canvas).parent().find(".wcp-vol-bar-full").css("width", Math.floor(p*116)+"px");
				vlc = wjsPlayer.vlc;
				vlc.volume = Math.floor(200* p);
			}
		} else {
			$('.webchimeras').each(function(i, obj) {
				wjsPlayer = wjs("#"+$(obj).find(".wcp-wrapper")[0].id);
				var rect = $(wjsPlayer.canvas).parent().find(".wcp-vol-bar")[0].getBoundingClientRect();
				var rectWrapper = $(wjsPlayer.canvas).parents(".webchimeras")[0].getBoundingClientRect();
				if (e.pageX >= rectWrapper.left && e.pageX <= rectWrapper.right && e.pageY >= rectWrapper.top && e.pageY <= rectWrapper.bottom) {
					if (e.pageX >= rect.left && e.pageX <= rect.right) {
						p = (e.pageX - rect.left) / (rect.right - rect.left);
						$(wjsPlayer.canvas).parent().find(".wcp-vol-bar-full").css("width", Math.floor(p*116)+"px");
						vlc = wjsPlayer.vlc;
						vlc.volume = Math.floor(200* p);
					}
				}
			});
		}
	}
}


// html element selector
function sel(context) {
	return $($(this).parents(".wcp-wrapper")[0]).find(context);
}


// player event handlers
function timePassed(wjsPlayer,t) {
	$(wjsPlayer.canvas).parent().find(".wcp-time-current").text(parseTime(t,wjsPlayer.vlc.length));
}
function positionChanged(wjsPlayer,position) {
	if (!seekDrag) $(wjsPlayer.canvas).parent().find(".wcp-progress-seen")[0].style.width = (position*100)+"%";
};

function isOpening(wjsPlayer) {
	var style = window.getComputedStyle($(wjsPlayer.allElements[0]).find(".wcp-status")[0]);
	if (style.display === 'none') $(wjsPlayer.allElements[0]).find(".wcp-status").show();
	$(wjsPlayer.allElements[0]).find(".wcp-status").text("Opening");
};

function isBuffering(wjsPlayer,percent) {
	var style = window.getComputedStyle($(wjsPlayer.allElements[0]).find(".wcp-status")[0]);
	if (style.display === 'none') $(wjsPlayer.allElements[0]).find(".wcp-status").show(0);
	$(wjsPlayer.allElements[0]).find(".wcp-status").text("Buffering "+percent+"%");
	if (percent == 100) $(wjsPlayer.allElements[0]).find(".wcp-status").fadeOut(1200);
};

function isPlaying(wjsPlayer) {
	if (vlcs[wjsPlayer.context].firstPlay) {
		vlcs[wjsPlayer.context].firstPlay = false;
		setTimeout(function() { autoResize(); },50);
	}
	var style = window.getComputedStyle($(wjsPlayer.allElements[0]).find(".wcp-status")[0]);
	if (style.display !== 'none') $(wjsPlayer.allElements[0]).find(".wcp-status").fadeOut(1200);
	$(wjsPlayer.allElements[0]).find(".wcp-time-total").text(parseTime(this.vlc.length));
};

function hasEnded(wjsPlayer) {
	switchClass($(wjsPlayer.allElements[0]).find(".wcp-pause")[0],"wcp-pause","wcp-replay");
};
// end player event handlers

function autoResize() {
	$('.webchimeras').each(function(i, obj) {
		if ($(obj).find(".wcp-wrapper")[0]) {
			var wjsPlayer = wjs("#"+$(obj).find(".wcp-wrapper")[0].id);
			// resize status font size
			var fontSize = (parseInt($(wjsPlayer.allElements[0]).height())/15);
			if (fontSize < 20) fontSize = 20;
			$(wjsPlayer.allElements[0]).find(".wcp-status").css('fontSize', fontSize);
			
			// resize video layer
			var container = $(wjsPlayer.context);
			var sourceAspect = wjsPlayer.canvas.width / wjsPlayer.canvas.height;
			var destAspect = container.width() / container.height();
			var cond = destAspect > sourceAspect;
		
			if (cond) {
				wjsPlayer.canvas.style.height = "100%";
				wjsPlayer.canvas.style.width = ( (container.height() * sourceAspect) / container.width() ) * 100 + "%";
			} else {
				wjsPlayer.canvas.style.height = ( (container.width() / sourceAspect) / container.height() ) * 100 + "%";
				wjsPlayer.canvas.style.width = "100%";
			}
		}
	});
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

function animatePause(i) {
	$("#"+i).find(".wcp-anim-basic").css("fontSize", "50px");
	$("#"+i).find(".wcp-anim-basic").css("padding", "7px 27px");
	$("#"+i).find(".wcp-anim-basic").css("borderRadius", "12px");
	$("#"+i).find(".wcp-pause-anim").fadeIn(200).fadeOut(200);
	$("#"+i).find(".wcp-anim-basic").animate({ fontSize: "80px", padding: "7px 30px" },400);
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

function wcp_hideUI(wjsWrapper) {
	if (vlcs["#"+wjsWrapper.find(".wcp-wrapper")[0].id].multiscreen && window.document.webkitFullscreenElement == null) {
	} else {
		if ($(wjsWrapper.find(".wcp-toolbar").selector + ":hover").length > 0 && vlcs["#"+wjsWrapper.find(".wcp-wrapper")[0].id].timestampUI + 20 > Math.floor(Date.now() / 1000))  {
			vlcs["#"+wjsWrapper.find(".wcp-wrapper")[0].id].hideUI = setTimeout(function(i) { return function() { wcp_hideUI(i); } }(wjsWrapper),3000);
			return;
		}
		wjsWrapper.find(".wcp-toolbar").stop().fadeOut();
		wjsWrapper.find(".wcp-tooltip").stop().fadeOut();
		wjsWrapper.css({cursor: 'none'});
	}
}

module.exports = wjs;