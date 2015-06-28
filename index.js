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

// WebChimera.js Player v0.3.1

var vlcs = {},
	opts = {},
	$ = require('jquery'),
	seekDrag = false,
	volDrag = false,
	firstTime = true,
	http = require('http');

if (!$("link[href='"+__dirname.replace("\\","/")+"/public/general.css']").length) {
	// inject stylesheet
	$('<link href="'+__dirname.replace("\\","/")+'/public/general.css" rel="stylesheet">').appendTo("head");
	
	// inject scrollbar css
	window.document.styleSheets[0].addRule('.wcp-menu-items::-webkit-scrollbar','width: 44px;');
	window.document.styleSheets[0].addRule('.wcp-menu-items::-webkit-scrollbar-track','background-color: #696969; border-right: 13px solid rgba(0, 0, 0, 0); border-left: 21px solid rgba(0, 0, 0, 0); background-clip: padding-box;');
	window.document.styleSheets[0].addRule('.wcp-menu-items::-webkit-scrollbar-thumb','background-color: #e5e5e5; border-right: 13px solid rgba(0, 0, 0, 0); border-left: 21px solid rgba(0, 0, 0, 0); background-clip: padding-box;');
}

function wjs(context) {
	
	this.version = "v0.3.1";

	// Save the context
	this.context = (typeof context === "undefined") ? "#webchimera" : context;  // if no playerid set, default to "webchimera"
	
	if (hasClass($(this.context)[0],"webchimeras")) this.context = "#"+$(this.context).find(".wcp-wrapper")[0].id;
	
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
		this.renderer = vlcs[this.context].renderer;
		if (vlcs[this.context].width) {
			this.video = {};
			this.video.width = vlcs[this.context].width;
			this.video.height = vlcs[this.context].height;
			this.video.pixelFormat = vlcs[this.context].pixelFormat;
		}
	}
	if (opts[this.context]) this.opts = opts[this.context];
	
	return this;
};

wjs.prototype.toggleMute = function() {
	if (!this.vlc.mute) $(this.canvas).parents(".wcp-wrapper").find(".wcp-vol-button").removeClass("wcp-volume-medium").addClass("wcp-mute");
	else $(this.canvas).parents(".wcp-wrapper").find(".wcp-vol-button").removeClass("wcp-mute").addClass("wcp-volume-medium");
	this.vlc.toggleMute();
	return this;
};

wjs.prototype.togglePause = function() {
	if (!this.vlc.playing) {
		wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-play");
		if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
		
		wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-replay");
		if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-pause");
		
		if (this.vlc.playlist.itemCount > 0) this.vlc.playlist.play();
	} else {
		$(this.canvas).parents(".wcp-wrapper").find(".wcp-pause").removeClass("wcp-pause").addClass("wcp-play");
		this.vlc.playlist.pause();
	}
	return this;
};

wjs.prototype.play = function(mrl) {
	if (!this.vlc.playing) {
		wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-play");
		if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
		
		wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-replay");
		if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-pause");
		
		if (mrl) this.vlc.play(mrl);
		else if (this.vlc.playlist.itemCount > 0) this.vlc.playlist.play();
	}
	return this;
};

wjs.prototype.pause = function() {
	if (this.vlc.playing) {
		$(this.canvas).parents(".wcp-wrapper").find(".wcp-pause").removeClass("wcp-pause").addClass("wcp-play");
		this.vlc.playlist.pause();
	}
	return this;
};

wjs.prototype.playItem = function(i) {
	if (typeof i !== 'undefined') {
		wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-play");
		if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
		
		wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-replay");
		if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-pause");

		this.vlc.playlist.playItem(i);

		positionChanged(this,0);
		$(this.canvas).parents(".wcp-wrapper").find(".wcp-time-current").text("00:00");
	} else return false;
	return this;
};

wjs.prototype.stop = function() {
	wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-pause");
	if (wjs_button.length != 0) wjs_button.removeClass("wcp-pause").addClass("wcp-play");

	wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-replay");
	if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-play");

	this.vlc.playlist.stop();
		
	positionChanged(this,0);
	$(this.canvas).parents(".wcp-wrapper").find(".wcp-time-current").text("00:00");
	return this;
};

wjs.prototype.next = function() {
	if (this.vlc.playlist.currentItem +1 < this.vlc.playlist.itemCount) {
		wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-play");
		if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
	
		wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-replay");
		if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-pause");
	
		this.vlc.playlist.next();
		
		positionChanged(this,0);
		$(this.canvas).parents(".wcp-wrapper").find(".wcp-time-current").text("00:00");
		return this;
	} else return false;
};

wjs.prototype.prev = function() {
	if (this.vlc.playlist.currentItem > 0) {
		wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-play");
		if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
	
		wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-replay");
		if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-pause");
	
		this.vlc.playlist.prev();
		
		positionChanged(this,0);
		$(this.canvas).parents(".wcp-wrapper").find(".wcp-time-current").text("00:00");
		return this;
	} else return false;
};

wjs.prototype.addPlayer = function(wcpSettings) {
	
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
		opts[newid] = wcpSettings;
		vlcs[newid].multiscreen = (typeof wcpSettings["multiscreen"] === "undefined") ? false : wcpSettings["multiscreen"];
	} else {
		opts[newid] = {};
		vlcs[newid].multiscreen = false;
	}
	opts[newid].subDelay = 0;
	opts[newid].lastItem = -1;
	if (typeof opts[newid].allowFullscreen === 'undefined') opts[newid].allowFullscreen = true;

	playerbody = '<div' + targetid + ' style="height: 100%"><canvas class="wcp-canvas wcp-center"></canvas><div class="wcp-surface"></div><div class="wcp-menu wcp-playlist wcp-center"><div class="wcp-menu-close"></div><div class="wcp-menu-title">Playlist Menu</div><div class="wcp-menu-items wcp-playlist-items"></div></div><div class="wcp-menu wcp-subtitles wcp-center"><div class="wcp-menu-close"></div><div class="wcp-menu-title">Subtitle Menu</div><div class="wcp-menu-items wcp-subtitles-items"></div></div><div class="wcp-pause-anim wcp-center"><i class="wcp-anim-basic wcp-anim-icon-play"></i></div><div class="wcp-toolbar"><div class="wcp-toolbar-background"></div><div class="wcp-progress-bar"><div class="wcp-progress-seen"></div><div class="wcp-progress-pointer"></div></div><div class="wcp-button wcp-left wcp-prev" style="display: none"></div><div class="wcp-button wcp-left wcp-pause"></div><div class="wcp-button wcp-left wcp-next" style="display: none"></div><div class="wcp-button wcp-left wcp-vol-button wcp-volume-medium"></div><div class="wcp-vol-control"><div class="wcp-vol-bar"><div class="wcp-vol-bar-full"></div><div class="wcp-vol-bar-pointer"></div></div></div><div class="wcp-time"><span class="wcp-time-current">00:00</span> / <span class="wcp-time-total">00:00</span></div><div class="wcp-button wcp-right wcp-maximize"';
	if (!opts[newid].allowFullscreen) playerbody += ' style="cursor: not-allowed; color: rgba(123,123,123,0.6);"';
	playerbody += '></div><div class="wcp-button wcp-right wcp-playlist-but"></div><div class="wcp-button wcp-right wcp-subtitle-but"></div></div><div class="wcp-status"></div><div class="wcp-subtitle-text"></div><div class="wcp-tooltip"><div class="wcp-tooltip-arrow"></div><div class="wcp-tooltip-inner">00:00</div></div></div>';
	
	opts[newid].currentSub = 0;
	opts[newid].trackSub = -1;
	
	$(this.context).each(function(ij,el) { if (!hasClass(el,"webchimeras")) $(el).addClass("webchimeras"); el.innerHTML = playerbody; });
	
	if (vlcs[newid].multiscreen) {
		vlcs[newid].multiscreen = (typeof wcpSettings["multiscreen"] === "undefined") ? false : wcpSettings["multiscreen"];
		$(newid).find(".wcp-toolbar").hide(0);
		$(newid).find(".wcp-tooltip").hide(0);
		$(newid).css({cursor: 'pointer'});
	}

	wjs(newid).canvas = $(newid)[0].firstChild;

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

	$(wjs(newid).canvas).parent().find(".wcp-menu-close").click(function() {
		if ($(this).parents(".wcp-wrapper").find(".wcp-playlist").is(":visible")) {
			$(this).parents(".wcp-wrapper").find(".wcp-playlist").hide(0);
		} else if ($(this).parents(".wcp-wrapper").find(".wcp-subtitles").is(":visible")) {
			$(this).parents(".wcp-wrapper").find(".wcp-subtitles").hide(0);
		}
	});

	// toolbar button actions
	$(wjs(newid).canvas).parent().find(".wcp-button").click(function() {
		wjsPlayer = wjs("#"+$(this).parents(".wcp-wrapper")[0].id);
		vlc = wjsPlayer.vlc;
		buttonClass = this.className.replace("wcp-button","").replace("wcp-left","").replace("wcp-vol-button","").replace("wcp-right","").split(" ").join("");
		if (buttonClass == "wcp-playlist-but") {
			if ($(this).parents(".wcp-wrapper").find(".wcp-playlist").is(":visible")) {
				$(this).parents(".wcp-wrapper").find(".wcp-playlist").hide(0);
			} else {
				if ($(this).parents(".wcp-wrapper").find(".wcp-subtitles").is(":visible")) {
					$(this).parents(".wcp-wrapper").find(".wcp-subtitles").hide(0);
				}
				printPlaylist(wjs("#"+$(this).parents(".wcp-wrapper")[0].id));
				$(this).parents(".wcp-wrapper").find(".wcp-playlist").show(0);
			}
		}
		if (buttonClass == "wcp-subtitle-but") {
			if ($(this).parents(".wcp-wrapper").find(".wcp-subtitles").is(":visible")) {
				$(this).parents(".wcp-wrapper").find(".wcp-subtitles").hide(0);
			} else {
				if ($(this).parents(".wcp-wrapper").find(".wcp-playlist").is(":visible")) {
					$(this).parents(".wcp-wrapper").find(".wcp-playlist").hide(0);
				}
				printSubtitles(wjs("#"+$(this).parents(".wcp-wrapper")[0].id));
				$(this).parents(".wcp-wrapper").find(".wcp-subtitles").show(0);
			}
		}
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
				$(this).parents(".wcp-wrapper").find(".wcp-progress-seen").css("width","0%");
				$(this).parents(".wcp-wrapper").find(".wcp-time-current").text("00:00");
			} else if (buttonClass == "wcp-prev") {
				wjs_button = $(this).parents(".wcp-wrapper").find(".wcp-play");
				if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
			
				wjs_button = $(this).parents(".wcp-wrapper").find(".wcp-replay");
				if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-pause");
			
				vlc.playlist.prev();
				
				positionChanged(wjsPlayer,0);
				$(this).parents(".wcp-wrapper").find(".wcp-time-current").text("00:00");
			} else if (buttonClass == "wcp-next") {
				wjs_button = $(this).parents(".wcp-wrapper").find(".wcp-play");
				if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
			
				wjs_button = $(this).parents(".wcp-wrapper").find(".wcp-replay");
				if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-pause");
			
				vlc.playlist.next();
				
				positionChanged(wjsPlayer,0);
				$(this).parents(".wcp-wrapper").find(".wcp-time-current").text("00:00");
			} else if (["wcp-volume-low","wcp-volume-medium","wcp-volume-high"].indexOf(buttonClass) > -1) {
				switchClass(this,buttonClass,"wcp-mute");
				vlc.toggleMute();
			} else if (buttonClass == "wcp-mute") {
				switchClass(this,buttonClass,"wcp-volume-medium");
				vlc.toggleMute();
			}
		}
		if ([5].indexOf(vlc.state) > -1) {
			if (buttonClass == "wcp-play") {
				wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-play");
				if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
				
				animatePause($(wjsPlayer.canvas).parent()[0].id);
				
				if (vlc.playlist.itemCount > 0) vlc.playlist.play();
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
			if (wjs("#"+$(this).parents(".wcp-wrapper")[0].id).opts.allowFullscreen) {
				wcpWrapper = $(this).parents(".wcp-wrapper")[0];
				if (wcpWrapper.webkitRequestFullscreen) wcpWrapper.webkitRequestFullscreen();
				else if (wcpWrapper.requestFullscreen) wcpWrapper.requestFullscreen();
				switchClass(this,"wcp-maximize","wcp-minimize");
			}
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
					$(this).parents(".wcp-wrapper").find(".wcp-vol-button").removeClass("wcp-mute").addClass("wcp-volume-medium");
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
		if ([5].indexOf(vlc.state) > -1) {
			if (!vlc.playing) {
				wjs_button = $(this).parent().find(".wcp-play");
				if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
				
				animatePause($(wjsPlayer.canvas).parent()[0].id);
				
				if (vlc.playlist.itemCount > 0) vlc.playlist.play();
			}
		}
	});
	
	$(wjs(newid).canvas).parent().find(".wcp-surface").dblclick(function() {
		if (wjs("#"+$(this).parents(".wcp-wrapper")[0].id).opts.allowFullscreen) {
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
	
				if ($(this).parents(".wcp-wrapper").find(".wcp-minimize").length > 0) {
					switchClass($(this).parents(".wcp-wrapper").find(".wcp-minimize")[0],"wcp-minimize","wcp-maximize");
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
	vlcs[newid].renderer = require("wcjs-renderer");
	
	// set default network-caching to 10 seconds
	if (!wcpSettings["buffer"]) wcpSettings["buffer"] = 10000;
	
	if (!wcpSettings["vlcArgs"]) wcpSettings["vlcArgs"] = ["--network-caching="+wcpSettings["buffer"]];
	else {
		var checkBuffer = wcpSettings["vlcArgs"].some(function(el,ij) {
			if (el.indexOf("--network-caching") == 0) return true;
		});
		if (!checkBuffer) wcpSettings["vlcArgs"].push("--network-caching="+wcpSettings["buffer"]);
	}

	
	if (wcpSettings && wcpSettings["vlcArgs"]) vlcs[newid].vlc = vlcs[newid].renderer.init(wjs(newid).canvas,wcpSettings["vlcArgs"]);
	else vlcs[newid].vlc = vlcs[newid].renderer.init(wjs(newid).canvas);
	
	vlcs[newid].vlc.onFrameSetup = function(i) {
		return function(width, height, pixelFormat, videoFrame) {
			vlcs[i].renderer.frameSetup(canvas, width, height, pixelFormat, videoFrame);
			singleResize(wjs(i), width, height, pixelFormat, videoFrame);
		}
	}(newid);

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

	vlcs[newid].vlc.onMediaChanged = function(i) {
		return function() {
			isMediaChanged(wjs(i));
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
	
	// set playlist mode to single playback, the player has it's own playlist mode feature
	vlcs[newid].vlc.playlist.mode = vlcs[newid].vlc.playlist.Single;

	return new wjs(newid);
};

// function to add playlist items
wjs.prototype.addPlaylist = function(playlist) {
	 if (this.itemCount() > 0) {
		 $(this.canvas).parent().find(".wcp-prev").show(0);
		 $(this.canvas).parent().find(".wcp-next").show(0);
	 }
	 // convert all strings to json object
	 if (Array.isArray(playlist) === true) {
		 var item = 0;
		 for (item = 0; typeof playlist[item] !== 'undefined'; item++) {
			 if (typeof playlist[item] === 'string') {
				 var tempPlaylist = playlist[item];
				 delete playlist[item];
				 playlist[item] = {
					url: tempPlaylist
				 };
			 }
		 }
	 } else if (typeof playlist === 'string') {		 
		 var tempPlaylist = playlist;
		 delete playlist;
		 playlist = [];
		 playlist.push({
			url: tempPlaylist
		 });
		 delete tempPlaylist;
	 } else if (typeof playlist === 'object') {
		 var tempPlaylist = playlist;
		 delete playlist;
		 playlist = [];
		 playlist.push(tempPlaylist);
		 delete tempPlaylist;
	 }
	 // end convert all strings to json object

	 if (Array.isArray(playlist) === true && typeof playlist[0] === 'object') {
		 var item = 0;
		 for (item = 0; item < playlist.length; item++) {
			  if (playlist[item].vlcArgs) {
				  if (!Array.isArray(playlist[item].vlcArgs)) {
					  if (playlist[item].vlcArgs.indexOf(" ") > -1) {
						  playlist[item].vlcArgs = playlist[item].vlcArgs.split(" ");
					  } else playlist[item].vlcArgs = [playlist[item].vlcArgs];
				  }
				  this.vlc.playlist.addWithOptions(playlist[item].url,playlist[item].vlcArgs);
			  } else this.vlc.playlist.add(playlist[item].url);
			  if (playlist[item].title) this.vlc.playlist.items[this.vlc.playlist.itemCount-1].title = "[custom]"+playlist[item].title;
			  this.vlc.playlist.items[this.vlc.playlist.itemCount-1].setting = "{}";
			  var playerSettings = {};
			  if (typeof playlist[item].subtitles !== 'undefined') playerSettings.subtitles = playlist[item].subtitles;
			  if (Object.keys(playerSettings).length > 0) this.vlc.playlist.items[this.vlc.playlist.itemCount-1].setting = JSON.stringify(playerSettings);
		  }
	 }
	 if (this.state() == "idle") {
		if (this.opts.autoplay || this.opts.autostart) {
			this.playItem(0);
		}
		if ((this.opts.mute || this.opts.multiscreen) && this.vlc.mute === false) {
			$(this.canvas).parents(".wcp-wrapper").find(".wcp-vol-button").removeClass("wcp-volume-medium").addClass("wcp-mute");
			this.vlc.mute = true;
		}
	 }
	// needs to refresh Playlist Menu items in the future
	if ($(this.canvas).parents(".wcp-wrapper").find(".wcp-playlist").is(":visible")) printPlaylist(this);
	
	// show playlist button if multiple playlist items
	if (this.vlc.playlist.itemCount > 1) {
		$(this.canvas).parents(".wcp-wrapper").find(".wcp-playlist-but").css({ display: "block" });
	}

	return this;
};
// end function to add playlist items

// function to Clear External Subtitle
wjs.prototype.clearSubtitle = function() {
	clearSubtitles(this);
	return this;
};
// end function to Clear External Subtitle

// function to Get Subtitle Description
wjs.prototype.subDesc = function(getDesc) {
	// check if it is a number then return description
	if (!isNaN(getDesc)) {
		if (getDesc < this.vlc.subtitles.count) {
			wjs_subResponse = {};
			wjs_subResponse.language = this.vlc.subtitles[getDesc];
			wjs_subResponse.type = "internal";
			return wjs_subResponse;
		} else {
			var getSettings = {};
			getSettings = JSON.parse(this.vlc.playlist.items[this.vlc.playlist.currentItem].setting);
			if (getSettings.subtitles) {
				wjs_target = getSettings.subtitles;
				wjs_keepIndex = this.vlc.subtitles.count;
				if (wjs_keepIndex == 0) wjs_keepIndex = 1;
				for (var newDesc in wjs_target) if (wjs_target.hasOwnProperty(newDesc)) {
					if (getDesc == wjs_keepIndex) {
						wjs_subResponse = {};
						wjs_subResponse.language = newDesc;
						wjs_subResponse.type = "external";
						wjs_subResponse.url = wjs_target[newDesc];
						wjs_subResponse.ext = wjs_target[newDesc].split('.').pop().toLowerCase();
						if (wjs_subResponse.ext.indexOf('[') > -1) wjs_subResponse.ext = wjs_subResponse.ext.substr(0,wjs_subResponse.ext.indexOf('['));
						return wjs_subResponse;
					}
					wjs_keepIndex++;
				}
				return;
			}
		}
		return;
	} else return console.error("Value sent to .subDesc() needs to be a number.");
};
// end function to Get Subtitle Description

// function to Get Subtitle Count
wjs.prototype.subCount = function() {
	wjs_keepIndex = this.vlc.subtitles.count;
	var getSettings = {};
	getSettings = JSON.parse(this.vlc.playlist.items[this.vlc.playlist.currentItem].setting);
	if (getSettings.subtitles) {
		wjs_target = getSettings.subtitles;
		if (wjs_keepIndex == 0) wjs_keepIndex = 1;
		for (var newDesc in wjs_target) if (wjs_target.hasOwnProperty(newDesc)) wjs_keepIndex++;
		return wjs_keepIndex;
	}
	return wjs_keepIndex;
};
// end function to Get Subtitle Count

// function to Get/Set Subtitle Track
wjs.prototype.subTrack = function(newTrack) {
	if (typeof newTrack === 'number') {
		if (newTrack == 0) {
			this.vlc.subtitles.track = 0;
			clearSubtitles(this);
		} else {
			if (newTrack < this.vlc.subtitles.count) {
				$(this.allElements[0]).find(".wcp-subtitle-text").html("");
				opts[this.context].subtitles = [];
				this.vlc.subtitles.track = newTrack;
			} else {
				$(this.allElements[0]).find(".wcp-subtitle-text").html("");
				opts[this.context].subtitles = [];
				if (this.vlc.subtitles.track > 0) this.vlc.subtitles.track = 0;
				newSub = newTrack - this.vlc.subtitles.count +1;
				itemSetting = JSON.parse(this.vlc.playlist.items[this.vlc.playlist.currentItem].setting);
				target = itemSetting.subtitles;
				for (var k in target) if (target.hasOwnProperty(k)) {
					newSub--;
					if (newSub == 0) {
						loadSubtitle(this,target[k]);
						break;
					}
				}
			}
			this.opts.currentSub = newTrack;
			printSubtitles(this);
		}
	} else {
		return this.opts.currentSub;
	}
	return this;
};
// end function to Get/Set Subtitle Track

wjs.prototype.mute = function(newMute) {
	if (typeof newMute === "boolean") {
		if (this.vlc.mute !== newMute) {
			if (!this.vlc.mute) $(this.canvas).parents(".wcp-wrapper").find(".wcp-vol-button").removeClass("wcp-volume-medium").addClass("wcp-mute");
			else $(this.canvas).parents(".wcp-wrapper").find(".wcp-vol-button").removeClass("wcp-mute").addClass("wcp-volume-medium");
			this.vlc.mute = newMute;
		} else return false;
	} else return this.vlc.mute;
};

wjs.prototype.volume = function(newVolume) {
	if (newVolume && !isNaN(newVolume) && newVolume >= 0 && newVolume <= 200) {
		$(this.canvas).parent().find(".wcp-vol-bar-full").css("width", (((newVolume/200)*parseInt($(this.canvas).parent().find(".wcp-vol-bar").css("width")))-parseInt($(this.canvas).parent().find(".wcp-vol-bar-pointer").css("width")))+"px");
		this.vlc.volume = newVolume;
	} else return parseInt(this.vlc.volume);
	return this;
};

wjs.prototype.time = function(newTime) {
	if (typeof newTime === 'number') {
		this.vlc.time = newTime;
		$(this.canvas).parent().find(".wcp-time-current").text(parseTime(newTime,this.vlc.length));
		$(this.canvas).parent().find(".wcp-progress-seen")[0].style.width = (newTime/(this.vlc.length)*100)+"%";
	} else return parseInt(this.vlc.time);
	return this;
}

wjs.prototype.position = function(newPosition) {
	if (typeof newPosition === 'number') {
		this.vlc.position = newPosition;
		$(this.canvas).parent().find(".wcp-time-current").text(parseTime(this.vlc.length*newPosition,this.vlc.length));
		$(this.canvas).parent().find(".wcp-progress-seen")[0].style.width = (newPosition*100)+"%";
	} else return this.vlc.position;
	return this;
}

wjs.prototype.currentItem = function(newItem) {
	if (typeof newItem === 'number') {
		if (this.vlc.playlist.currentItem == newItem)
		this.vlc.playlist.currentItem = newItem;
	} else return false;
	return this;
}

wjs.prototype.itemCount = function() {
	return parseInt(this.vlc.playlist.itemCount);
}

wjs.prototype.playing = function() {
	return this.vlc.playing;
}

wjs.prototype.length = function() {
	return this.vlc.length;
}

wjs.prototype.state = function() {
	reqState = this.vlc.state;
	if (reqState == 0) return "idle";
	else if (reqState == 1) return "opening";
	else if (reqState == 2) return "buffering";
	else if (reqState == 3) return "playing";
	else if (reqState == 4) return "paused";
	else if (reqState == 5) return "stopping";
	else if (reqState == 6) return "ended";
	else if (reqState == 7) return "error";
	return false;
}

wjs.prototype.stateInt = function() {
	return this.vlc.state;
}

wjs.prototype.width = function() {
	return this.canvas.width;
}

wjs.prototype.height = function() {
	return this.canvas.height;
}

wjs.prototype.advanceItem = function(newX,newY) {
	if (typeof newX === 'number' && typeof newY === 'number') {
		this.vlc.playlist.advanceItem(newX,newY);
		// needs to refresh Playlist Menu items in the future
		if ($(this.canvas).parents(".wcp-wrapper").find(".wcp-playlist").is(":visible")) printPlaylist(this);
	} else return false;
	return this;
}

wjs.prototype.removeItem = function(remItem) {
	if (typeof remItem === 'number') {
		 if (this.itemCount() <= 2) {
			 if (this.vlc.playlist.removeItem(remItem)) {
				 $(this.canvas).parent().find(".wcp-prev").hide(0);
				 $(this.canvas).parent().find(".wcp-next").hide(0);
			 }
		 } else this.vlc.playlist.removeItem(remItem);
		// needs to refresh Playlist Menu items in the future
		if ($(this.canvas).parents(".wcp-wrapper").find(".wcp-playlist").is(":visible")) printPlaylist(this);
		// hide playlist button if less then 2 playlist items
		if (this.vlc.playlist.itemCount < 2) {
			$(this.canvas).parents(".wcp-wrapper").find(".wcp-playlist-but").css({ display: "none" });
		}
	} else return false;
	return this;
}

wjs.prototype.clearPlaylist = function() {
	this.stop();
	this.vlc.playlist.clear();
	$(this.canvas).parent().find(".wcp-time-total").text("00:00");
	// needs to refresh Playlist Menu items in the future
	if ($(this.canvas).parents(".wcp-wrapper").find(".wcp-playlist").is(":visible")) printPlaylist(this);
	if ($(this.canvas).parents(".wcp-wrapper").find(".wcp-playlist-but").is(":visible")) {
		$(this.canvas).parents(".wcp-wrapper").find(".wcp-playlist-but").hide(0);
	}
	return this;
}

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
			if ($(".webchimeras").length == 1) {
				$(".wcp-tooltip").fadeOut();
				var rect = $(".wcp-wrapper")[0].getBoundingClientRect();
				if (e.pageX >= rect.left && e.pageX <= rect.right) {
					vlc = wjs("#"+$(".wcp-wrapper")[0].id).vlc;
					p = (e.pageX - rect.left) / (rect.right - rect.left);
					$(".wcp-progress-seen").css("width", (p*100)+"%");
					vlc.position = p;
					$(wjs("#"+$(".wcp-wrapper")[0].id).canvas).parent().find(".wcp-time-current").text($(wjs("#"+$(".wcp-wrapper")[0].id).canvas).parent().find(".wcp-tooltip-inner").text());
				}
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
			if ($(".webchimeras").length == 1) {
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
}

function mouseMoved(wjsPlayer,e) {
	if (seekDrag) {
		if (window.document.webkitFullscreenElement != null) {
			p = e.pageX / window.document.webkitFullscreenElement.offsetWidth;
			wjsPlayer = wjs("#"+window.document.webkitFullscreenElement.id);
			$(wjsPlayer.canvas).parent().find(".wcp-progress-seen").css("width", (p*100)+"%");
			vlc = wjsPlayer.vlc;
			var newtime = Math.floor(vlc.length * (e.pageX / window.document.webkitFullscreenElement.offsetWidth));
			if (newtime > 0) {
				$(wjsPlayer.canvas).parent().find(".wcp-tooltip-inner").text(parseTime(newtime));
				var offset = Math.floor($(wjsPlayer.canvas).parent().find(".wcp-tooltip").width() / 2);
				if (e.pageX >= (offset + 0) && e.pageX <= (window.document.webkitFullscreenElement.offsetWidth - offset)) {
					$(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",(e.pageX - offset)+"px");
				} else if (e.pageX < (window.document.webkitFullscreenElement.offsetWidth + offset)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left","0px");
				else if (e.pageX > offset*(-1)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",(0 - $(wjsPlayer.canvas).parent().find(".wcp-tooltip").width())+"px");
				$(wjsPlayer.canvas).parent().find(".wcp-tooltip").show(0);
			}
			
		} else {
			if ($(".webchimeras").length == 1) {
				var rect = $(".wcp-wrapper")[0].getBoundingClientRect();
				if (e.pageX >= rect.left && e.pageX <= rect.right) {
					p = (e.pageX - rect.left) / (rect.right - rect.left);
					$(".wcp-progress-seen").css("width", (p*100)+"%");
				}
				vlc = wjsPlayer.vlc;
				var newtime = Math.floor(vlc.length * ((e.pageX - rect.left) / $(wjsPlayer.canvas).parent().parent().width()));
				if (newtime > 0) {
					$(wjsPlayer.canvas).parent().find(".wcp-tooltip-inner").text(parseTime(newtime));
					var offset = Math.floor($(wjsPlayer.canvas).parent().find(".wcp-tooltip").width() / 2);
					if (e.pageX >= (offset + rect.left) && e.pageX <= (rect.right - offset)) {
						$(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",((e.pageX - rect.left) - offset)+"px");
					} else if (e.pageX < (rect.left + offset)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",rect.left+"px");
					else if (e.pageX > (rect.right - offset)) $(wjsPlayer.canvas).parent().find(".wcp-tooltip").css("left",(rect.right - $(wjsPlayer.canvas).parent().find(".wcp-tooltip").width())+"px");
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
						vlc = wjsPlayer.vlc;
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
					}
				});
			}
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
			if ($(".webchimeras").length == 1) {
				var rect = $(".wcp-vol-bar")[0].getBoundingClientRect();
				if (e.pageX >= rect.left && e.pageX <= rect.right) {
					p = (e.pageX - rect.left) / (rect.right - rect.left);
					$(".wcp-vol-bar-full").css("width", Math.floor(p*116)+"px");
					vlc = wjs("#"+$(".wcp-wrapper")[0].id).vlc;
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
}

// event proxies
wjs.prototype.onMediaChanged = function(wjs_function) { this.catchEvent("MediaChanged",wjs_function); return this; }
wjs.prototype.onIdle = function(wjs_function) { this.catchEvent("NothingSpecial",wjs_function); return this; }
wjs.prototype.onOpening = function(wjs_function) { this.catchEvent("Opening",wjs_function); return this; }
wjs.prototype.onBuffering = function(wjs_function) { this.catchEvent("Buffering",wjs_function); return this; }
wjs.prototype.onPlaying = function(wjs_function) { this.catchEvent("Playing",wjs_function); return this; }
wjs.prototype.onPaused = function(wjs_function) { this.catchEvent("Paused",wjs_function); return this; }
wjs.prototype.onForward = function(wjs_function) { this.catchEvent("Forward",wjs_function); return this; }
wjs.prototype.onBackward = function(wjs_function) { this.catchEvent("Backward",wjs_function); return this; }
wjs.prototype.onError = function(wjs_function) { this.catchEvent("EncounteredError",wjs_function); return this; }
wjs.prototype.onEnded = function(wjs_function) { this.catchEvent("EndReached",wjs_function); return this; }
wjs.prototype.onStopped = function(wjs_function) { this.catchEvent("Stopped",wjs_function); return this; }
wjs.prototype.onTime = function(wjs_function) { this.catchEvent("TimeChanged",wjs_function); return this; }
wjs.prototype.onPosition = function(wjs_function) { this.catchEvent("PositionChanged",wjs_function); return this; }
// end event proxies

// catch event function
wjs.prototype.catchEvent = function(wjs_event,wjs_function) {
	var saveContext = wjs(this.context);
	this.vlc.events.on(wjs_event, function(event) { return wjs_function.call(saveContext,event); } );
	return this;
};
// end catch event function

// html element selector
function sel(context) {
	return $($(this).parents(".wcp-wrapper")[0]).find(context);
}


// player event handlers
function timePassed(wjsPlayer,t) {
	$(wjsPlayer.canvas).parent().find(".wcp-time-current").text(parseTime(t,wjsPlayer.vlc.length));
	
	if (typeof wjsPlayer.opts.subtitles === 'undefined') { opts[wjsPlayer.context].subtitles = []; wjsPlayer.opts.subtitles = []; }
	
	if (wjsPlayer.opts.subtitles.length > 0) {
		// End show subtitle text (external subtitles)
		var nowSecond = (t - wjsPlayer.opts.subDelay) /1000;
		if (wjsPlayer.opts.trackSub > -2) {
			var subtitle = -1;
			
			var os = 0;
			for (os in wjsPlayer.opts.subtitles) {
				if (os > nowSecond) break;
				subtitle = os;
			}
			
			if (subtitle > 0) {
				if(subtitle != wjsPlayer.opts.trackSub) {
					if ((wjsPlayer.opts.subtitles[subtitle].t.match(new RegExp("<", "g")) || []).length == 2) {
						if (wjsPlayer.opts.subtitles[subtitle].t.substr(0,1) == "<" && wjsPlayer.opts.subtitles[subtitle].t.slice(-1) == ">") {
						} else {
							wjsPlayer.opts.subtitles[subtitle].t = wjsPlayer.opts.subtitles[subtitle].t.replace(/<\/?[^>]+(>|$)/g, "");
						}
					} else if ((wjsPlayer.opts.subtitles[subtitle].t.match(new RegExp("<", "g")) || []).length > 2) {
						wjsPlayer.opts.subtitles[subtitle].t = wjsPlayer.opts.subtitles[subtitle].t.replace(/<\/?[^>]+(>|$)/g, "");
					}
					$(wjsPlayer.allElements[0]).find(".wcp-subtitle-text").html(nl2br(wjsPlayer.opts.subtitles[subtitle].t));
					wjsPlayer.opts.trackSub = subtitle;
				} else if (wjsPlayer.opts.subtitles[subtitle].o < nowSecond) {
					$(wjsPlayer.allElements[0]).find(".wcp-subtitle-text").html("");
				}
			}
		}
		// End show subtitle text (external subtitles)
	}

}
function positionChanged(wjsPlayer,position) {
	this.opts.lastPos = position;
	if (!seekDrag) $(wjsPlayer.canvas).parent().find(".wcp-progress-seen")[0].style.width = (position*100)+"%";
};

function isOpening(wjsPlayer) {
	if (wjsPlayer.vlc.playlist.currentItem != wjsPlayer.opts.lastItem) {
		opts[wjsPlayer.context].lastItem = wjsPlayer.vlc.playlist.currentItem;
		wjsPlayer.opts.lastItem = wjsPlayer.vlc.playlist.currentItem;
		if ($(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-playlist").is(":visible")) {
			printPlaylist(wjsPlayer);
		}
	}
	var style = window.getComputedStyle($(wjsPlayer.allElements[0]).find(".wcp-status")[0]);
	if (style.display === 'none') $(wjsPlayer.allElements[0]).find(".wcp-status").show();
	$(wjsPlayer.allElements[0]).find(".wcp-status").text("Opening");
};

function isMediaChanged(wjsPlayer) {

	$(wjsPlayer.allElements[0]).find(".wcp-subtitle-text").html("");
	opts[wjsPlayer.context].currentSub = 0;
	opts[wjsPlayer.context].subtitles = [];
	if ($(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-subtitles").is(":visible")) {
		$(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-subtitles").hide(0);
	}
	$(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-subtitle-but").hide(0);
	
	wjsPlayer.opts.firstTime = true;
}

function isBuffering(wjsPlayer,percent) {
	var style = window.getComputedStyle($(wjsPlayer.allElements[0]).find(".wcp-status")[0]);
	if (style.display === 'none') $(wjsPlayer.allElements[0]).find(".wcp-status").show(0);
	$(wjsPlayer.allElements[0]).find(".wcp-status").text("Buffering "+percent+"%");
	if (percent == 100) $(wjsPlayer.allElements[0]).find(".wcp-status").fadeOut(1200);
};

function isPlaying(wjsPlayer) {
	if (wjsPlayer.opts.firstTime) {
		wjsPlayer.opts.firstTime = false;
		if (wjsPlayer.vlc.subtitles.track > 0) wjsPlayer.vlc.subtitles.track = 0;
		wjsPlayer.opts.currentSub = 0;
		wjsPlayer.opts.trackSub = -1;
		totalSubs = wjsPlayer.vlc.subtitles.count;
		itemSetting = JSON.parse(wjsPlayer.vlc.playlist.items[wjsPlayer.vlc.playlist.currentItem].setting);
		
		if (itemSetting.subtitles) totalSubs += Object.keys(itemSetting.subtitles).length;
		
		if (totalSubs > 0) $(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-subtitle-but").show(0);
		
	}
	var style = window.getComputedStyle($(wjsPlayer.allElements[0]).find(".wcp-status")[0]);
	if (style.display !== 'none') $(wjsPlayer.allElements[0]).find(".wcp-status").fadeOut(1200);
	$(wjsPlayer.allElements[0]).find(".wcp-time-total").text(parseTime(this.vlc.length));
};

function hasEnded(wjsPlayer) {
	switchClass($(wjsPlayer.allElements[0]).find(".wcp-pause")[0],"wcp-pause","wcp-replay");
	if (wjsPlayer.vlc.time > 0) {
		if (wjsPlayer.opts.lastPos < 0.95) {
			// Reconnect if connection to server lost
			wjsPlayer.vlc.playlist.currentItem = wjsPlayer.opts.lastItem;
			wjsPlayer.vlc.playlist.play();
			wjsPlayer.vlc.position = wjsPlayer.opts.lastPos;

			wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-play");
			if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
			
			wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-replay");
			if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-pause");

			positionChanged(wjsPlayer,0);
			$(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-time-current").text("00:00");
			// End Reconnect if connection to server lost
		} else {
			if (wjsPlayer.opts.loop && wjsPlayer.vlc.playlist.currentItem +1 == wjsPlayer.vlc.playlist.itemCount) {
				wjsPlayer.vlc.playlist.playItem(0);
				
				wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-play");
				if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
				
				wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-replay");
				if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-pause");
				
				positionChanged(wjsPlayer,0);
				$(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-time-current").text("00:00");

			} else if (wjsPlayer.vlc.playlist.currentItem +1 < wjsPlayer.vlc.playlist.itemCount) {
				wjsPlayer.vlc.playlist.next();

				wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-play");
				if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
				
				wjs_button = $(this.canvas).parents(".wcp-wrapper").find(".wcp-replay");
				if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-pause");
				
				positionChanged(wjsPlayer,0);
				$(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-time-current").text("00:00");
			}
		}
	}
};
// end player event handlers

function singleResize(wjsPlayer,width,height) {

	wjsPlayer.canvas.width = width;
	wjsPlayer.canvas.height = height;

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

function autoResize() {
	$('.webchimeras').each(function(i, obj) {
		if ($(obj).find(".wcp-wrapper")[0]) {
			var wjsPlayer = wjs("#"+$(obj).find(".wcp-wrapper")[0].id);
			// resize status font size
			var fontSize = (parseInt($(wjsPlayer.allElements[0]).height())/15);
			if (fontSize < 20) fontSize = 20;
			var fontSize = (parseInt($(wjsPlayer.allElements[0]).height())/15);
			if (fontSize < 16) fontSize = 16;
			if (fontSize > 31) fontSize = 31;
			$(wjsPlayer.allElements[0]).find(".wcp-status").css('fontSize', fontSize);
			$(wjsPlayer.allElements[0]).find(".wcp-subtitle-text").css('fontSize', fontSize);
			
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
		if (seekDrag || volDrag || ($(wjsWrapper.find(".wcp-toolbar").selector + ":hover").length > 0 && vlcs["#"+wjsWrapper.find(".wcp-wrapper")[0].id].timestampUI + 20 > Math.floor(Date.now() / 1000))) {
			vlcs["#"+wjsWrapper.find(".wcp-wrapper")[0].id].hideUI = setTimeout(function(i) { return function() { wcp_hideUI(i); } }(wjsWrapper),3000);
			return;
		}
		wjsWrapper.find(".wcp-toolbar").stop().fadeOut();
		wjsWrapper.find(".wcp-tooltip").stop().fadeOut();
		wjsWrapper.css({cursor: 'none'});
	}
}

function printPlaylist(wjsPlayer) {
	playlistItems = $(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-playlist-items");
	vlc = vlcs["#"+$(wjsPlayer.canvas).parents(".wcp-wrapper")[0].id].vlc;
	oi = 0;
	if (vlc.playlist.itemCount > 0) {
		generatePlaylist = "";
		for (oi = 0; oi < vlc.playlist.itemCount; oi++) {
			if (vlc.playlist.items[oi].title.indexOf("[custom]") != 0) {
				var plstring = vlc.playlist.items[oi].title;
				if (plstring.indexOf("http://") == 0) {
					// extract filename from url
					var tempPlstring = plstring.substring(plstring.lastIndexOf('/')+1);
					if (tempPlstring.length > 3) plstring = tempPlstring;
					delete tempPlstring;
				}
				if (plstring.indexOf(".") > -1) {
					// remove extension
					var tempPlstring = plstring.replace("."+plstring.split('.').pop(),"");
					if (tempPlstring.length > 3) plstring = tempPlstring;
					delete tempPlstring;
				}
				plstring = unescape(plstring);
				plstring = plstring.split('_').join(' ');
				plstring = plstring.split('.').join(' ');
				plstring = plstring.split('  ').join(' ');
				plstring = plstring.split('  ').join(' ');
				plstring = plstring.split('  ').join(' ');
				
				// capitalize first letter
				plstring = plstring.charAt(0).toUpperCase() + plstring.slice(1);
	
				if (plstring != vlc.playlist.items[oi].title) vlc.playlist.items[oi].title = "[custom]"+plstring;
			}
			generatePlaylist += '<div class="wcp-menu-item wcp-playlist-item';
			if (oi == vlc.playlist.currentItem) generatePlaylist += ' wcp-menu-selected';
			generatePlaylist += '" data-item="'+oi+'">'+vlc.playlist.items[oi].title.replace("[custom]","")+'</div>';
		}
		playlistItems.css('overflowY', 'scroll');
		playlistItems.html("");
		playlistItems.html(generatePlaylist);
		if (playlistItems.outerHeight() <= (oi* parseInt(playlistItems.find(".wcp-playlist-item").css("height")))) {
			playlistItems.css("cursor","pointer");
		} else playlistItems.css("cursor","default");
		$(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-playlist-item").click(function() {
			wjs_button = $(wjs("#"+$(this).parents(".wcp-wrapper")[0].id).canvas).parents(".wcp-wrapper").find(".wcp-play");
			if (wjs_button.length != 0) wjs_button.removeClass("wcp-play").addClass("wcp-pause");
			
			wjs_button = $(wjs("#"+$(this).parents(".wcp-wrapper")[0].id).canvas).parents(".wcp-wrapper").find(".wcp-replay");
			if (wjs_button.length != 0) wjs_button.removeClass("wcp-replay").addClass("wcp-pause");
			
			positionChanged(wjs("#"+$(this).parents(".wcp-wrapper")[0].id),0);
			$(wjs("#"+$(this).parents(".wcp-wrapper")[0].id).canvas).parents(".wcp-wrapper").find(".wcp-time-current").text("00:00");
			
			vlcs["#"+$(this).parents(".wcp-wrapper")[0].id].vlc.playlist.playItem(parseInt(this.getAttribute('data-item')));
			printPlaylist(wjs("#"+$(this).parents(".wcp-wrapper")[0].id));
		});
		
	} else playlistItems.html("");
}

function printSubtitles(wjsPlayer) {
	playlistItems = $(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-subtitles-items");

	generatePlaylist = "";
	generatePlaylist += '<div class="wcp-menu-item wcp-subtitles-item';
	if (wjsPlayer.opts.currentSub == 0) generatePlaylist += ' wcp-menu-selected';
	generatePlaylist += '" data-item="0">None</div>';
	if (wjsPlayer.vlc.subtitles.count > 0) {
		for (oi = 1; oi < wjsPlayer.vlc.subtitles.count; oi++) {
			generatePlaylist += '<div class="wcp-menu-item wcp-subtitles-item';
			if (oi == wjsPlayer.opts.currentSub) generatePlaylist += ' wcp-menu-selected';
			generatePlaylist += '" data-item="'+oi+'">'+wjsPlayer.vlc.subtitles[oi]+'</div>';
		}
	} else oi = 1;

	itemSetting = JSON.parse(wjsPlayer.vlc.playlist.items[wjsPlayer.vlc.playlist.currentItem].setting);
	
	if (itemSetting.subtitles) {
		target = itemSetting.subtitles;
		for (var k in target) if (target.hasOwnProperty(k)) {
			generatePlaylist += '<div class="wcp-menu-item wcp-subtitles-item';
			if (oi == wjsPlayer.opts.currentSub) generatePlaylist += ' wcp-menu-selected';
			generatePlaylist += '" data-item="'+oi+'">'+k+'</div>';
			oi++;
		}
	}

	playlistItems.html("");
	playlistItems.html(generatePlaylist);
	
	if (playlistItems.outerHeight() <= (oi* parseInt(playlistItems.find(".wcp-subtitles-item").css("height")))) {
		playlistItems.css("cursor","pointer");
	} else playlistItems.css("cursor","default");
	
	$(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-subtitles-item").click(function() {
		wrapperId = $(this).parents(".wcp-wrapper")[0].id;
		if (parseInt(this.getAttribute('data-item')) == 0) {
			vlcs["#"+wrapperId].vlc.subtitles.track = 0;
			clearSubtitles(wjs("#"+wrapperId));
		} else if (parseInt(this.getAttribute('data-item')) < vlcs["#"+wrapperId].vlc.subtitles.count) {
			$(wjsPlayer.allElements[0]).find(".wcp-subtitle-text").html("");
			opts[wjsPlayer.context].subtitles = [];
			vlcs["#"+wrapperId].vlc.subtitles.track = parseInt(this.getAttribute('data-item'));
		} else {
			$(wjsPlayer.allElements[0]).find(".wcp-subtitle-text").html("");
			opts[wjsPlayer.context].subtitles = [];
			if (wjsPlayer.vlc.subtitles.track > 0) wjsPlayer.vlc.subtitles.track = 0;
			newSub = parseInt(this.getAttribute('data-item')) - vlcs["#"+wrapperId].vlc.subtitles.count +1;
			target = itemSetting.subtitles;
			for (var k in target) if (target.hasOwnProperty(k)) {
				newSub--;
				if (newSub == 0) {
					loadSubtitle(wjs("#"+wrapperId),target[k]);
					break;
				}
			}
		}
		opts["#"+wrapperId].currentSub = parseInt(this.getAttribute('data-item'));
		printSubtitles(wjs("#"+wrapperId));
	});
	
}

function clearSubtitles(wjsPlayer) {
	$(wjsPlayer.allElements[0]).find(".wcp-subtitle-text").html("");
	opts[wjsPlayer.context].currentSub = 0;
	opts[wjsPlayer.context].subtitles = [];
	if (wjsPlayer.vlc.subtitles.track > 0) wjsPlayer.vlc.subtitles.track = 0;
	if ($(wjsPlayer.canvas).parents(".wcp-wrapper").find(".wcp-subtitles").is(":visible")) printSubtitles(wjsPlayer);
}

function loadSubtitle(wjsPlayer,subtitleElement) {
	if (typeof wjsPlayer.opts.subtitles === "undefined") { opts["#"+wrapperId].subtitles = []; wjsPlayer.opts.subtitles = []; }
	else if (wjsPlayer.opts.subtitles.length) { opts["#"+wrapperId].subtitles = []; wjsPlayer.opts.subtitles = []; }

	if (subtitleElement.indexOf("http://dl.opensubtitles.org/") == 0) subtitleElement = "http://dl.opensubtitles.org/en/download/subencoding-utf8/file/"+subtitleElement.split('/').pop();

	resData = "";
	var req = http.get(subtitleElement , function(res) {
			res.on('data', function (data) {
			   resData += data;
			});

			res.on('end', function() {
				var srt = resData;
				wjsPlayer.opts.subtitles = [];
				
				var extension = subtitleElement.split('.').pop();
				if (extension.toLowerCase() == "srt" || extension.toLowerCase() == "vtt") {
										
					srt = srt.replace(/\r\n|\r|\n/g, '\n');
					
					srt = strip(srt);
					var srty = srt.split('\n\n');
					
					var s = 0;
					
					if (srty[0].substr(0,6).toLowerCase() == "webvtt") {
						for (s = 0; s < srty.length; s++) {
							var st = srty[s].split('\n');
							if (st.length >=2) {
								var n = st[0];
								if (st[1].indexOf(' --> ') > -1) var stOrigin = st[1];
								else if (st[2].indexOf(' --> ') > -1) var stOrigin = st[2];
								else if (st[3].indexOf(' --> ') > -1) var stOrigin = st[3];
								if (typeof stOrigin !== 'undefined') {
									if (typeof stOrigin.split(' --> ')[0] === 'undefined') {
										// print error
										return;
									}
									if (typeof stOrigin.split(' --> ')[1] === 'undefined') {
										//print error
										return;
									}
									var is = Math.round(toSeconds(strip(stOrigin.split(' --> ')[0])));
									var os = Math.round(toSeconds(strip(stOrigin.split(' --> ')[1])));
									var t = st[2];
									if( st.length > 2) {
										var j = 3;
										for (j=3; j<st.length; j++) t = t + '\n'+st[j];
									}
									wjsPlayer.opts.subtitles[is] = {i:is, o: os, t: t};
								}
							}
						}
					} else {
						for (s = 0; s < srty.length; s++) {
							var st = srty[s].split('\n');
							if (st.length >=2) {
								var n = st[0];
								if (st[1].indexOf(' --> ') > -1) var stOrigin = st[1];
								else if (st[2].indexOf(' --> ') > -1) var stOrigin = st[2];
								else if (st[3].indexOf(' --> ') > -1) var stOrigin = st[3];
								if (typeof stOrigin !== 'undefined') {
									if (typeof stOrigin.split(' --> ')[0] === 'undefined') {
										// print error
										return;
									}
									if (typeof stOrigin.split(' --> ')[1] === 'undefined') {
										//print error
										return;
									}
									var is = Math.round(toSeconds(strip(stOrigin.split(' --> ')[0])));
									var os = Math.round(toSeconds(strip(stOrigin.split(' --> ')[1])));
									var t = st[2];
									if( st.length > 2) {
										var j = 3;
										for (j=3; j<st.length; j++) t = t + '\n'+st[j];
									}
									wjsPlayer.opts.subtitles[is] = {i:is, o: os, t: t};
								}
							}
						}
					}
				} else if (extension.toLowerCase() == "sub") {
					srt = srt.replace(/\r\n|\r|\n/g, '\n');
					
					srt = strip(srt);
					var srty = srt.split('\n');
	
					var s = 0;
					for (s = 0; s < srty.length; s++) {
						var st = srty[s].split('}{');
						if (st.length >=2) {
						  var is = Math.round(st[0].substr(1) /10);
						  var os = Math.round(st[1].split('}')[0] /10);
						  var t = st[1].split('}')[1].replace('|', '\n');
						  if (is != 1 && os != 1) wjsPlayer.opts.subtitles[is] = {i:is, o: os, t: t};
						}
					}
				}
				wjsPlayer.opts.trackSub = -1;
			});
	});
}

function toSeconds(t) {
	var s = 0.0
	if (t) {
		var p = t.split(':');
		var i = 0;
		for (i=0;i<p.length;i++) s = s * 60 + parseFloat(p[i].replace(',', '.'))
	}
	return s;
}

function strip(s) {
	return s.replace(/^\s+|\s+$/g,"");
}

function nl2br(str,is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

module.exports = wjs;