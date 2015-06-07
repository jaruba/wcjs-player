var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
 
var mainWindow = null;
 
 
// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
 
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600});
 
  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + __dirname + '/index.html');
 
  mainWindow.openDevTools({detach: true});
 
  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
 
});