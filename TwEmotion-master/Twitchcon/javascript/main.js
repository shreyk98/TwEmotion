
console.log("Hello");
var currentEmotion = "";
const opn = require('opn');
var request = require('request');
var screenshot = require('desktop-screenshot');
var fs = require('fs');
var atob = require('atob');
var Datauri = require('datauri');
var Blob = require('blob');
var util = require('util');
var fs = require('fs');
var player = require('play-sound') (opts = {});
opn('file:///Users/egetanboga/Documents/Developer/Twitchcon/index.html', function(err) {

 })
setTimeout(function () {
	processScreenshot();
}, 15000);

var emotionToSong =  { "anger" : "Songs/anger.mp3",  "contempt" : "Songs/contempt.mp3",
"disgust" : "Songs/disgust.mp3", "fear" : "Songs/fear.mp3",
"happiness" : "Songs/happy.mp3", "neutral" : "",
 "sadness" : "Song/sad.mp3", "surprise" : "Songs/surprise.mp3"
 }
// setInterval(function() {
// 	processScreenshot();
// }, 60000);





function binaryRead(file) {
    console.log("binaryRead()");
    var bitmap = fs.readFileSync(file);
    return new Buffer(bitmap.toString('binary'),'binary');
}

function processScreenshot(){
    screenshot("screenshot.png", function(error, complete){
        console.log("Screenshot succeeded");
        var AWS = require('aws-sdk');
        AWS.config.loadFromPath('config.json');
        var s3 = new AWS.S3();
        var s3Bucket = new AWS.S3({
            params: {
                Bucket: 'twitchbucket'
            }
        });

        var data = {
            'Body': binaryRead('screenshot.png'),
            'Bucket': 'twitchbucket',
            'Key': 'screenshot.png',
            'ContentDisposition': 'inline; filename=screenshot.png',
            'ContentType': 'image/png',
            'ACL': 'public-read'
        };
        s3Bucket.putObject(data, function(err, data){
            if (err){
                console.log('Error uploading data: ' + err);
            }else {
                console.log('Success uploading image');
                var urlParams = {
                    'Bucket': 'twitchbucket',
                    'Key': 'screenshot.png',
                };
                s3Bucket.getSignedUrl('getObject', urlParams, function(err, imgurl){
                    console.log(imgurl);
                    request({
                        method: 'POST',
                        url: 'https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize',
                        headers: {
                            'Content-Type': 'application/json',
                            'Ocp-Apim-Subscription-Key': '1cce9a923ab7433faaea8bbfca948dd8'
                        },
                        body: JSON.stringify({
                            "url": imgurl
                        })
                    }, function (error, response, body) {
                        console.log(response);
                        console.log(error);
                        console.log(response.statusCode);
                        if (!error && response.statusCode == 200) {
                            //console.log(body);
                            //console.log(util.inspect(response));
                            var object = JSON.parse(body);
							var objectScores = object[0].scores;
							console.log("BEFORE SCORES");
							console.log(objectScores);
							var emotionNames = Object.keys(objectScores);
							console.log(emotionNames);
							var vals = Object.keys(objectScores).map(function(key) {
								return objectScores[key];
							});
							console.log(vals);
							var maxValue = vals.reduce(function(a,b) {
								return Math.max(a,b);
							});
							console.log(maxValue);
							Object.prototype.getKeyByValue = function( value ) {
							    for( var prop in this ) {
							        if( this.hasOwnProperty( prop ) ) {
							             if( this[ prop ] === value )
							                 return prop;
							        }
							    }
							}
							currentEmotion = objectScores.getKeyByValue(maxValue)
							fs.writeFile("/", currentEmotion, function(err) {
								if(err) {
								return console.log(err);
								}

								console.log("The file was saved!");
								console.log(currentEmotion);
								player.play('emotionToSong[currentEmotion]', function(err){
									if (err) throw err;
									else {
										console.log("Music playing")
									}
								})
							});
                        }
                    });
                })
            }
        });
    });
}
