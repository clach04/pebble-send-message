// Disable console for production or comment this line out to enable it for debugging.
//console.log = function() {};

var initialized = false;
var runtime;             // How long to run the location watcher in seconds, or zero to do single reads;
var myLat = 0;
var myLong = 0;
var imperial = false;    // Default is metric measurements.
var locationWatcher;     // The Watcher that manages the readings from the GPS that are used to get a result to return to the watch.
var locationTimer;       // The Timer that gets a result at the end of the run of readings;
var firstOfRun;          // True for the first result in a run, which is old invalid data for some weird reason.
var sentToServer;         // True when a set of readings has finished and the result is going to be sent to the watch.
var samplingTimeOver = true;  // True when the sampling time is over and the next reading will be the last.
var locationOptions = {timeout: 4000, maximumAge: 0, enableHighAccuracy: true };
var myAccuracy, mySpeed, myHeading, myAltitude, myAltitudeAccuracy;  // Readings from the GPS.
var setPebbleToken = "YNZX";
var message;
var labels = ["0"];         // Labels for the buttons.
var urls = ["0"];           // Message URL for each button.
var datas = ["0"];          // Message data segment for each button.
var confirmations = ["0"];  // Message response confirmation string for each button.
var queries = ["0"];        // Number of dictated text queries for each button.
var usegps = ["0"];         // Tracks whether to call the GPS.
var texts = ["0"];          // Up to three text strings to be inserted into the message.
var headers = ["0"];        // Header information to send.

Pebble.addEventListener("ready", function(e) {
  labels[1] = localStorage.getItem("label1") || "Please";
  labels[2] = localStorage.getItem("label2") || "set";
  labels[3] = localStorage.getItem("label3") || "configuration";
  for (var i=1; i<=3; i++) {
    urls[i] = localStorage.getItem("url"+i) || "";
    datas[i] = localStorage.getItem("data"+i) || "";
    headers[i] = localStorage.getItem("header"+i) || "";
    confirmations[i] = localStorage.getItem("confirmation"+i) || "";
    queries[i] = ((urls[i] + datas[i]).match(/~Txt/g) || []).length;
    var temp = urls[i] + datas[i];
    usegps[i] = temp.match(/~Lat/) || temp.match(/~Lon/) || temp.match(/~Acc/) || temp.match(/~Spd/) || 
      temp.match(/~Hed/) || temp.match(/~Alt/) || temp.match(/~Ala/) || temp.match(/~Gmp/) || temp.match(/~Adr/);
   }
  runtime = parseInt(localStorage.getItem("runtime")) || 5;
  imperial = (parseInt(localStorage.getItem("imperial")) == 1);
  initialized = true;

  // Send labels to watch.
  var dictionary = {
    "label1" : labels[1],
    "label2" : labels[2],
    "label3" : labels[3],
    "queries1" : queries[1],
    "queries2" : queries[2],
    "queries3" : queries[3]
  };
  sendMessage(dictionary); 
  console.log("JavaScript app ready and running! " + e.type, e.ready, " runtime="+runtime, " imperial="+imperial, navigator.userAgent);
});

Pebble.addEventListener("appmessage",
  function(e) {
    console.log("Got a message: ", e, e.payload, e.payload.msg);
    if (e && e.payload && e.payload.msg) {
      message = e.payload.msg;
      texts[1] = e.payload.text1;
      texts[2] = e.payload.text2;
      texts[3] = e.payload.text3;
      console.log("Got command: " + message);
      if (usegps[message])
        getLocation();
      else
        sendToServer();  
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
    var dictionary;
    console.log("Webview window returned: " + JSON.stringify(options));
    for (var i=1; i<=3; i++) {
      labels[i] = options[6*i-5];
      console.log("Label " + i + " set to: " + labels[i]);
      localStorage.setItem("label"+i, labels[i]);
      urls[i] = options[6*i-4] + options[6*i-3] + options[6*i-2] + options[6*i-1];
      confirmations[i] = options[6*i];
      var lastDividerLocation = confirmations[i].lastIndexOf("|");
      if (lastDividerLocation >= 0) {
        urls[i] += confirmations[i].slice(0,lastDividerLocation);
        confirmations[i] = confirmations[i].slice(lastDividerLocation+1);
      }
      queries[i] = (urls[i].match(/~Txt/g) || []).length;
      usegps[i] = urls[i].match(/~Lat/) || urls[i].match(/~Lon/) || urls[i].match(/~Acc/) || urls[i].match(/~Spd/) || 
        urls[i].match(/~Hed/) || urls[i].match(/~Alt/) || urls[i].match(/~Ala/) || urls[i].match(/~Gmp/) || urls[i].match(/~Adr/);
      var openCurlyBracketLocation = urls[i].indexOf("{");
      var closeCurlyBracketLocation = urls[i].lastIndexOf("}");
      if (openCurlyBracketLocation < 0) /* no "{"" found, so we'll do a GET */ {
        datas[i] = "";
        if (closeCurlyBracketLocation < 0) /* no "}" found => no headers */ {
          headers[i] = "";
        } else /* "}" found */ {
          headers[i] = urls[i].substring(closeCurlyBracketLocation+1, urls[i].length);
          urls[i] = urls[i].substring(0, closeCurlyBracketLocation);
        }
      } else /* valid "{" found, so we'll do a POST */ {
        if (closeCurlyBracketLocation > openCurlyBracketLocation) {
          headers[i] = urls[i].substring(closeCurlyBracketLocation+1, urls[i].length);
          datas[i] = urls[i].substring(openCurlyBracketLocation, closeCurlyBracketLocation+1);
          urls[i] = urls[i].substring(0, openCurlyBracketLocation);
        } else /* no valid "}" found => error */ {
//        Indicate an invalid data segment.
          dictionary = { "msg" : '"{" with no matching "}" in message '+i };
          sendMessage(dictionary); 
        }
      }
      console.log("URL " + i + " set to: " + urls[i]);
      localStorage.setItem("url"+i, urls[i]);
      console.log("Data " + i + " set to: " + datas[i]);
      localStorage.setItem("data"+i, datas[i]);
      console.log("Header " + i + " set to: " + headers[i]);
      localStorage.setItem("hearder"+i, headers[i]);
      console.log("Confirmation " + i + " set to: " + confirmations[i]);
      localStorage.setItem("confirmation"+i, confirmations[i]);
      console.log("Queries " + i + " set to: " + queries[i]);
    }
    
//     imperial = (options["19"] === 1);
//     console.log("Units set to: " + (imperial ? "imperial" : "metric"));
//     localStorage.setItem("imperial", (imperial ? 1 : 0));
//     runtime = parseInt(options["20"] || 5);
//     console.log("RunTime set to: " + runtime);
//     localStorage.setItem("runtime", runtime);
    
//  Send labels to watch.
    dictionary = {
      "label1" : labels[1],
      "label2" : labels[2],
      "label3" : labels[3],
      "queries1" : queries[1],
      "queries2" : queries[2],
      "queries3" : queries[3]
    };
    sendMessage(dictionary); 
  }
);
                                                
function getLocation() {
//   if (!samplingTimeOver) sendToServer();
  myAccuracy = 999999;
  sentToServer = false;
  if (runtime === 0) {
    samplingTimeOver = true;
    firstOfRun = false;
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
  } else {  
    samplingTimeOver = false;
    firstOfRun = true;
    locationWatcher = navigator.geolocation.watchPosition(locationSuccess, locationError, locationOptions );
    locationTimer = setTimeout(function stopSampling() {samplingTimeOver = true; sendToServer();}, 1000*runtime );
  }
}

function locationSuccess(pos) {
  console.log("lat=" + pos.coords.latitude, "long=" + pos.coords.longitude, "accuracy=" + pos.coords.accuracy + " at " + pos.timestamp);
  console.log("over=" + samplingTimeOver, "sent=" + sentToServer, "first=" + firstOfRun, "watcher=" + locationWatcher);
  if (!firstOfRun) {   // First reads bring back old data so we avoid using them. //
    if (pos.coords.accuracy <= myAccuracy) {
      myAccuracy = pos.coords.accuracy;
      myLat = pos.coords.latitude;
      myLong = pos.coords.longitude;
      myAltitude = pos.coords.altitude;
      myAltitudeAccuracy = pos.coords.altitudeAccuracy;
      mySpeed = pos.coords.speed;
      myHeading = pos.coords.heading;
      if (myAccuracy < 6) samplingTimeOver = true;
      if (samplingTimeOver) sendToServer();
    } 
  }
  firstOfRun = false;
}

function locationError(error) {
  var dictionary = { "msg" : "Location error " + error.code + ": " + error.message };
  sendMessage(dictionary); 
  console.warn('!Location\nerror (' + error.code + '):\n' + error.message);
  if (samplingTimeOver) sendToServer();
}

function sendToServer() {
  navigator.geolocation.clearWatch(locationWatcher);
  clearTimeout(locationTimer);
  if (sentToServer) return;
  sentToServer = true;

  //  Build request for server.
  var label = labels[message];
  console.log("String 1 = " + texts[1]);
  console.log("String 2 = " + texts[2]);
  console.log("String 3 = " + texts[3]);

  var xhr = new XMLHttpRequest();
  var url = encodeURI(urls[message]);
  var data = datas[message];
  var address;
  
  if (usegps[message]) {
    if (myAccuracy < 999999) /* we have a valid location */ {
      
      // Send location back to watch.
      var dictionary = {
        "msg" : (myLat>=0 ? myLat.toFixed(5)+"N" : (-myLat).toFixed(5)+"S") +
          "\n" + (myLong>=0 ? myLong.toFixed(5)+"E" : (-myLong).toFixed(5)+"W") +
          "\n\u00B1" + myAccuracy.toFixed(0) + "m"
      };
      sendMessage(dictionary); 

      url = url.replace(/~Lat/g,myLat.toFixed(5));
      url = url.replace(/~Lon/g,myLong.toFixed(5));
      url = url.replace(/~Acc/g,myAccuracy.toFixed(0));
      try {url = url.replace(/~Spd/g,mySpeed.toFixed(0));} catch(err) {url = url.replace(/~Spd/g,"-1");}
      try {url = url.replace(/~Hed/g,myHeading.toFixed(0));} catch(err) {url = url.replace(/~Hed/g,"-1");}
      try {url = url.replace(/~Alt/g,myAltitude.toFixed(0));} catch(err) {url = url.replace(/~Alt/g,"-1");}
      try {url = url.replace(/~Ala/g,myAltitudeAccuracy.toFixed(0));} catch(err) {url = url.replace(/~Ala/g,"-1");}
      url = url.replace(/~Gmp/g,"https%3A%2F%2Fwww.google.com%2Fmaps%3Fq%3Dloc%3A" + myLat.toFixed(5) + "%2C" + myLong.toFixed(5));

      if ((url+data).indexOf("~Adr") >= 0) {
        xhr.open("GET", "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + myLat.toFixed(5) + "," + myLong.toFixed(5), false);
        xhr.send();
        address = JSON.parse(xhr.responseText).results[0].formatted_address;
        console.log("Address = " + address);
        // Send message to watch to show address.
        dictionary = { "msg" : address };
        sendMessage(dictionary); 
        url = url.replace(/~Adr/g, encodeURIComponent(address));
      }
    }
  }
  
  url = url.replace(/~Lbl/g,encodeURIComponent(label));
  url = url.replace("~Txt",encodeURIComponent(texts[1]));
  url = url.replace("~Txt",encodeURIComponent(texts[2]));
  url = url.replace("~Txt",encodeURIComponent(texts[3]));
  
  var type;

  if (data === "")
    type = "GET";
  else {
    type = "POST";
    if ((usegps[message]) && (myAccuracy < 999999)) {
      data = data.replace(/~Lat/g,myLat.toFixed(5));
      data = data.replace(/~Lon/g,myLong.toFixed(5));
      data = data.replace(/~Acc/g,myAccuracy.toFixed(0));
      try {data = data.replace(/~Spd/g,mySpeed.toFixed(0));} catch(err) {data = data.replace(/~Spd/g,"-1");}
      try {data = data.replace(/~Hed/g,myHeading.toFixed(0));} catch(err) {data = data.replace(/~Hed/g,"-1");}
      try {data = data.replace(/~Alt/g,myAltitude.toFixed(0));} catch(err) {data = data.replace(/~Alt/g,"-1");}
      try {data = data.replace(/~Ala/g,myAltitudeAccuracy.toFixed(0));} catch(err) {data = data.replace(/~Ala/g,"-1");}
      data = data.replace(/~Gmp/g,"https://www.google.com/maps?q=loc:" + myLat.toFixed(5) + "," + myLong.toFixed(5));
      data = data.replace(/~Adr/g, address);
    }
    
    data = data.replace(/~Lbl/g, label);
    data = data.replace("~Txt", texts[1]);
    data = data.replace("~Txt", texts[2]);
    data = data.replace("~Txt", texts[3]);
  }
  
  var headerarray = headers[message].split("|");
  var confirmation = confirmations[message];

  console.log("url = " + url);
  console.log("type= " + type);
  console.log("data= " + data);
  console.log("headers= " + headerarray);
  console.log("confirmation= " + confirmation);
  
  // Send request.
  xhr.onload = function (result) { 
    console.log("Response is " + JSON.stringify(result)); 
    // Send message to watch to acknowledge servers receipt of message.
    dictionary = {
      "msg" : (confirmation.length === 0) ? "Message\nreceived\nby server." : ((confirmation[0] == "~") ? 
        (JSON.stringify((confirmation.length == 1) ? result : eval("result" + "." + confirmation.substr(1)))).substr(0,128) :
        (JSON.stringify(result).indexOf(confirmation) >= 0 ? "Message\naccepted by\nserver." : "Message\nrejected by\nserver."))
    };
  sendMessage(dictionary); 
  };
  xhr.open(type, url);
  for (var i=0; i < headerarray.length - 1; i+=2) {
    xhr.setRequestHeader(headerarray[i],headerarray[i+1]);
    console.log("Set header " + headerarray[i] + " to " + headerarray[i+1]);
  }
//  Was
//   for (var i=0; i < (headerarray.length - 1) / 2; i++) {
//     xhr.setRequestHeader(headerarray[2*i],headerarray[2*i+1]);
//     console.log("Set header " + headerarray[2*i] + " to " + headerarray[2*i+1]);
//   }
  xhr.send(data);
  console.log("Call made to server.");
}  

function sendMessage(dict) {
  Pebble.sendAppMessage(dict, appMessageAck, appMessageNack);
  console.log("Sent message to Pebble! " + JSON.stringify(dict));
}

function appMessageAck(e) {
  console.log("Message accepted by Pebble!");
}

function appMessageNack(e) {
  console.log("Message rejected by Pebble! " + e.data.error.message);
}

