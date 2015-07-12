# Prevent computer or display sleep with HTML5/JavaScript

Include the `sleep.js` script in your page, then control the computer's sleep functionality by calling:

     sleep.prevent()
     sleep.allow()

Take a look at the `example.html` file to see it in action.

## Limitations

Tested on 2015-01-01 on Mac OS X Yosemite (10.10.1) with Chrome 39.0.2171.95, Firefox 34.0.5, Safari 8.0.2.

This table explains the ability of the script to prevent sleep in different scenarios.

                               |IE |Chrome|Firefox|Safari
-------------------------------|:-:|:----:|:-----:|:----:
If is selected tab             |?  |Yes   |Yes    |No    
If is not selected tab         |?  |No    |Yes    |No    
If browser isn't in foreground |?  |Yes   |Yes    |No    

## How does it work?

This approach uses a small empty video that is inserted in the page, but off-screen, without sound, but importantly: with an audio track.

This hack in reality controls the video playback which is what makes the browser stay awake.

## Troubleshooting

The video files are at these locations; make sure they are accessible:

[https://github.com/ivanmaeder/computer-sleep/raw/master/resources/muted-blank.mp4](https://github.com/ivanmaeder/computer-sleep/raw/master/resources/muted-blank.mp4)

[https://github.com/ivanmaeder/computer-sleep/raw/master/resources/muted-blank.ogv](https://github.com/ivanmaeder/computer-sleep/raw/master/resources/muted-blank.ogv)

Check that your browser supports these video formats.

Check that your browser normally stays awake when playing video.

## References:

[http://stackoverflow.com/questions/10377453/play-infinitely-looping-video-on-load-in-html5](http://stackoverflow.com/questions/10377453/play-infinitely-looping-video-on-load-in-html5)

[http://stackoverflow.com/questions/26896400/how-to-allow-system-sleep-on-non-fullscreen-html5-video](http://stackoverflow.com/questions/26896400/how-to-allow-system-sleep-on-non-fullscreen-html5-video)

[https://productforums.google.com/forum/#!msg/youtube/C72RHsRYDpo/XE15rBP3gZUJ](https://productforums.google.com/forum/#!msg/youtube/C72RHsRYDpo/XE15rBP3gZUJ)