// Disable console for production or comment this line out to enable it for debugging.
//console.log = function() {};

var initialized = false;
var runtime;             // If not running continuously, how long to run the location watcher in seconds, or zero to do single reads;
var myLat = 0;
var myLong = 0;
var imperial = false;    // Default is metric measurements.
var locationWatcher;     // The Watcher that manages the readings from the GPS that are used to get a result to return to the watch.
var locationTimer;       // The Timer that gets a result at the end of the run of readings;
var firstOfRun;          // True for the first result in a run, which is old invalid data for some weird reason.
// var sentToWatch;         // True when a set of readings has finished and the result is going to be sent to the watch.
// var samplingTimeOver = true;  // True when the sampling time is over and the next reading will be the last.
var locationOptions = {timeout: 9000, maximumAge: 0, enableHighAccuracy: true };
var myAccuracy, mySpeed, myHeading, myAltitude, myAltitudeAccuracy;  // Readings from the GPS.
var setPebbleToken = "YNZX";
var message;
var labels = ["0"];
var urls = ["0"];
var datas = ["0"];
var confirmations = ["0"];

Pebble.addEventListener("ready", function(e) {
  labels[1] = localStorage.getItem("label1") || "Please        ";
  labels[2] = localStorage.getItem("label2") || "set           ";
  labels[3] = localStorage.getItem("label3") || "configuration.";
  urls[1] = localStorage.getItem("url1") || "";
  urls[2] = localStorage.getItem("url2") || "";
  urls[3] = localStorage.getItem("url3") || "";
  datas[1] = localStorage.getItem("data1") || "";
  datas[2] = localStorage.getItem("data2") || "";
  datas[3] = localStorage.getItem("data3") || "";
  confirmations[1] = localStorage.getItem("confirmation1") || "";
  confirmations[2] = localStorage.getItem("confirmation2") || "";
  confirmations[3] = localStorage.getItem("confirmation3") || "";
  runtime = parseInt(localStorage.getItem("runtime")) || 5;
  imperial = (parseInt(localStorage.getItem("imperial")) == 1);
  initialized = true;

  // Send labels to watch.
  var dictionary = {
   "label1" : labels[1],
   "label2" : labels[2],
   "label3" : labels[3]
  };
  var transactionID = Pebble.sendAppMessage( dictionary,
    function(e) { console.log('Labels sent to Pebble successfully! ' + e.data.transactionId); },
    function(e) { console.log('Error sending labels to Pebble! ' + e.data.transactionId + ' Error is: ' + e.error.message); } ); 

  console.log("JavaScript app ready and running! " + e.type, e.ready, " runtime="+runtime, " imperial="+imperial);
});

Pebble.addEventListener("appmessage",
  function(e) {
    console.log("Got a message: ", e, e.payload, e.payload.msg);
    if (e && e.payload && e.payload.msg) {
      message = e.payload.msg;
      console.log("Got command: " + message);
      getLocation();
    }
  }
);

Pebble.addEventListener("showConfiguration",
  function() {
    var uri = "http://x.setpebble.com/" + setPebbleToken + "/" + Pebble.getAccountToken();
    console.log("Configuration url: " + uri);
    Pebble.openURL(uri);
  }
);

Pebble.addEventListener("webviewclosed",
  function(e) {
    var options = JSON.parse(decodeURIComponent(e.response));
    console.log("Webview window returned: " + JSON.stringify(options));
    labels[1] = options["1"];
    console.log("Label 1 set to: " + labels[1]);
    localStorage.setItem("label1", labels[1]);
    urls[1] = options["2"] + options["3"] + options["4"] + options["5"];
    var firstCurlyBracketLocation = urls[1].indexOf("{");
    if (firstCurlyBracketLocation < 0) 
      datas[1] = "";
    else {
      datas[1] = urls[1].substring(firstCurlyBracketLocation, urls[1].length);
      urls[1] = urls[1].substring(0, firstCurlyBracketLocation);
    }
    confirmations[1] = options["6"];
    console.log("URL 1 set to: " + urls[1]);
    localStorage.setItem("url1", urls[1]);
    console.log("Data 1 set to: " + datas[1]);
    localStorage.setItem("data1", datas[1]);
    console.log("Confirmation 1 set to: " + confirmations[1]);
    localStorage.setItem("confirmation1", confirmations[1]);
    
    labels[2] = options["7"];
    console.log("Label 2 set to: " + labels[2]);
    localStorage.setItem("label2", labels[2]);
    urls[2] = options["8"] + options["9"] + options["10"] + options["11"];
    firstCurlyBracketLocation = urls[2].indexOf("{");
    if (firstCurlyBracketLocation < 0) 
      datas[2] = "";
    else {
      datas[2] = urls[2].substring(firstCurlyBracketLocation, urls[2].length);
      urls[2] = urls[2].substring(0, firstCurlyBracketLocation);
    }
    confirmations[2] = options["12"];
    console.log("URL 2 set to: " + urls[2]);
    localStorage.setItem("url2", urls[2]);
    console.log("Data 2 set to: " + datas[2]);
    localStorage.setItem("data2", datas[2]); 
    console.log("Confirmation 2 set to: " + confirmations[2]);
    localStorage.setItem("confirmation2", confirmations[2]);
    
    labels[3] = options["13"];
    console.log("Label 3 set to: " + labels[3]);
    localStorage.setItem("label3", labels[3]);
    urls[3] = options["14"] + options["15"] + options["16"] + options["17"];
    firstCurlyBracketLocation = urls[3].indexOf("{");
    if (firstCurlyBracketLocation < 0) 
      datas[3] = "";
    else {
      datas[3] = urls[3].substring(firstCurlyBracketLocation, urls[3].length);
      urls[3] = urls[3].substring(0, firstCurlyBracketLocation);
    }
    confirmations[3] = options["18"];
    console.log("URL 3 set to: " + urls[3]);
    localStorage.setItem("url3", urls[3]);
    console.log("Data 3 set to: " + datas[3]);
    localStorage.setItem("data3", datas[3]);
    console.log("Confirmation 3 set to: " + confirmations[3]);
    localStorage.setItem("confirmation3", confirmations[3]);
    
//     imperial = (options["19"] === 1);
//     console.log("Units set to: " + (imperial ? "imperial" : "metric"));
//     localStorage.setItem("imperial", (imperial ? 1 : 0));
//     runtime = parseInt(options["20"] || 5);
//     console.log("RunTime set to: " + runtime);
//     localStorage.setItem("runtime", runtime);
    
//  Send labels to watch.
    var dictionary = {
      "label1" : labels[1],
      "label2" : labels[2],
      "label3" : labels[3]
    };
  var transactionID = Pebble.sendAppMessage( dictionary,
    function(e) { console.log('Server response acknowledgement sent to Pebble successfully! ' + e.data.transactionId); },
    function(e) { console.log('Error sending server response acknowledgement to Pebble! ' + e.data.transactionId + ' Error is: ' + e.error.message); } ); 
  }
);
                                                
function sendMessage(dict) {
  Pebble.sendAppMessage(dict, appMessageAck, appMessageNack);
  console.log("Sent message to Pebble! " + JSON.stringify(dict));
}

function appMessageAck(e) {
  console.log("Message accepted by Pebble!");
}

function appMessageNack(e) {
  console.log("Message rejected by Pebble! " + e.error);
}

function getLocation() {
  if (runtime > 0) {  
    firstOfRun = true;
    myAccuracy = 999999;
    locationWatcher = navigator.geolocation.watchPosition(locationSuccess, locationError, locationOptions);
    console.log("Running locationWatcher " + locationWatcher + " for " + runtime + " seconds.");
    locationTimer = setTimeout(sendMessage, 1000*runtime);
  } else /* runtime = 0 */ {
    firstOfRun = false;
    console.log("Calling getCurrentPosition.");
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
  }
}

function locationSuccess(pos) {
  console.log("Processing a successful GPS reading: lat=" + pos.coords.latitude, "long=" + pos.coords.longitude, "accuracy=" + pos.coords.accuracy + " at " + (pos.timestamp/1000).toFixed(2));
  console.log("first=" + firstOfRun, "watcher=" + locationWatcher);
  if (runtime > 0) {
    if (!firstOfRun) {   // First of a run reads can bring back old data so we avoid using them.
      if (pos.coords.accuracy <= myAccuracy) {
        myAccuracy = pos.coords.accuracy;
        myLat = pos.coords.latitude;
        myLong = pos.coords.longitude;
        mySpeed = pos.coords.speed;
        myHeading = pos.coords.heading;
        myAltitude = pos.coords.altitude;
        myAltitudeAccuracy = pos.coords.altitudeAccuracy;
      } 
    }
    firstOfRun = false;
  } else {               // Runtime = 0, i.e. a one-off read.
    myAccuracy = pos.coords.accuracy;
    myLat = pos.coords.latitude;
    myLong = pos.coords.longitude;
    mySpeed = pos.coords.speed;
    myHeading = pos.coords.heading;
    myAltitude = pos.coords.altitude;
    myAltitudeAccuracy = pos.coords.altitudeAccuracy;
    sendMessage();
  }
}

function sendMessage() {
  if (runtime > 0) navigator.geolocation.clearWatch(locationWatcher);
  
  // Send location back to watch.
  var dictionary = {
    "msg" : (myLat>=0 ? myLat.toFixed(5)+"N" : (-myLat).toFixed(5)+"S") +
      "\n" + (myLong>=0 ? myLong.toFixed(5)+"E" : (-myLong).toFixed(5)+"W") +
      "\n\u00B1" + myAccuracy.toFixed(0) + "m"
  };
  var transactionID = Pebble.sendAppMessage( dictionary,
    function(e) { console.log('Location sent to Pebble successfully! ' + e.data.transactionId); },
    function(e) { console.log('Error sending location info to Pebble! ' + e.data.transactionId + ' Error is: ' + e.error.message); } ); 
  
//  Build request for server.
  
  var label = labels[message];

  var url = encodeURI(urls[message]);
  url = url.replace(/~Lat/g,myLat.toFixed(5));
  url = url.replace(/~Lon/g,myLong.toFixed(5));
  url = url.replace(/~Acc/g,myAccuracy.toFixed(0));
  try {url = url.replace(/~Spd/g,mySpeed.toFixed(0));} catch(err) {url = url.replace(/~Spd/g,"-1");}
  try {url = url.replace(/~Hed/g,myHeading.toFixed(0));} catch(err) {url = url.replace(/~Hed/g,"-1");}
  try {url = url.replace(/~Alt/g,myAltitude.toFixed(0));} catch(err) {url = url.replace(/~Alt/g,"-1");}
  try {url = url.replace(/~Ala/g,myAltitudeAccuracy.toFixed(0));} catch(err) {url = url.replace(/~Ala/g,"-1");}
  url = url.replace(/~Gmp/g,"https%3A%2F%2Fwww.google.com%2Fmaps%3Fq%3Dloc%3A" + myLat.toFixed(5) + "%2C" + myLong.toFixed(5));
  url = url.replace(/~Lbl/g,encodeURIComponent(label));
  
  var data = datas[message];
  var type;
  if (data === "")
    type = "GET";
  else {
    type = "POST";
    data = data.replace(/~Lat/g,myLat.toFixed(5));
    data = data.replace(/~Lon/g,myLong.toFixed(5));
    data = data.replace(/~Acc/g,myAccuracy.toFixed(0));
    try {data = data.replace(/~Spd/g,mySpeed.toFixed(0));} catch(err) {data = data.replace(/~Spd/g,"-1");}
    try {data = data.replace(/~Hed/g,myHeading.toFixed(0));} catch(err) {data = data.replace(/~Hed/g,"-1");}
    try {data = data.replace(/~Alt/g,myAltitude.toFixed(0));} catch(err) {data = data.replace(/~Alt/g,"-1");}
    try {data = data.replace(/~Ala/g,myAltitudeAccuracy.toFixed(0));} catch(err) {data = data.replace(/~Ala/g,"-1");}
    data = data.replace(/~Gmp/g,"https://www.google.com/maps?q=loc:" + myLat.toFixed(5) + "," + myLong.toFixed(5));
    data = data.replace(/~Lbl/g, label);
  }
  
  var confirmation = confirmations[message];
  
  console.log("url = " + url);
  console.log("type= " + type);
  console.log("data= " + data);
  console.log("confirmation= " + confirmation);
  
  // Send request.
  var xhr = new XMLHttpRequest();
  xhr.onload = function (result) { 
    console.log("Response is " + JSON.stringify(result)); 
    // Send message to watch to acknowledge servers receipt of message.
    var dictionary = {
      "msg" : (JSON.stringify(result).indexOf(confirmation) >= 0 ? "Message\naccepted by\nserver." : "Message\nrejected by\nserver.")
    };
    var transactionID = Pebble.sendAppMessage( dictionary,
      function(e) { console.log('Server response acknowledgement sent to Pebble successfully! ' + e.data.transactionId); },
      function(e) { console.log('Error sending server response acknowledgement to Pebble! ' + e.data.transactionId + ' Error is: ' + e.error.message); } ); 
  };
  xhr.open(type, url);
  xhr.send(data);
}  

function locationError(error) {
  console.warn('Location error (' + error.code + '): ' + error.message);
}
