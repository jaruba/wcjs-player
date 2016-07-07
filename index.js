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

// WebChimera.js Player v6.0.1

var vlcs = {},
    opts = {},
    players = {},
    $ = require('jquery'),
    seekDrag = false,
    volDrag = false,
    firstTime = true,
    fs = require('fs'),
    request = require('request'),
    events = require('events'),
    path = require('path'),
    relbase = "./"+path.relative(path.dirname(require.main.filename), __dirname),
    sleepId = 0;

require('jquery-ui/sortable');
try{var powerSaveBlocker=require('remote').require('power-save-blocker')}catch(ex){var sleep=require('computer-sleep/sleep')}

// inject css
if (!$("link[href='"+relbase+"/css/general.css']").length) {
    $('<link href="'+relbase+'/css/general.css" rel="stylesheet">').appendTo("head");
    window.document.styleSheets[0].addRule('.wcp-menu-items::-webkit-scrollbar','width: 44px !important;');
    window.document.styleSheets[0].addRule('.wcp-menu-items::-webkit-scrollbar-track','background-color: #696969 !important; border-right: 13px solid rgba(0, 0, 0, 0); border-left: 21px solid rgba(0, 0, 0, 0); background-clip: padding-box; -webkit-box-shadow: none !important;');
    window.document.styleSheets[0].addRule('.wcp-menu-items::-webkit-scrollbar-thumb','background-color: #e5e5e5; border-right: 13px solid rgba(0, 0, 0, 0); border-left: 21px solid rgba(0, 0, 0, 0); background-clip: padding-box; -webkit-box-shadow: none !important;');
    window.document.styleSheets[0].addRule('.wcp-menu-items::-webkit-scrollbar-thumb:hover','background-color: #e5e5e5 !important; border-right: 13px solid rgba(0, 0, 0, 0); border-left: 21px solid rgba(0, 0, 0, 0); background-clip: padding-box; -webkit-box-shadow: none !important;');
    window.document.styleSheets[0].addRule('.wcp-menu-items::-webkit-scrollbar-thumb:active','background-color: #e5e5e5 !important; border-right: 13px solid rgba(0, 0, 0, 0); border-left: 21px solid rgba(0, 0, 0, 0); background-clip: padding-box; -webkit-box-shadow: none !important;');
}

// deinitializate when page changed
window.addEventListener('beforeunload', function(e) {
    // stop all players
    for (var wjsIndex in players) if (players.hasOwnProperty(wjsIndex) && players[wjsIndex].vlc) players[wjsIndex].vlc.stop();

    // clear wcjs-player from require cache when page changes
    var clearModules = [
        "wcjs-player",
        "jquery" // https://github.com/jaruba/wcjs-player/issues/38
    ];
    for (var i in clearModules) {
        if (global.require.cache) {
            for (module in global.require.cache) {
                if (global.require.cache.hasOwnProperty(module) && module.indexOf(clearModules[i]) > -1) delete global.require.cache[module];
            }
        } else if (require.cache) {
            for (module in require.cache) {
                if (require.cache.hasOwnProperty(module) && module.indexOf(clearModules[i]) > -1) delete require.cache[module];
            }
        }
    }
});

function wjs(context) {

    this.version = "v6.0.1";

    // Save the context
    this.context = (typeof context === "undefined") ? "#webchimera" : context;  // if no playerid set, default to "webchimera"

    if ($(this.context).hasClass("webchimeras")) this.context = "#"+$(this.context).find(".wcp-wrapper")[0].id;

    if (this.context.substring(0,1) == "#") {
        if (window.document.getElementById(this.context.substring(1)).firstChild) {
            this.wrapper = window.document.getElementById(this.context.substring(1));
            this.canvas = this.wrapper.firstChild.firstChild;
            this.wrapper = $(this.wrapper);
        }
        this.allElements = [window.document.getElementById(this.context.substring(1))];
    } else {
        if (this.context.substring(0,1) == ".") this.allElements = window.document.getElementsByClassName(this.context.substring(1));
        else this.allElements = window.document.getElementsByTagName(this.context);
        this.wrapper = this.allElements[0];
        this.canvas = this.wrapper.firstChild.firstChild;
        this.wrapper = $(this.wrapper);
    }
    if (vlcs[this.context]) {
        this.vlc = vlcs[this.context].vlc;
        this.renderer = vlcs[this.context].renderer;
    }
    return this;
}

wjs.prototype.toggleMute = function() {
    if (!this.vlc.mute) this.mute(true);
    else this.mute(false);
    return this;
}

wjs.prototype.togglePause = function() {
    if (!this.playing()) {
        if (this.itemCount() > 0) this.play();
    } else this.pause();
    return this;
}

wjs.prototype.play = function(mrl) {
    if (!this.playing()) {
        switchClass(this.find(".wcp-anim-basic"),"wcp-anim-icon-pause","wcp-anim-icon-play");

        wjsButton = this.find(".wcp-play");
        if (wjsButton.length != 0) wjsButton.removeClass("wcp-play").addClass("wcp-pause");

        wjsButton = this.find(".wcp-replay");
        if (wjsButton.length != 0) wjsButton.removeClass("wcp-replay").addClass("wcp-pause");

        if (mrl) this.vlc.playlist.play(mrl);
        else if (this.itemCount() > 0) this.vlc.playlist.play();
    }
    return this;
}

wjs.prototype.pause = function() {
    if (this.playing()) {
        switchClass(this.find(".wcp-anim-basic"),"wcp-anim-icon-play","wcp-anim-icon-pause");
        this.find(".wcp-pause").removeClass("wcp-pause").addClass("wcp-play");
        this.vlc.playlist.pause();
    }
    return this;
}

wjs.prototype.playItem = function(i) {
    if (typeof i !== 'undefined') {
        if (i < this.itemCount() && i > -1) {
            if (this.itemDesc(i).disabled) {
                this.vlc.playlist.items[i].disabled = false;
                if (this.find(".wcp-playlist").is(":visible")) {
                    this.find(".wcp-playlist-items:eq("+i+")").removeClass("wcp-disabled");
                }
                this.find(".wcp-playlist").find(".wcp-menu-selected").removeClass("wcp-menu-selected");
                this.find(".wcp-playlist-items:eq("+i+")").addClass("wcp-menu-selected");
            }

            opts[this.context].keepHidden = true;
            this.zoom(0);

            wjsButton = this.find(".wcp-play");
            if (wjsButton.length != 0) wjsButton.removeClass("wcp-play").addClass("wcp-pause");

            wjsButton = this.find(".wcp-replay");
            if (wjsButton.length != 0) wjsButton.removeClass("wcp-replay").addClass("wcp-pause");

            this.vlc.playlist.playItem(i);

            positionChanged.call(this,0);
            this.find(".wcp-time-current").text("");
            this.find(".wcp-time-total").text("");
        }
    } else return false;
    return this;
}

wjs.prototype.stop = function() {
    wjsButton = this.find(".wcp-pause");
    if (wjsButton.length != 0) wjsButton.removeClass("wcp-pause").addClass("wcp-play");

    wjsButton = this.find(".wcp-replay");
    if (wjsButton.length != 0) wjsButton.removeClass("wcp-replay").addClass("wcp-play");

    this.vlc.playlist.stop();

    positionChanged.call(this,0);
    this.find(".wcp-time-current").text("");
    this.find(".wcp-time-total").text("");
    return this;
}

wjs.prototype.next = function() {
    if (this.currentItem() +1 < this.itemCount()) {

        var noDisabled = true;
        for (i = this.currentItem() +1; i < this.itemCount(); i++) {
            if (!this.itemDesc(i).disabled) {
                noDisabled = false;
                break;
            }
        }
        if (noDisabled) return false;

        this.playItem(i);

        return this;
    } else return false;
}

wjs.prototype.prev = function() {
    if (this.currentItem() > 0) {

        var noDisabled = true;
        for (i = this.currentItem() -1; i > -1; i--) {
            if (!this.itemDesc(i).disabled) {
                noDisabled = false;
                break;
            }
        }
        if (noDisabled) return false;

        this.playItem(i);

        return this;
    } else return false;
}

wjs.prototype.addPlayer = function(wcpSettings) {

    if (!wcpSettings["wcjs"]) console.error(new Error('Missing `wcjs` parameter in `.addPlayer()`'));

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
    vlcs[newid].events = new events.EventEmitter();

    if (wcpSettings) {
        opts[newid] = wcpSettings;
        vlcs[newid].multiscreen = (typeof wcpSettings["multiscreen"] === "undefined") ? false : wcpSettings["multiscreen"];
    } else {
        opts[newid] = {};
        vlcs[newid].multiscreen = false;
    }
    if (typeof opts[newid].titleBar === 'undefined') opts[newid].titleBar = "fullscreen";
    opts[newid].uiHidden = false;
    opts[newid].subDelay = 0;
    opts[newid].lastItem = -1;
    opts[newid].aspectRatio = "Default";
    opts[newid].crop = "Default";
    opts[newid].zoom = 1;
    if (typeof opts[newid].allowFullscreen === 'undefined') opts[newid].allowFullscreen = true;

    playerbody = '<div' + targetid + ' style="height: 100%"><div class="wcp-center" style="overflow: hidden"><canvas class="wcp-canvas wcp-center"></canvas></div><div class="wcp-surface"></div><div class="wcp-menu wcp-playlist wcp-center"><div class="wcp-menu-close"></div><div class="wcp-menu-title">Playlist Menu</div><ul class="wcp-menu-items wcp-playlist-items"></ul></div><div class="wcp-menu wcp-subtitles wcp-center"><div class="wcp-menu-close"></div><div class="wcp-menu-title">Subtitle Menu</div><ul class="wcp-menu-items wcp-subtitles-items"></ul></div><div class="wcp-pause-anim wcp-center"><i class="wcp-anim-basic wcp-anim-icon-play"></i></div><div class="wcp-titlebar"><span class="wcp-title"></span></div><div class="wcp-toolbar"><div></div><div class="wcp-progress-bar"><div class="wcp-progress-seen"></div><div class="wcp-progress-pointer"></div></div><div class="wcp-button wcp-left wcp-prev" style="display: none"></div><div class="wcp-button wcp-left wcp-pause"></div><div class="wcp-button wcp-left wcp-next" style="display: none"></div><div class="wcp-button wcp-left wcp-vol-button wcp-volume-medium"></div><div class="wcp-vol-control"><div class="wcp-vol-bar"><div class="wcp-vol-bar-full"></div><div class="wcp-vol-bar-pointer"></div></div></div><div class="wcp-time"><span class="wcp-time-current"></span><span class="wcp-time-total"></span></div><div class="wcp-button wcp-right wcp-maximize"';
    if (!opts[newid].allowFullscreen) playerbody += ' style="cursor: not-allowed; color: rgba(123,123,123,0.6);"';
    playerbody += '></div><div class="wcp-button wcp-right wcp-playlist-but"></div><div class="wcp-button wcp-right wcp-subtitle-but"></div></div><div class="wcp-status"></div><div class="wcp-notif"></div><div class="wcp-subtitle-text"></div><div class="wcp-tooltip"><div class="wcp-tooltip-arrow"></div><div class="wcp-tooltip-inner">00:00</div></div></div>';

    opts[newid].currentSub = 0;
    opts[newid].trackSub = -1;

    $(this.context).each(function(ij,el) { if (!$(el).hasClass("webchimeras")) $(el).addClass("webchimeras"); el.innerHTML = playerbody; });

    if (vlcs[newid].multiscreen) {
        vlcs[newid].multiscreen = (typeof wcpSettings["multiscreen"] === "undefined") ? false : wcpSettings["multiscreen"];
        $(newid).find(".wcp-toolbar").hide(0);
        $(newid).find(".wcp-tooltip").hide(0);
        wjs(newid).wrapper.css({cursor: 'pointer'});
    }

    wjs(newid).canvas = $(newid)[0].firstChild.firstChild;

    // resize video when window is resized
    if (firstTime) {
        firstTime = false;
        window.onresize = function(i) { autoResize(); };
        $(window).bind("mouseup",function(i) {
            return function(event) {
                mouseClickEnd.call(players[i],event);
            }
        }(newid)).bind("mousemove",function(i) {
            return function(event) {
                mouseMoved.call(players[i],event);
            }
        }(newid));
    }

    wjs(newid).wrapper.find(".wcp-menu-close").click(function() {
        if ($(this).parents(".wcp-wrapper").find(".wcp-playlist").is(":visible")) {
            $(".wcp-playlist-items").sortable("destroy");
            $(this).parents(".wcp-wrapper").find(".wcp-playlist").hide(0);
        } else if ($(this).parents(".wcp-wrapper").find(".wcp-subtitles").is(":visible")) {
            $(this).parents(".wcp-wrapper").find(".wcp-subtitles").hide(0);
        }
    });

    // toolbar button actions
    wjs(newid).wrapper.find(".wcp-button").click(function() {
        wjsPlayer = getContext(this);
        vlc = wjsPlayer.vlc;
        buttonClass = this.className.replace("wcp-button","").replace("wcp-left","").replace("wcp-vol-button","").replace("wcp-right","").split(" ").join("");
        if (buttonClass == "wcp-playlist-but") {
            if ($(this).parents(".wcp-wrapper").find(".wcp-playlist").is(":visible")) hidePlaylist.call(wjsPlayer);
            else showPlaylist.call(wjsPlayer);
        }
        if (buttonClass == "wcp-subtitle-but") {
            if ($(this).parents(".wcp-wrapper").find(".wcp-subtitles").is(":visible")) hideSubtitles.call(wjsPlayer);
            else showSubtitles.call(wjsPlayer);
        }
        if (buttonClass == "wcp-prev") wjsPlayer.prev();
        else if (buttonClass == "wcp-next") wjsPlayer.next();
        if ([3,4,6].indexOf(vlc.state) > -1) {
            if (buttonClass == "wcp-play") wjsPlayer.play().animatePause();
            else if (buttonClass == "wcp-pause") wjsPlayer.pause().animatePause();
            else if (buttonClass == "wcp-replay") { vlc.stop(); wjsPlayer.play().animatePause(); }
            else if (["wcp-volume-low","wcp-volume-medium","wcp-volume-high","wcp-mute"].indexOf(buttonClass) > -1) wjsPlayer.toggleMute();
        }
        if ([5].indexOf(vlc.state) > -1 && buttonClass == "wcp-play") if (wjsPlayer.itemCount() > 0) wjsPlayer.play().animatePause();
        if (buttonClass == "wcp-minimize") fullscreenOff.call(wjsPlayer);
        else if (buttonClass == "wcp-maximize") fullscreenOn.call(wjsPlayer);
    });

    // surface click actions
    wjs(newid).wrapper.find(".wcp-surface").click(function() {
        wjsPlayer = getContext(this);
        if (wjsPlayer.stateInt() == 6) {
            wjsPlayer.find(".wcp-replay").trigger("click");
            return;
        }
        if ([3,4].indexOf(wjsPlayer.stateInt()) > -1) {
            if (vlcs[wjsPlayer.context].multiscreen && window.document.webkitFullscreenElement == null) {
                wjsPlayer.fullscreen(true);
                if (wjsPlayer.wrapper.css('cursor') == 'none') wjsPlayer.wrapper.css({cursor: 'default'});
                if (wjsPlayer.mute()) wjsPlayer.mute(false);
            } else wjsPlayer.togglePause().animatePause();
        }
        if ([5].indexOf(wjsPlayer.vlc.state) > -1 && !wjsPlayer.playing() && wjsPlayer.itemCount() > 0) wjsPlayer.play().animatePause();
    });

    wjs(newid).wrapper.find(".wcp-surface").dblclick(function() {
        wjsPlayer = getContext(this);
        if (opts[wjsPlayer.context].allowFullscreen) {
            wjsPlayer.find(".wcp-anim-basic").finish();
            wjsPlayer.find(".wcp-pause-anim").finish();
            wjsPlayer.toggleFullscreen();
        }
    });

    wjs(newid).wrapper.parent().bind("mousemove",function(e) {
        wjsPlayer = getContext(this);
        if (opts[wjsPlayer.context].uiHidden === false) {
            if (vlcs[wjsPlayer.context].multiscreen && window.document.webkitFullscreenElement == null) {
                wjsPlayer.wrapper.css({cursor: 'pointer'});
            } else {
                clearTimeout(vlcs[wjsPlayer.context].hideUI);
                wjsPlayer.wrapper.css({cursor: 'default'});

                if (window.document.webkitFullscreenElement == null) {
                    if (["both","minimized"].indexOf(opts[wjsPlayer.context].titleBar) > -1) {
                        wjsPlayer.find(".wcp-titlebar").stop().show(0);
                        if (wjsPlayer.find(".wcp-status").css("top") == "10px") wjsPlayer.find(".wcp-status").css("top", "35px");
                        if (wjsPlayer.find(".wcp-notif").css("top") == "10px") wjsPlayer.find(".wcp-notif").css("top", "35px");
                    }
                } else {
                    if (["both","fullscreen"].indexOf(opts[wjsPlayer.context].titleBar) > -1) {
                        wjsPlayer.find(".wcp-titlebar").stop().show(0);
                        if (wjsPlayer.find(".wcp-status").css("top") == "10px") wjsPlayer.find(".wcp-status").css("top", "35px");
                        if (wjsPlayer.find(".wcp-notif").css("top") == "10px") wjsPlayer.find(".wcp-notif").css("top", "35px");
                    }
                }

                wjsPlayer.find(".wcp-toolbar").stop().show(0);
                if (!volDrag && !seekDrag) {
                    if ($(wjsPlayer.find(".wcp-toolbar").selector + ":hover").length > 0) {
                        vlcs[wjsPlayer.context].hideUI = setTimeout(function(i) { return function() { hideUI.call(players[i]); } }(wjsPlayer.context),3000);
                        vlcs[wjsPlayer.context].timestampUI = Math.floor(Date.now() / 1000);
                    } else vlcs[wjsPlayer.context].hideUI = setTimeout(function(i) { return function() { hideUI.call(players[i]); } }(wjsPlayer.context),3000);
                }
            }
        } else wjsPlayer.wrapper.css({cursor: 'default'});
    });

    /* Progress and Volume Bars */
    wjs(newid).wrapper.find(".wcp-progress-bar").hover(function(arg1) {
        return progressHoverIn.call(getContext(this),arg1);
    }, function(e) {
        if (!seekDrag) sel.call(this,".wcp-tooltip").hide(0);
    });

    wjs(newid).wrapper.find(".wcp-progress-bar").bind("mousemove",function(arg1) {
        return progressMouseMoved.call(getContext(this),arg1);
    });

    wjs(newid).wrapper.find(".wcp-progress-bar").bind("mousedown", function(e) {
        seekDrag = true;
        var rect = $(this).parents(".wcp-wrapper")[0].getBoundingClientRect();
        p = (e.pageX - rect.left) / $(this).width();
        sel.call(this,".wcp-progress-seen").css("width", (p*100)+"%");
    });

    wjs(newid).wrapper.find(".wcp-vol-bar").bind("mousedown", function(e) {
        volDrag = true;
        var rect = sel.call(this,".wcp-vol-bar")[0].getBoundingClientRect();
        p = (e.pageX - rect.left) / $(this).width();
        getContext(this).volume(Math.floor(p*200)+5);
    });

    wjs(newid).wrapper.find(".wcp-vol-button").hover(function() {
        $(sel.call(this,".wcp-vol-control")).animate({ width: 133 },200);
    },function() {
        if (!$($(sel.call(this,".wcp-vol-control")).selector + ":hover").length > 0 && !volDrag) {
            $(sel.call(this,".wcp-vol-control")).animate({ width: 0 },200);
        }
    });

    wjs(newid).wrapper.find('.wcp-vol-control').mouseout(function() {
        if (!$(sel.call(this,".wcp-vol-button").selector + ":hover").length > 0 && !$(sel.call(this,".wcp-vol-bar").selector + ":hover").length > 0 && !$(sel.call(this,".wcp-vol-control").selector + ":hover").length > 0 && !volDrag) {
            sel.call(this,".wcp-vol-control").animate({ width: 0 },200);
        }
    });

    // set initial status message font size
    fontSize = calcFontSize(wjs(newid));

    wjs(newid).wrapper.find(".wcp-status").css('fontSize', fontSize);
    wjs(newid).wrapper.find(".wcp-notif").css('fontSize', fontSize);
    wjs(newid).wrapper.find(".wcp-subtitle-text").css('fontSize', fontSize);

    // create player and attach event handlers
    wjsPlayer = wjs(newid);
    vlcs[newid].hideUI = setTimeout(function(i) { return function() { hideUI.call(players[i]); } }(newid),6000);
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

    vlcs[newid].vlc = wcpSettings["wcjs"].createPlayer(wcpSettings && wcpSettings["vlcArgs"] ? wcpSettings["vlcArgs"] : null )
    vlcs[newid].renderer.bind(wjs(newid).canvas, vlcs[newid].vlc, wcpSettings["wcjsRendererOptions"] || null);

    vlcs[newid].vlc.events.on("FrameSetup",function(i) {
        return function(width, height, pixelFormat, videoFrame) {
            vlcs[i].events.emit('FrameSetup', width, height, pixelFormat, videoFrame);
            singleResize.call(players[i], width, height, pixelFormat, videoFrame);
        }
    }(newid));

    vlcs[newid].vlc.onPositionChanged = function(i) {
        return function(event) {
            positionChanged.call(players[i],event);
        }
    }(newid);

    vlcs[newid].vlc.onTimeChanged = function(i) {
        return function(event) {
            timePassed.call(players[i],event);
        }
    }(newid);

    vlcs[newid].vlc.onMediaChanged = function(i) {
        return function() {
            isMediaChanged.call(players[i]);
        }
    }(newid);

    vlcs[newid].vlc.onNothingSpecial = function(i) {
        return function() {
            if (vlcs[i].lastState != "idle") {
                vlcs[i].lastState = "idle";
                vlcs[i].events.emit('StateChanged','idle');
                vlcs[i].events.emit('StateChangedInt',0);
            }
        }
    }(newid);

    vlcs[newid].vlc.onOpening = function(i) {
        return function() {
            if (vlcs[i].lastState != "opening") {
                vlcs[i].lastState = "opening";
                vlcs[i].events.emit('StateChanged','opening');
                vlcs[i].events.emit('StateChangedInt',1);
            }
            isOpening.call(players[i]);
        }
    }(newid);

    vlcs[newid].vlc.onBuffering = function(i) {
        return function(event) {
            if (vlcs[i].lastState != "buffering") {
                vlcs[i].lastState = "buffering";
                vlcs[i].events.emit('StateChanged','buffering');
                vlcs[i].events.emit('StateChangedInt',2);
            }
            isBuffering.call(players[i],event);
        }
    }(newid);

    vlcs[newid].vlc.onPlaying = function(i) {
        return function() {
            if (vlcs[i].lastState != "playing") {
                vlcs[i].lastState = "playing";
                vlcs[i].events.emit('StateChanged','playing');
                vlcs[i].events.emit('StateChangedInt',3);
            }
            isPlaying.call(players[i]);

            preventSleep();
        }
    }(newid);

    vlcs[newid].vlc.onLengthChanged = function(i) {
        return function(length) {
            wjsPlayer = players[i];
            if (length > 0) {
                if (wjsPlayer.find(".wcp-time-current").text() == "") wjsPlayer.find(".wcp-time-current").text("00:00");
                wjsPlayer.find(".wcp-time-total").text(" / "+parseTime(length));
            } else wjsPlayer.find(".wcp-time-total").text("");
        }
    }(newid);

    vlcs[newid].vlc.onPaused = function(i) {
        return function() {
            if (vlcs[i].lastState != "paused") {
                vlcs[i].lastState = "paused";
                vlcs[i].events.emit('StateChanged','paused');
                vlcs[i].events.emit('StateChangedInt',4);

                allowSleep();
            }
        }
    }(newid);

    vlcs[newid].vlc.onStopped = function(i) {
        return function() {
            if (vlcs[i].lastState != "stopping") {
                vlcs[i].lastState = "stopping";
                vlcs[i].events.emit('StateChanged','stopping');
                vlcs[i].events.emit('StateChangedInt',5);
            }
            opts[i].keepHidden = true;
            players[i].zoom(0);

            allowSleep();
        }
    }(newid);

    vlcs[newid].vlc.onEndReached = function(i) {
        return function() {
            if (vlcs[i].lastState != "ended") {
                vlcs[i].lastState = "ended";
                vlcs[i].events.emit('StateChanged','ended');
                vlcs[i].events.emit('StateChangedInt',6);
            }
            hasEnded.call(players[i]);

            allowSleep();
        }
    }(newid);

    vlcs[newid].vlc.onEncounteredError = function(i) {
        return function() {
            if (vlcs[i].lastState != "error") {
                vlcs[i].lastState = "error";
                vlcs[i].events.emit('StateChanged','error');
                vlcs[i].events.emit('StateChangedInt',7);
            }

            allowSleep();
        }
    }(newid);

    // set playlist mode to single playback, the player has it's own playlist mode feature
    vlcs[newid].vlc.playlist.mode = vlcs[newid].vlc.playlist.Single;

    players[newid] = new wjs(newid);

    return players[newid];
}

wjs.prototype.addPlaylist = function(playlist) {
     if (this.itemCount() > 0) {
         this.find(".wcp-prev").show(0);
         this.find(".wcp-next").show(0);
     }
     // convert all strings to json object
     if (Array.isArray(playlist) === true) {
         var item = 0;
         for (item = 0; typeof playlist[item] !== 'undefined'; item++) {
             if (typeof playlist[item] === 'string') {
                 var tempPlaylist = playlist[item];
                 delete playlist[item];
                 playlist[item] = { url: tempPlaylist };
             }
         }
     } else if (typeof playlist === 'string') {
         var tempPlaylist = playlist;
         delete playlist;
         playlist = [];
         playlist.push({ url: tempPlaylist });
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
              if (playlist[item].title) this.vlc.playlist.items[this.itemCount()-1].title = "[custom]"+playlist[item].title;
              this.vlc.playlist.items[this.itemCount()-1].setting = "{}";
              var playerSettings = {};
              if (typeof playlist[item].aspectRatio !== 'undefined') {
                  if (item == 0) opts[this.context].aspectRatio = playlist[item].aspectRatio;
                  playerSettings.aspectRatio = playlist[item].aspectRatio;
              }
              if (typeof playlist[item].crop !== 'undefined') {
                  if (item == 0) opts[this.context].crop = playlist[item].crop;
                  playerSettings.crop = playlist[item].crop;
              }
              if (typeof playlist[item].zoom !== 'undefined') {
                  if (item == 0) opts[this.context].zoom = playlist[item].zoom;
                  playerSettings.zoom = playlist[item].zoom;
              }
              if (typeof playlist[item].subtitles !== 'undefined') playerSettings.subtitles = playlist[item].subtitles;
              if (Object.keys(playerSettings).length > 0) this.vlc.playlist.items[this.itemCount()-1].setting = JSON.stringify(playerSettings);
          }
     }

     if (this.state() == "idle") {
        if (opts[this.context].autoplay || opts[this.context].autostart) this.playItem(0);
        if ((opts[this.context].mute || opts[this.context].multiscreen) && !this.mute()) this.mute(true);
     }

    if (this.find(".wcp-playlist").is(":visible")) printPlaylist.call(this);
    if (this.itemCount() > 1) this.find(".wcp-playlist-but").css({ display: "block" });

    return this;
}

wjs.prototype.subDesc = function(getDesc) {
    if (!isNaN(getDesc)) {
        if (getDesc < this.vlc.subtitles.count) {
            wjsResponse = {};
            wjsResponse.language = this.vlc.subtitles[getDesc];
            wjsResponse.type = "internal";
            return wjsResponse;
        } else {
            var itemSetting = this.itemDesc(this.currentItem()).setting;
            if (itemSetting.subtitles) {
                itemSubtitles = itemSetting.subtitles;
                wjsIndex = this.vlc.subtitles.count;
                if (wjsIndex == 0) wjsIndex = 1;
                for (var newDesc in itemSubtitles) if (itemSubtitles.hasOwnProperty(newDesc)) {
                    if (getDesc == wjsIndex) {
                        wjsResponse = {};
                        wjsResponse.language = newDesc;
                        wjsResponse.type = "external";
                        wjsResponse.url = itemSubtitles[newDesc];
                        wjsResponse.ext = itemSubtitles[newDesc].split('.').pop().toLowerCase();
                        if (wjsResponse.ext.indexOf('[') > -1) wjsResponse.ext = wjsResponse.ext.substr(0,wjsResponse.ext.indexOf('['));
                        return wjsResponse;
                    }
                    wjsIndex++;
                }
                return;
            }
        }
        return;
    } else return console.error("Value sent to .subDesc() needs to be a number.");
}

wjs.prototype.subCount = function() {
    wjsIndex = this.vlc.subtitles.count;
    var itemSetting = this.itemDesc(this.currentItem()).setting;
    if (itemSetting.subtitles) {
        itemSubtitles = itemSetting.subtitles;
        if (wjsIndex == 0) wjsIndex = 1;
        for (var newDesc in itemSubtitles) if (itemSubtitles.hasOwnProperty(newDesc)) wjsIndex++;
        return wjsIndex;
    }
    return wjsIndex;
}

wjs.prototype.subTrack = function(newTrack) {
    if (typeof newTrack === 'number') {
        if (newTrack == 0) {
            this.vlc.subtitles.track = 0;
            clearSubtitles.call(this);
        } else {
            if (newTrack < this.vlc.subtitles.count) {
                this.find(".wcp-subtitle-text").html("");
                opts[this.context].subtitles = [];
                this.vlc.subtitles.track = newTrack;
            } else {
                this.find(".wcp-subtitle-text").html("");
                opts[this.context].subtitles = [];

                if (this.vlc.subtitles.track > 0) {
                    this.vlc.subtitles.track = 0;
                    newSub = newTrack - this.vlc.subtitles.count +1;
                } else newSub = newTrack - this.vlc.subtitles.count;

                itemSubtitles = this.itemDesc(this.currentItem()).setting.subtitles;
                for (var k in itemSubtitles) if (itemSubtitles.hasOwnProperty(k)) {
                    newSub--;
                    if (newSub == 0) {
                        loadSubtitle.call(this,itemSubtitles[k]);
                        break;
                    }
                }
            }
            opts[this.context].currentSub = newTrack;
            printSubtitles.call(this);
        }
    } else return opts[this.context].currentSub;
    return this;
}

wjs.prototype.subDelay = function(newDelay) {
    if (typeof newDelay === 'number') {
        this.vlc.subtitles.delay = newDelay;
        opts[this.context].subDelay = newDelay;
    } else return opts[this.context].subDelay;
    return this;
}

wjs.prototype.audioTrack = function(newTrack) {
    if (typeof newTrack === 'number') this.vlc.audio.track = newTrack;
    else return this.vlc.audio.track;
    return this;
}
wjs.prototype.audioDesc = function(getDesc) {
    if (typeof getDesc === 'number') return this.vlc.audio[getDesc];
    return this;
}
wjs.prototype.audioDelay = function(newDelay) {
    if (typeof newDelay === 'number') this.vlc.audio.delay = newDelay;
    else return this.vlc.audio.delay;
    return this;
}
wjs.prototype.audioChan = function(newChan) {
    if (typeof newChan === 'string') {
        if (newChan == "error") this.vlc.audio.channel = -1;
        else if (newChan == "stereo") this.vlc.audio.channel = 1;
        else if (newChan == "reverseStereo") this.vlc.audio.channel = 2;
        else if (newChan == "left") this.vlc.audio.channel = 3;
        else if (newChan == "right") this.vlc.audio.channel = 4;
        else if (newChan == "dolby") this.vlc.audio.channel = 5;
        else return false;
    } else {
        if (this.vlc.audio.channel == -1) return "error";
        else if (this.vlc.audio.channel == 1) return "stereo";
        else if (this.vlc.audio.channel == 2) return "reverseStereo";
        else if (this.vlc.audio.channel == 3) return "left";
        else if (this.vlc.audio.channel == 4) return "right";
        else if (this.vlc.audio.channel == 5) return "dolby";
    }
    return this;
}

wjs.prototype.audioChanInt = function(newChan) {
    if (typeof newChan === 'number') this.vlc.audio.channel = newChan;
    else return this.vlc.audio.channel;
    return this;
}

wjs.prototype.deinterlace = function(newMode) {
    if (typeof newMode === 'string') {
        if (newMode == 'disabled') this.vlc.video.deinterlace.disable();
        else this.vlc.video.deinterlace.enable(newMode);
    } else return false;
    return this;
}

wjs.prototype.mute = function(newMute) {
    if (typeof newMute === "boolean") {
        if (this.vlc.mute !== newMute) {
            if (!this.vlc.mute) players[this.context].volume(0);
            else {
                if (opts[this.context].lastVolume <= 15) opts[this.context].lastVolume = 100;
                this.volume(opts[this.context].lastVolume);
            }
        } else return false;
    } else return this.vlc.mute;
}

wjs.prototype.volume = function(newVolume) {
    if (typeof newVolume !== 'undefined' && !isNaN(newVolume) && newVolume >= 0 && newVolume <= 5) {
        opts[this.context].lastVolume = this.vlc.volume;
        this.vlc.volume = 0;
        vlcs[this.context].events.emit('VolumeChange', 0);
        if (!this.vlc.mute) {
            this.find(".wcp-vol-button").removeClass("wcp-volume-medium").removeClass("wcp-volume-high").removeClass("wcp-volume-low").addClass("wcp-mute");
            this.vlc.mute = true;
        }
        this.find(".wcp-vol-bar-full").css("width", "0px");
    } else if (newVolume && !isNaN(newVolume) && newVolume > 0 && newVolume <= 200) {
        if (this.vlc.mute) this.vlc.mute = false;

        if(newVolume > 200) newVolume = 200;

        if (newVolume > 150) this.find(".wcp-vol-button").removeClass("wcp-mute").removeClass("wcp-volume-medium").removeClass("wcp-volume-low").addClass("wcp-volume-high");
        else if (newVolume > 50) this.find(".wcp-vol-button").removeClass("wcp-mute").removeClass("wcp-volume-high").removeClass("wcp-volume-low").addClass("wcp-volume-medium");
        else this.find(".wcp-vol-button").removeClass("wcp-mute").removeClass("wcp-volume-medium").removeClass("wcp-volume-high").addClass("wcp-volume-low");

        this.find(".wcp-vol-bar-full").css("width", (((newVolume/200)*parseInt(this.find(".wcp-vol-bar").css("width")))-parseInt(this.find(".wcp-vol-bar-pointer").css("width")))+"px");
        this.vlc.volume = parseInt(newVolume);
        vlcs[this.context].events.emit('VolumeChange', parseInt(newVolume));
    } else return this.vlc.volume;
    return this;
}

wjs.prototype.time = function(newTime) {
    if (typeof newTime === 'number') {
        this.vlc.time = newTime;
        this.find(".wcp-time-current").text(parseTime(newTime,this.vlc.length));
        this.find(".wcp-progress-seen")[0].style.width = (newTime/(this.vlc.length)*100)+"%";
    } else return this.vlc.time;
    return this;
}

wjs.prototype.position = function(newPosition) {
    if (typeof newPosition === 'number') {
        this.vlc.position = newPosition;
        this.find(".wcp-time-current").text(parseTime(this.vlc.length*newPosition,this.vlc.length));
        this.find(".wcp-progress-seen")[0].style.width = (newPosition*100)+"%";
    } else return this.vlc.position;
    return this;
}

wjs.prototype.rate = function(newRate) {
    if (typeof newRate === 'number') this.vlc.input.rate = newRate;
    else return this.vlc.input.rate;
    return this;
}

wjs.prototype.currentItem = function(i) {
    if (typeof i !== 'undefined') {
        if (i != this.vlc.playlist.currentItem) {
            if (i < this.itemCount() && i > -1) {
                if (this.itemDesc(i).disabled) {
                    this.vlc.playlist.items[i].disabled = false;
                    if (this.find(".wcp-playlist").is(":visible")) {
                        this.find(".wcp-playlist-items:eq("+i+")").removeClass("wcp-disabled");
                    }
                    this.find(".wcp-playlist").find(".wcp-menu-selected").removeClass("wcp-menu-selected");
                    this.find(".wcp-playlist-items:eq("+i+")").addClass("wcp-menu-selected");
                }
                opts[this.context].keepHidden = true;
                this.zoom(0);

                wjsButton = this.find(".wcp-play");
                if (wjsButton.length != 0) wjsButton.removeClass("wcp-play").addClass("wcp-pause");

                wjsButton = this.find(".wcp-replay");
                if (wjsButton.length != 0) wjsButton.removeClass("wcp-replay").addClass("wcp-pause");

                this.vlc.playlist.currentItem = i;

                positionChanged.call(this,0);
                this.find(".wcp-time-current").text("");
                this.find(".wcp-time-total").text("");
            }
        }
    } else return this.vlc.playlist.currentItem;
    return this;
}

wjs.prototype.itemDesc = function(getDesc) {
    if (typeof getDesc === 'number') {
        if (getDesc > -1 && getDesc < this.itemCount()) {
            wjsDesc = JSON.stringify(this.vlc.playlist.items[getDesc]);
            return JSON.parse(wjsDesc.replace('"title":"[custom]','"title":"').split('\\"').join('"').split('"{').join('{').split('}"').join('}'));
        } else return false;
    }
    return false;
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

wjs.prototype.aspectRatio = function(newRatio) {
    if (typeof newRatio === 'string') {
        opts[this.context].crop = "Default";
        if (opts[this.context].zoom > 0) opts[this.context].zoom = 1;
        opts[this.context].aspectRatio = newRatio;
        autoResize();
    } else return opts[this.context].aspectRatio;
    return this;
}

wjs.prototype.crop = function(newCrop) {
    if (typeof newCrop === 'string') {
        opts[this.context].aspectRatio = "Default";
        if (opts[this.context].zoom > 0) opts[this.context].zoom = 1;
        opts[this.context].crop = newCrop;
        autoResize();
    } else return opts[this.context].crop;
    return this;
}

wjs.prototype.zoom = function(newZoom) {
    if (typeof newZoom === 'number') {
        opts[this.context].aspectRatio = "Default";
        opts[this.context].crop = "Default";
        opts[this.context].zoom = newZoom;
        autoResize();
    } else return opts[this.context].zoom;
    return this;
}

wjs.prototype.advanceItem = function(newX,newY) {
    if (typeof newX === 'number' && typeof newY === 'number') {
        this.vlc.playlist.advanceItem(newX,newY);
        if (this.find(".wcp-playlist").is(":visible")) printPlaylist.call(this);
    } else return false;
    return this;
}

wjs.prototype.removeItem = function(remItem) {
    if (typeof remItem === 'number') {
         if (this.itemCount() <= 2) {
             if (this.vlc.playlist.removeItem(remItem)) {
                 this.find(".wcp-prev").hide(0);
                 this.find(".wcp-next").hide(0);
             }
         } else this.vlc.playlist.removeItem(remItem);
        if (this.find(".wcp-playlist").is(":visible")) printPlaylist.call(this);
        // hide playlist button if less then 2 playlist items
        if (this.itemCount() < 2) this.find(".wcp-playlist-but").css({ display: "none" });
    } else return false;
    return this;
}

wjs.prototype.clearPlaylist = function() {
    this.stop();
    this.vlc.playlist.clear();
    this.find(".wcp-time-total").text("");
    if (this.find(".wcp-playlist").is(":visible")) printPlaylist.call(this);
    if (this.find(".wcp-playlist-but").is(":visible")) this.find(".wcp-playlist-but").css({ display: "none" });
    return this;
}

function progressHoverIn(e) {
    if (this.vlc.length) {
        var rect = this.wrapper[0].getBoundingClientRect();
        if (e.pageX >= rect.left && e.pageX <= rect.right) {
            var newtime = Math.floor(this.vlc.length * ((e.pageX - rect.left) / this.wrapper.width()));
            if (newtime > 0) {
                this.find(".wcp-tooltip-inner").text(parseTime(newtime));
                var offset = Math.floor(this.find(".wcp-tooltip").width() / 2);
                if (e.pageX >= (offset + rect.left) && e.pageX <= (rect.right - offset)) {
                    this.find(".wcp-tooltip").css("left",((e.pageX - rect.left) - offset)+"px");
                } else if (e.pageX < (rect.left + offset)) this.find(".wcp-tooltip").css("left",rect.left+"px");
                else if (e.pageX > (rect.right - offset)) this.find(".wcp-tooltip").css("left",(rect.right - this.find(".wcp-tooltip").width())+"px");
                this.find(".wcp-tooltip").show(0);
            }
        } else this.find(".wcp-tooltip").hide(0);
    }
}

function progressMouseMoved(e) {
    if (this.vlc.length) {
        var rect = this.wrapper[0].getBoundingClientRect();
        if (e.pageX >= rect.left && e.pageX <= rect.right) {
            var newtime = Math.floor(this.vlc.length * ((e.pageX - rect.left) / this.wrapper.width()));
            if (newtime > 0) {
                this.find(".wcp-tooltip-inner").text(parseTime(newtime));
                var offset = Math.floor(this.find(".wcp-tooltip").width() / 2);
                if (e.pageX >= (offset + rect.left) && e.pageX <= (rect.right - offset)) {
                    this.find(".wcp-tooltip").css("left",((e.pageX - rect.left) - offset)+"px");
                } else if (e.pageX < (rect.left + offset)) this.find(".wcp-tooltip").css("left",rect.left+"px");
                else if (e.pageX > (rect.right - offset)) this.find(".wcp-tooltip").css("left",(rect.right - this.find(".wcp-tooltip").width())+"px");
                this.find(".wcp-tooltip").show(0);
            }
        } else this.find(".wcp-tooltip").hide(0);
    }
}

function seekDragEnded(e,wjsMulti) {

    var rect = this.wrapper[0].getBoundingClientRect();

    if (wjsMulti) {
        var wjsLogic = (e.pageX >= rect.left && e.pageX <= rect.right && e.pageY >= rect.top && e.pageY <= rect.bottom);
        this.find(".wcp-tooltip").fadeOut();
    } else {
        var wjsLogic = (e.pageX >= rect.left && e.pageX <= rect.right);
        this.find(".wcp-tooltip").hide(0);
    }

    if (wjsLogic) {
        p = (e.pageX - rect.left) / (rect.right - rect.left);
        this.find(".wcp-progress-seen").css("width", (p*100)+"%");
        this.vlc.position = p;
        this.find(".wcp-time-current").text(this.find(".wcp-tooltip-inner").text());
    }

}

function volDragEnded(e,wjsMulti) {

    if (wjsMulti) {
        var rect = this.wrapper[0].getBoundingClientRect();
        var wjsLogic = (e.pageX >= rect.left && e.pageX <= rect.right && e.pageY >= rect.top && e.pageY <= rect.bottom);
    } else var wjsLogic = true;

    var rect = this.find(".wcp-vol-bar")[0].getBoundingClientRect();

    if (wjsLogic) {
        var volControl = this.find(".wcp-vol-control");

        if (e.pageX >= rect.right) {
            p = 1;
            setTimeout(function() { volControl.animate({ width: 0 },200); },1500);
        } else if (e.pageX <= rect.left)  {
            p = 0;
            setTimeout(function() { volControl.animate({ width: 0 },200); },1500);
        } else {
            p = (e.pageX - rect.left) / (rect.right - rect.left);
            if (e.pageY < rect.top) setTimeout(function() { volControl.animate({ width: 0 },200); },1500);
            else if (e.pageY > rect.bottom) setTimeout(function() { volControl.animate({ width: 0 },200); },1500);
        }
        this.volume(Math.floor(200* p)+5);
    }

}

function mouseClickEnd(e) {
    clearInterval(vlcs[this.context].hideUI);
    this.wrapper.css({cursor: 'default'});

    vlcs[this.context].hideUI = setTimeout(function(i) { return function() { hideUI.call(players[i]); } }(this.context),3000);
    if (seekDrag) {
        seekDrag = false;
        if (window.document.webkitFullscreenElement != null || $(".webchimeras").length == 1) seekDragEnded.call(this,e);
        else $('.webchimeras').each(function(i, obj) { seekDragEnded.call(getContext(obj),e,true); });
    }
    if (volDrag) {
        volDrag = false;
        if (window.document.webkitFullscreenElement != null || $(".webchimeras").length == 1) volDragEnded.call(this,e);
        else $('.webchimeras').each(function(i, obj) { volDragEnded.call(getContext(obj),e,true); });
    }
}

function seekDragMoved(e,wjsMulti) {

    var rect = this.wrapper[0].getBoundingClientRect();

    if (wjsMulti) var wjsLogic = (e.pageX >= rect.left && e.pageX <= rect.right && e.pageY >= rect.top && e.pageY <= rect.bottom);
    else var wjsLogic = (e.pageX >= rect.left && e.pageX <= rect.right);

    if (wjsLogic) {
        p = (e.pageX - rect.left) / (rect.right - rect.left);
        this.find(".wcp-progress-seen").css("width", (p*100)+"%");
        vlc = this.vlc;
        var newtime = Math.floor(vlc.length * ((e.pageX - rect.left) / this.wrapper.width()));
        if (newtime > 0) {
            this.find(".wcp-tooltip-inner").text(parseTime(newtime));
            var offset = Math.floor(this.find(".wcp-tooltip").width() / 2);
            if (e.pageX >= (offset + rect.left) && e.pageX <= (rect.right - offset)) {
                this.find(".wcp-tooltip").css("left",((e.pageX - rect.left) - offset)+"px");
            } else if (e.pageX < (rect.left + offset)) this.find(".wcp-tooltip").css("left",rect.left+"px");
            else if (e.pageX > (rect.right - offset)) this.find(".wcp-tooltip").css("left",(rect.right - this.find(".wcp-tooltip").width())+"px");
            this.find(".wcp-tooltip").show(0);
        }
    }
}

function volDragMoved(e,wjsMulti) {

    var rect = this.find(".wcp-vol-bar")[0].getBoundingClientRect();

    if (wjsMulti) {
        var rectWrapper = this.wrapper.parent()[0].getBoundingClientRect();
        var wjsLogic = (e.pageX >= rectWrapper.left && e.pageX <= rectWrapper.right && e.pageY >= rectWrapper.top && e.pageY <= rectWrapper.bottom);
    } else var wjsLogic = true;

    if (wjsLogic && e.pageX >= rect.left && e.pageX <= rect.right) {
        p = (e.pageX - rect.left) / (rect.right - rect.left);
        this.volume(Math.floor(200* p)+5);
    }
}

function mouseMoved(e) {
    if (seekDrag) {
        if (window.document.webkitFullscreenElement != null || $(".webchimeras").length == 1) seekDragMoved.call(this,e);
        else $('.webchimeras').each(function(i, obj) { seekDragMoved.call(getContext(obj),e,true); });
    }
    if (volDrag) {
        if (window.document.webkitFullscreenElement != null || $(".webchimeras").length == 1) volDragMoved.call(this,e);
        else $('.webchimeras').each(function(i, obj) { volDragMoved.call(getContext(obj),e,true); });
    }
}

wjs.prototype.catchEvent = function(wjsEvent,wjsFunction) {
    var saveContext = this;
    this.vlc.events.on(wjsEvent, function(event) { return wjsFunction.call(saveContext,event); } );
    return this;
}

wjs.prototype.video = function(newBool) {
    if (typeof newBool !== 'undefined') {
        if (newBool === true) {
            if (opts[this.context].zoom == 0) {
                opts[this.context].zoom = opts[this.context].lastZoom;
                delete opts[this.context].lastZoom;
                autoResize();
                return true;
            } else return false;
        } else {
            if (opts[this.context].zoom > 0) {
                opts[this.context].lastZoom = opts[this.context].zoom;
                opts[this.context].zoom = 0;
                autoResize();
                return true;
            } else return false;
        }
    }
}

wjs.prototype.playlist = function(newBool) {
    if (typeof newBool !== 'undefined') {
        if (newBool === true) return showPlaylist.call(this);
        else return hidePlaylist.call(this);
    } else return this.find(".wcp-playlist")[0];
}

wjs.prototype.subtitles = function(newBool) {
    if (typeof newBool !== 'undefined') {
        if (newBool === true) return showSubtitles.call(this);
        else return hideSubtitles.call(this);
    } else return this.find(".wcp-subtitles")[0];
}

wjs.prototype.ui = function(newBool) {
    if (typeof newBool !== 'undefined') {
        if (newBool === true) {
            if (opts[this.context].uiHidden) {
                opts[this.context].uiHidden = false;
                this.find(".wcp-titlebar").stop().show(0);
                this.find(".wcp-toolbar").stop().show(0);
                if (this.wrapper.css('cursor') == 'none') this.wrapper.css({cursor: 'default'});
                return true;
            } else return false;
        } else {
            if (!opts[this.context].uiHidden) {
                opts[this.context].uiHidden = true;
                this.find(".wcp-titlebar").stop().hide(0);
                this.find(".wcp-toolbar").stop().hide(0);
                this.find(".wcp-tooltip").stop().hide(0);
                if (this.wrapper.css('cursor') == 'none') this.wrapper.css({cursor: 'default'});
                return true;
            } else return false;
        }
    } else return this;
}

wjs.prototype.notify = function(newMessage) {
    this.find(".wcp-notif").text(newMessage);
    this.find(".wcp-notif").stop().show(0);
    if (opts[this.context].notifTimer) clearTimeout(opts[this.context].notifTimer);
    wjsPlayer = this;
    opts[this.context].notifTimer = setTimeout(function() { wjsPlayer.find(".wcp-notif").fadeOut(1500); },1000);
}

wjs.prototype.toggleFullscreen = function() {
    if (window.document.webkitFullscreenElement == null) return fullscreenOn.call(this);
    else return fullscreenOff.call(this);
}

wjs.prototype.fullscreen = function(newBool) {
    if (typeof newBool !== 'undefined') {
        if (newBool === true) return fullscreenOn.call(this);
        else return fullscreenOff.call(this);
    } else {
        if (window.document.webkitFullscreenElement == null) return false;
        else return true;
    }
}

wjs.prototype.animatePause = function() {
    this.find(".wcp-anim-basic").css("fontSize", "50px");
    this.find(".wcp-anim-basic").css("padding", "7px 27px");
    this.find(".wcp-anim-basic").css("borderRadius", "12px");
    this.find(".wcp-pause-anim").fadeIn(200).fadeOut(200);
    this.find(".wcp-anim-basic").animate({ fontSize: "80px", padding: "7px 30px" },400);
}

function fullscreenOn() {
    if (window.document.webkitFullscreenElement == null) {
        if (opts[this.context].titleBar == "none" || opts[this.context].titleBar == "minimized") {
            this.find(".wcp-titlebar").hide(0);
            if (this.find(".wcp-status").css("top") == "35px") this.find(".wcp-status").css("top", "10px");
            if (this.find(".wcp-notif").css("top") == "35px") this.find(".wcp-notif").css("top", "10px");
        } else {
            if (this.find(".wcp-status").css("top") == "10px") this.find(".wcp-status").css("top", "35px");
            if (this.find(".wcp-notif").css("top") == "10px") this.find(".wcp-notif").css("top", "35px");
        }
        wcpWrapper = this.wrapper[0];
        if (wcpWrapper.webkitRequestFullscreen) wcpWrapper.webkitRequestFullscreen();
        else if (wcpWrapper.requestFullscreen) wcpWrapper.requestFullscreen();

        switchClass(this.find(".wcp-maximize"),"wcp-maximize","wcp-minimize");

        var that = this;
        setTimeout(function() {
            singleResize.call(that, that.canvas.width, that.canvas.height);
        }, 200);

        return true;
    } else return false;
}

function fullscreenOff() {
    if (window.document.webkitFullscreenElement != null) {
        if (["none","fullscreen"].indexOf(opts[this.context].titleBar) > -1) {
            this.find(".wcp-titlebar").hide(0);
            if (this.find(".wcp-status").css("top") == "35px") this.find(".wcp-status").css("top", "10px");
            if (this.find(".wcp-notif").css("top") == "35px") this.find(".wcp-notif").css("top", "10px");
        } else {
            if (this.find(".wcp-status").css("top") == "10px") this.find(".wcp-status").css("top", "35px");
            if (this.find(".wcp-notif").css("top") == "10px") this.find(".wcp-notif").css("top", "35px");
        }

        if (window.document.webkitCancelFullScreen) window.document.webkitCancelFullScreen();
        else if (window.document.cancelFullScreen) window.document.cancelFullScreen();

        switchClass(this.find(".wcp-minimize"),"wcp-minimize","wcp-maximize");

        if (vlcs[this.context].multiscreen) {
            this.find(".wcp-titlebar").hide(0);
            this.find(".wcp-toolbar").hide(0);
            this.find(".wcp-tooltip").hide(0);
            this.wrapper.css({cursor: 'pointer'});
            if (!this.vlc.mute) this.vlc.mute = true;
        }

        var that = this;
        setTimeout(function() {
            singleResize.call(that, that.canvas.width, that.canvas.height);
        }, 200);

        return true;
    } else return false;
}

// player event handlers
function timePassed(t) {
    if (t > 0) this.find(".wcp-time-current").text(parseTime(t,this.vlc.length));
    else if (this.find(".wcp-time-current").text() != "" && this.find(".wcp-time-total").text() == "") this.find(".wcp-time-current").text("");

    if (typeof opts[this.context].subtitles === 'undefined') opts[this.context].subtitles = [];

    if (opts[this.context].subtitles.length > 0) {
        // End show subtitle text (external subtitles)
        var nowSecond = (t - opts[this.context].subDelay) /1000;
        if (opts[this.context].trackSub > -2) {
            var subtitle = -1;

            var os = 0;
            for (os in opts[this.context].subtitles) {
                if (os > nowSecond) break;
                subtitle = os;
            }

            if (subtitle > 0) {
                if(subtitle != opts[this.context].trackSub) {
                    if ((opts[this.context].subtitles[subtitle].t.match(new RegExp("<", "g")) || []).length == 2) {
                        if (!(opts[this.context].subtitles[subtitle].t.substr(0,1) == "<" && opts[this.context].subtitles[subtitle].t.slice(-1) == ">")) {
                            opts[this.context].subtitles[subtitle].t = opts[this.context].subtitles[subtitle].t.replace(/<\/?[^>]+(>|$)/g, "");
                        }
                    } else if ((opts[this.context].subtitles[subtitle].t.match(new RegExp("<", "g")) || []).length > 2) {
                        opts[this.context].subtitles[subtitle].t = opts[this.context].subtitles[subtitle].t.replace(/<\/?[^>]+(>|$)/g, "");
                    }
                    this.find(".wcp-subtitle-text").html(nl2br(opts[this.context].subtitles[subtitle].t));
                    opts[this.context].trackSub = subtitle;
                } else if (opts[this.context].subtitles[subtitle].o < nowSecond) {
                    this.find(".wcp-subtitle-text").html("");
                }
            }
        }
        // End show subtitle text (external subtitles)
    }
}
function positionChanged(position) {
    opts[this.context].lastPos = position;
    if (!seekDrag) this.find(".wcp-progress-seen")[0].style.width = (position*100)+"%";
}

function isOpening() {
    if (this.currentItem() != opts[this.context].lastItem) {
        opts[this.context].lastItem = this.currentItem();
        if (this.find(".wcp-playlist").is(":visible")) printPlaylist.call(this);
        this.find(".wcp-title")[0].innerHTML = this.itemDesc(this.currentItem()).title;
    }
    var style = window.getComputedStyle(this.find(".wcp-status")[0]);
    if (style.display === 'none') this.find(".wcp-status").show();
    this.find(".wcp-status").text("Opening");
}

function isMediaChanged() {
    opts[this.context].currentSub = 0;
    opts[this.context].subtitles = [];

    this.find(".wcp-subtitle-text").html("");
    if (this.find(".wcp-subtitles").is(":visible")) this.find(".wcp-subtitles").hide(0);
    this.find(".wcp-subtitle-but").hide(0);

    opts[this.context].firstTime = true;

    vlcs[this.context].renderer.clear(this.canvas);
}

function isBuffering(percent) {
    this.find(".wcp-status").text("Buffering "+percent+"%");
    this.find(".wcp-status").stop().show(0);
    if (percent == 100) this.find(".wcp-status").fadeOut(1200);
}

function isPlaying() {
    if (opts[this.context].keepHidden) {
        opts[this.context].keepHidden = false;
        itemSetting = this.itemDesc(this.currentItem()).setting;
        if (itemSetting.zoom) opts[this.context].zoom = itemSetting.zoom;
        else {
            opts[this.context].zoom = 1;
            autoResize();
        }
    }
    if (opts[this.context].firstTime) {
        if (this.find(".wcp-title").text() != this.itemDesc(this.currentItem()).title) {
            this.find(".wcp-title")[0].innerHTML = this.itemDesc(this.currentItem()).title;
        }
        opts[this.context].firstTime = false;
        if (this.vlc.subtitles.track > 0) this.vlc.subtitles.track = 0;
        opts[this.context].currentSub = 0;
        opts[this.context].trackSub = -1;
        totalSubs = this.vlc.subtitles.count;
        itemSetting = this.itemDesc(this.currentItem()).setting;

        // set default aspect ratio
        if (itemSetting.aspectRatio) opts[this.context].aspectRatio = itemSetting.aspectRatio;
        else {
            opts[this.context].aspectRatio = "Default";
            autoResize();
        }

        // set default crop
        if (itemSetting.crop) opts[this.context].crop = itemSetting.crop;
        else {
            opts[this.context].crop = "Default";
            autoResize();
        }

        // set default zoom
        if (itemSetting.zoom) opts[this.context].zoom = itemSetting.zoom;
        else {
            opts[this.context].zoom = 1;
            autoResize();
        }

        if (itemSetting.subtitles) totalSubs += Object.keys(itemSetting.subtitles).length;

        opts[this.context].subDelay = 0;

        if (totalSubs > 0) this.find(".wcp-subtitle-but").show(0);

        vlcs[this.context].events.emit('FirstPlay');
    }
    var style = window.getComputedStyle(this.find(".wcp-status")[0]);
    if (style.display !== 'none') this.find(".wcp-status").fadeOut(1200);
}

function hasEnded() {
    opts[this.context].keepHidden = true;
    this.zoom(0);
    switchClass(this.find(".wcp-pause"),"wcp-pause","wcp-replay");
    if (this.time() > 0) {
        if (opts[this.context].lastPos < 0.95) {
            // Reconnect if connection to server lost
            this.vlc.playlist.currentItem =opts[this.context].lastItem;
            this.vlc.playlist.play();
            this.vlc.position = opts[this.context].lastPos;

            wjsButton = this.find(".wcp-play");
            if (wjsButton.length != 0) wjsButton.removeClass("wcp-play").addClass("wcp-pause");

            wjsButton = this.find(".wcp-replay");
            if (wjsButton.length != 0) wjsButton.removeClass("wcp-replay").addClass("wcp-pause");

            positionChanged.call(this,0);
            this.find(".wcp-time-current").text("");
            this.find(".wcp-time-total").text("");
            // End Reconnect if connection to server lost
        } else {
            if (opts[this.context].loop && this.currentItem() +1 == this.itemCount()) this.playItem(this.currentItem());
            else if (this.currentItem() +1 < this.itemCount()) this.next();
        }
    }
}
// end player event handlers

function singleResize(width,height) {

    this.canvas.width = width;
    this.canvas.height = height;

    var container = $(this.context),
        canvasParent = $(this.canvas).parent()[0];

    if (opts[this.context].aspectRatio != "Default" && opts[this.context].aspectRatio.indexOf(":") > -1) {
        var res = opts[this.context].aspectRatio.split(":");
        var ratio = gcd(this.canvas.width,this.canvas.height);
    }
    var destAspect = container.width() / container.height();

    if (ratio) var sourceAspect = (ratio * parseFloat(res[0])) / (ratio * parseFloat(res[1]));
    else var sourceAspect = this.canvas.width / this.canvas.height;

    if (opts[this.context].crop != "Default" && opts[this.context].crop.indexOf(":") > -1) {
        var res = opts[this.context].crop.split(":");
        var ratio = gcd(this.canvas.width,this.canvas.height);
        var sourceAspect = (ratio * parseFloat(res[0])) / (ratio * parseFloat(res[1]));
    }

    var cond = destAspect > sourceAspect;

    if (opts[this.context].crop != "Default" && opts[this.context].crop.indexOf(":") > -1) {
        if (cond) {
            canvasParent.style.height = "100%";
            canvasParent.style.width = ( ((container.height() * sourceAspect) / container.width() ) * 100) + "%";
        } else {
            canvasParent.style.height = ( ((container.width() / sourceAspect) /container.height() ) * 100) + "%";
            canvasParent.style.width = "100%";
        }
        var sourceAspect = this.canvas.width / this.canvas.height;
        futureWidth = ( ((canvasParent.offsetHeight * sourceAspect) / canvasParent.offsetWidth ) *canvasParent.offsetWidth);
        if (futureWidth < canvasParent.offsetWidth) {
            var sourceAspect = this.canvas.height / this.canvas.width;
            this.canvas.style.width = canvasParent.offsetWidth+"px";
            this.canvas.style.height = ( ((canvasParent.offsetWidth * sourceAspect) / canvasParent.offsetHeight ) *canvasParent.offsetHeight) + "px";
        } else {
            this.canvas.style.height = canvasParent.offsetHeight+"px";
            this.canvas.style.width = ( ((canvasParent.offsetHeight * sourceAspect) / canvasParent.offsetWidth ) *canvasParent.offsetWidth) + "px";
        }
    } else {
        if (cond) {
            canvasParent.style.height = (100*opts[this.context].zoom)+"%";
            canvasParent.style.width = ( ((container.height() * sourceAspect) / container.width() ) * 100 *opts[this.context].zoom) + "%";
        } else {
            canvasParent.style.height = ( ((container.width() / sourceAspect) /container.height() ) * 100*opts[this.context].zoom) + "%";
            canvasParent.style.width = (100*opts[this.context].zoom)+"%";
        }
        this.canvas.style.height = "100%";
        this.canvas.style.width = "100%";
    }
}

function autoResize() {
    $('.webchimeras').each(function(i, obj) {
        wjsPlayer = getContext(obj);
        if (wjsPlayer.wrapper[0]) {
            // resize status font size
            fontSize = calcFontSize(wjsPlayer);

            wjsPlayer.find(".wcp-status").css('fontSize', fontSize);
            wjsPlayer.find(".wcp-notif").css('fontSize', fontSize);
            wjsPlayer.find(".wcp-subtitle-text").css('fontSize', fontSize);

            singleResize.call(wjsPlayer,wjsPlayer.canvas.width,wjsPlayer.canvas.height);
        }
    });
}

function hideUI() {
    if (!(vlcs[this.context].multiscreen && window.document.webkitFullscreenElement == null)) {
        if (seekDrag || volDrag || ($(this.find(".wcp-toolbar").selector + ":hover").length > 0 && vlcs[this.context].timestampUI + 20 > Math.floor(Date.now() / 1000))) {
            vlcs[this.context].hideUI = setTimeout(function(i) { return function() { hideUI.call(i); } }(this),3000);
            return;
        }
        if (window.document.webkitFullscreenElement == null) {
            if (["both","minimized"].indexOf(opts[this.context].titleBar) > -1) this.find(".wcp-titlebar").stop().fadeOut();
        } else {
            if (["both","fullscreen"].indexOf(opts[this.context].titleBar) > -1) this.find(".wcp-titlebar").stop().fadeOut();
        }
        this.find(".wcp-toolbar").stop().fadeOut();
        this.find(".wcp-tooltip").stop().fadeOut();
        this.wrapper.css({cursor: 'none'});
    }
}

function showPlaylist() {
    if (!this.find(".wcp-playlist").is(":visible")) {
        if (this.find(".wcp-subtitles").is(":visible")) this.find(".wcp-subtitles").hide(0);
        this.find(".wcp-playlist").show(0);
        printPlaylist.call(this);
    }
}

function hidePlaylist() {
    if (this.find(".wcp-playlist").is(":visible")) {
        this.find(".wcp-playlist-items").sortable("destroy");
        this.find(".wcp-playlist").hide(0);
    }
}

function showSubtitles() {
    if (!this.find(".wcp-subtitles").is(":visible")) {
        if (this.find(".wcp-playlist").is(":visible")) {
            this.find(".wcp-playlist-items").sortable("destroy");
            this.find(".wcp-playlist").hide(0);
        }
        this.find(".wcp-subtitles").show(0);
        printSubtitles.call(this);
    }
}

function printPlaylist() {
    playlistItems = this.find(".wcp-playlist-items");
    oi = 0;
    if (this.itemCount() > 0) {
        generatePlaylist = "";
        for (oi = 0; oi < this.itemCount(); oi++) {
            if (this.vlc.playlist.items[oi].title.indexOf("[custom]") != 0) {
                var plstring = this.itemDesc(oi).title;
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

                if (plstring != this.itemDesc(oi).title) this.vlc.playlist.items[oi].title = "[custom]"+plstring;
            }
            generatePlaylist += '<li class="wcp-menu-item wcp-playlist-item';
            if (oi == this.currentItem()) generatePlaylist += ' wcp-menu-selected';
            if (this.itemDesc(oi).disabled) generatePlaylist += ' wcp-disabled';
            generatePlaylist += '"><img class="wcp-disabler-img" src="'+relbase+'/images/dragger.png"><div class="wcp-disabler-hold"><div class="wcp-disabler"><div class="wcp-disabler-dot"></div></div></div>'+this.itemDesc(oi).title+'</li>';
        }
        playlistItems.css('overflowY', 'scroll');
        playlistItems.html("");
        playlistItems.html(generatePlaylist);

        if (playlistItems.outerHeight() < (oi* parseInt(playlistItems.find(".wcp-playlist-item").css("height")))) {
            playlistItems.css("cursor","pointer");
        } else playlistItems.css("cursor","default");

        this.find(".wcp-disabler-hold").click(function(e) {
            if (!e) var e = window.event;
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
            plItem = $(this).parent();
            wjsPlayer = getContext(this);
            if (!plItem.hasClass("wcp-menu-selected")) {
                if (!wjsPlayer.itemDesc(plItem.index()).disabled) {
                    plItem.addClass("wcp-disabled");
                    wjsPlayer.vlc.playlist.items[plItem.index()].disabled = true;
                } else {
                    plItem.removeClass("wcp-disabled");
                    wjsPlayer.vlc.playlist.items[plItem.index()].disabled = false;
                }
            }
        });
        this.find(".wcp-playlist-item").click(function() {
            if (!$(this).hasClass("wcp-menu-selected")) {
                wjsPlayer = getContext(this);
                if (wjsPlayer.itemDesc($(this).index()).disabled) {
                    wjsPlayer.vlc.playlist.items[$(this).index()].disabled = false;
                    $(this).removeClass("wcp-disabled");
                }

                wjsPlayer.playItem($(this).index());
                printPlaylist.call(wjsPlayer);
            }
        });
        this.find(".wcp-playlist-items").sortable({
          placeholder: "sortable-placeholder",
          delay: 250,
          start: function(e,ui) {
              $(ui.item[0]).addClass("sortable-dragging");
              var start_pos = ui.item.index();
              ui.item.data('start_pos', start_pos);
          },
          stop: function(e,ui) {
              $(this).parents(".wcp-wrapper").find(".sortable-dragging").removeClass("sortable-dragging");
          },
          update: function(e,ui) {
              var start_pos = ui.item.data('start_pos');
              var end_pos = ui.item.index();
              getContext(this).advanceItem(start_pos,(end_pos - start_pos));
          }
        });
    } else playlistItems.html("");
}

function printSubtitles() {
    playlistItems = this.find(".wcp-subtitles-items");

    generatePlaylist = "";
    generatePlaylist += '<li class="wcp-menu-item wcp-subtitles-item';
    if (opts[this.context].currentSub == 0) generatePlaylist += ' wcp-menu-selected';
    generatePlaylist += '">None</li>';
    if (this.vlc.subtitles.count > 0) {
        for (oi = 1; oi < this.vlc.subtitles.count; oi++) {
            generatePlaylist += '<li class="wcp-menu-item wcp-subtitles-item';
            if (oi == opts[this.context].currentSub) generatePlaylist += ' wcp-menu-selected';
            generatePlaylist += '">'+this.vlc.subtitles[oi]+'</li>';
        }
    } else oi = 1;

    itemSetting = this.itemDesc(this.currentItem()).setting;

    if (itemSetting.subtitles) {
        itemSubtitles = itemSetting.subtitles;
        for (var k in itemSubtitles) if (itemSubtitles.hasOwnProperty(k)) {
            generatePlaylist += '<li class="wcp-menu-item wcp-subtitles-item';
            if (oi == opts[this.context].currentSub) generatePlaylist += ' wcp-menu-selected';
            generatePlaylist += '">'+k+'</li>';
            oi++;
        }
    }

    playlistItems.html("");
    playlistItems.html(generatePlaylist);

    if (playlistItems.outerHeight() < (oi* parseInt(playlistItems.find(".wcp-subtitles-item").css("height")))) {
        playlistItems.css("cursor","pointer");
    } else playlistItems.css("cursor","default");

    this.find(".wcp-subtitles-item").click(function() {
        wjsPlayer = getContext(this);
        if ($(this).index() == 0) {
            wjsPlayer.vlc.subtitles.track = 0;
            clearSubtitles.call(wjsPlayer);
            wjsPlayer.notify("Subtitle Unloaded");
        } else if ($(this).index() < wjsPlayer.vlc.subtitles.count) {
            wjsPlayer.find(".wcp-subtitle-text").html("");
            opts[wjsPlayer.context].subtitles = [];
            wjsPlayer.vlc.subtitles.track = $(this).index();
            wjsPlayer.notify("Subtitle: "+wjsPlayer.subDesc($(this).index()).language);
        } else {
            wjsPlayer.find(".wcp-subtitle-text").html("");
            opts[wjsPlayer.context].subtitles = [];
            if (wjsPlayer.vlc.subtitles.track > 0) wjsPlayer.vlc.subtitles.track = 0;
            newSub = $(this).index() - wjsPlayer.vlc.subtitles.count;
            if (wjsPlayer.vlc.subtitles.count) newSub++;
            itemSubtitles = itemSetting.subtitles;
            for (var k in itemSubtitles) if (itemSubtitles.hasOwnProperty(k)) {
                newSub--;
                if (newSub == 0) {
                    loadSubtitle.call(wjsPlayer,itemSubtitles[k]);
                    wjsPlayer.notify("Subtitle: "+k);
                    break;
                }
            }
        }
        wjsPlayer.find(".wcp-subtitles").hide(0);
        opts[wjsPlayer.context].currentSub = $(this).index();
        opts[wjsPlayer.context].subDelay = 0;
    });

}

function clearSubtitles() {
    this.find(".wcp-subtitle-text").html("");
    opts[this.context].currentSub = 0;
    opts[this.context].subtitles = [];
    if (this.vlc.subtitles.track > 0) this.vlc.subtitles.track = 0;
    if (this.find(".wcp-subtitles").is(":visible")) printSubtitles.call(this);
}

function loadSubtitle(subtitleElement) {
    if (typeof opts[this.context].subtitles === "undefined") opts[this.context].subtitles = [];
    else if (opts[this.context].subtitles.length) opts[this.context].subtitles = [];

    wjsPlayer = this;

    var ext = subtitleElement.split('.').pop().toLowerCase();
    if (ext.indexOf("?") > -1) ext = ext.substr(0,ext.indexOf("?"));

    if (subtitleElement.startsWith("http://") || subtitleElement.startsWith("https://")) {
        request(subtitleElement, function (error, response, srt) {
            if (!error && response.statusCode == 200) processSub.call(wjsPlayer,srt,ext);
            else wjsPlayer.notify("Subtitle Error");
        });
    } else {
        fs.readFile(subtitleElement, function (err, srt) {
            console.log(srt.toString('utf8'));
            if (!err) processSub.call(wjsPlayer,srt.toString('utf8'),ext);
            else wjsPlayer.notify("SubtitleError");
        });
    }
}

function processSub(srt,extension) {
    opts[this.context].subtitles = [];

    if (extension == "srt" || extension == "vtt") {

        srt = strip(srt.replace(/\r\n|\r|\n/g, '\n'));

        var srty = srt.split('\n\n'),
            si = 0;

        if (srty[0].substr(0,6).toLowerCase() == "webvtt") si = 1;

        for (s = si; s < srty.length; s++) {
            var st = srty[s].split('\n');
            if (st.length >=2) {
                var n = -1;
                if (st[0].indexOf(' --> ') > -1) var n = 0;
                else if (st[1].indexOf(' --> ') > -1) var n = 1;
                else if (st[2].indexOf(' --> ') > -1)  var n = 2;
                else if (st[3].indexOf(' --> ') > -1)  var n = 3;
                if (n > -1) {
                    stOrigin = st[n]
                    var is = Math.round(toSeconds(strip(stOrigin.split(' --> ')[0])));
                    var os = Math.round(toSeconds(strip(stOrigin.split(' --> ')[1])));
                    var t = st[n+1];
                    if (st.length > n+2) for (j=n+2; j<st.length; j++) t = t + '\n'+st[j];
                    opts[this.context].subtitles[is] = {i:is, o: os, t: t};
                }
            }
        }
    } else if (extension == "sub") {
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
              if (is != 1 && os != 1) opts[this.context].subtitles[is] = {i:is, o: os, t: t};
            }
        }
    }
    opts[this.context].trackSub = -1;
}

function preventSleep() {
    powerSaveBlocker?(!sleepId||!powerSaveBlocker.isStarted(sleepId))?sleepId=powerSaveBlocker.start('prevent-display-sleep'):false:sleep.prevent();
}
function allowSleep() {
    powerSaveBlocker?powerSaveBlocker.isStarted(sleepId)?powerSaveBlocker.stop(sleepId):false:sleep.allow();
}
function getContext(el) {
    if ($(el).hasClass("webchimeras")) return players["#"+$(el).find(".wcp-wrapper")[0].id];
    else if ($(el).hasClass("wcp-wrapper")) return players["#"+el.id];
    else return players["#"+$(el).parents(".wcp-wrapper")[0].id];
}
function parseTime(t,total) {
    if (typeof total === 'undefined') total = t;
    tempHour = ("0" + Math.floor(t / 3600000)).slice(-2);
    tempMinute = ("0" + (Math.floor(t / 60000) %60)).slice(-2);
    tempSecond = ("0" + (Math.floor(t / 1000) %60)).slice(-2);
    if (total >= 3600000) return tempHour+":"+tempMinute+":"+tempSecond;
    else return tempMinute+":"+tempSecond;
}
function nl2br(str,is_xhtml) {
    breakTag=(is_xhtml||typeof is_xhtml==='undefined')?'<br />':'<br>';return (str+'').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g,'$1'+breakTag+'$2');
}
function calcFontSize(wjsPlayer) {
    if (wjsPlayer.wrapper.width() > 220 && wjsPlayer.wrapper.width() <= 982) {
        fontSize = ((wjsPlayer.wrapper.width() -220) /40) +9;
        if (fontSize < 16) fontSize = 16;
    } else if (wjsPlayer.wrapper.width() > 982 && wjsPlayer.wrapper.width() <= 1600) {
        fontSize = wjsPlayer.wrapper.height()/15;
        if (fontSize > 31) fontSize = 31;
    } else if (wjsPlayer.wrapper.width() > 1600) {
        fontSize = ((wjsPlayer.wrapper.width() - 1600) / 35.5) +31;
    } else fontSize = 20;
    return fontSize;
}
function toSeconds(t){s = 0.0;if(t){p=t.split(':');for(i=0;i<p.length;i++)s=s*60+parseFloat(p[i].replace(',', '.'))};return s}
function strip(s){return s.replace(/^\s+|\s+$/g,"")}
function gcd(a,b){if(b>a){temp=a;a=b;b=temp}while(b!=0){m=a%b;a=b;b=m;}return a}
function sel(context){return $($(this).parents(".wcp-wrapper")[0]).find(context)}
function switchClass(el,fclass,sclass){if(el.hasClass(fclass))el.removeClass(fclass).addClass(sclass)}
function hideSubtitles(){if(this.find(".wcp-subtitles").is(":visible"))this.find(".wcp-subtitles").hide(0)}
wjs.prototype.audioCount=function(){return this.vlc.audio.count}
wjs.prototype.itemCount=function(){return this.vlc.playlist.itemCount}
wjs.prototype.playing=function(){return this.vlc.playing}
wjs.prototype.length=function(){return this.vlc.length}
wjs.prototype.fps=function(){return this.vlc.input.fps}
wjs.prototype.width=function(){return this.canvas.width}
wjs.prototype.height=function(){return this.canvas.height}
wjs.prototype.stateInt=function(){return this.vlc.state}
wjs.prototype.find=function(el){return this.wrapper.find(el)}
wjs.prototype.onMediaChanged=function(wjsFunction){this.catchEvent("MediaChanged",wjsFunction);return this}
wjs.prototype.onIdle=function(wjsFunction){this.catchEvent("NothingSpecial",wjsFunction);return this}
wjs.prototype.onOpening=function(wjsFunction){this.catchEvent("Opening",wjsFunction);return this}
wjs.prototype.onBuffering=function(wjsFunction){this.catchEvent("Buffering",wjsFunction);return this}
wjs.prototype.onPlaying=function(wjsFunction){this.catchEvent("Playing",wjsFunction);return this}
wjs.prototype.onPaused=function(wjsFunction){this.catchEvent("Paused",wjsFunction);return this}
wjs.prototype.onForward=function(wjsFunction){this.catchEvent("Forward",wjsFunction);return this}
wjs.prototype.onBackward=function(wjsFunction){this.catchEvent("Backward",wjsFunction);return this}
wjs.prototype.onError=function(wjsFunction){this.catchEvent("EncounteredError",wjsFunction);return this}
wjs.prototype.onEnded=function(wjsFunction){this.catchEvent("EndReached",wjsFunction);return this}
wjs.prototype.onStopped=function(wjsFunction){this.catchEvent("Stopped",wjsFunction);return this}
wjs.prototype.onState=function(wjsFunction){vlcs[this.context].events.on('StateChanged',wjsFunction);return this}
wjs.prototype.onStateInt=function(wjsFunction){vlcs[this.context].events.on('StateChangedInt',wjsFunction);return this}
wjs.prototype.onTime=function(wjsFunction){this.catchEvent("TimeChanged",wjsFunction);return this}
wjs.prototype.onPosition=function(wjsFunction){this.catchEvent("PositionChanged",wjsFunction);return this}
wjs.prototype.onFrameSetup=function(wjsFunction){vlcs[this.context].events.on('FrameSetup',wjsFunction);return this}
wjs.prototype.onVolume=function(wjsFunction){vlcs[this.context].events.on('VolumeChange',wjsFunction);return this}
wjs.prototype.onFirstPlay=function(wjsFunction){vlcs[this.context].events.on('FirstPlay',wjsFunction);return this}
module.exports = wjs;
