// Disable console for production or comment this line out to enable it for debugging.
//console.log = function() {};

var Clay = require('pebble-clay');
var clayConfig = require('./config');

var initialized = false;
var myLat = 0;
var myLong = 0;
var locationWatcher;     // The Watcher that manages the readings from the GPS that are used to get a result to return to the watch.
var locationTimer;       // The Timer that gets a result at the end of the run of readings;
var firstOfRun;          // True for the first result in a run, which is old invalid data for some weird reason.
var sentToServer;         // True when a set of readings has finished and the result is going to be sent to the watch.
var samplingTimeOver = true;  // True when the sampling time is over and the next reading will be the last.
var locationOptions = {timeout: 4000, maximumAge: 0, enableHighAccuracy: true };
var myAccuracy, mySpeed, myHeading, myAltitude, myAltitudeAccuracy;  // Readings from the GPS.
// var setPebbleToken = "YNZX";
var errorMessage;           // Error code if the location isn't returned correctly.
var message;
var labels = ["0"];         // Labels for the buttons.
var urls = ["0"];           // Message URL for each button.
var datas = ["0"];          // Message data segment for each button.
var confirmations = ["0"];  // Message response confirmation string for each button.
var queries = ["0"];        // Number of dictated text queries for each button.
var usegps = ["0"];         // Tracks whether to call the GPS.
var texts = ["0"];          // Up to three text strings to be inserted into the message.
var headers = ["0"];        // Header information to send.
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
  clayConfig[i-1].items[1].defaultValue = labels[i];
  clayConfig[i-1].items[2].defaultValue = urls[i];
  clayConfig[i-1].items[3].defaultValue = datas[i];
  clayConfig[i-1].items[4].defaultValue = headers[i];
  clayConfig[i-1].items[5].defaultValue = confirmations[i];
}
var runtime = parseInt(localStorage.getItem("runtime")) || 5;        // How long to run the location watcher in seconds, or zero to do single reads;
clayConfig[3].items[0].defaultValue = (runtime === 0);

var displayMessage = (localStorage.getItem("displaymessage") == "1");  // Whether to display the message sent for debugging;
clayConfig[3].items[1].defaultValue = displayMessage;

var displayResponse = (localStorage.getItem("displayresponse") == "1");  // Whether to display the message sent for debugging;
clayConfig[3].items[2].defaultValue = displayResponse;

var clay = new Clay(clayConfig, null, { autoHandleEvents: false });

Pebble.addEventListener("ready", function(e) {
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
  console.log("JavaScript app ready and running! " + e.type, e.ready, " runtime="+runtime, navigator.userAgent);
  initialized = true;
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
//     var uri = "http://x.setpebble.com/" + setPebbleToken + "/" + Pebble.getAccountToken();
    var uri = clay.generateUrl();
    console.log("Configuration url: " + uri);
    Pebble.openURL(uri);
  }
);

Pebble.addEventListener("webviewclosed",
  function(e) {
    if (e && !e.response) {
      return;
    }
    var dictionary;
    var values = clay.getSettings(e.response, false);
    console.log("values = " + JSON.stringify(values));
    
    labels[1] = values.label1.value;
    urls[1] = values.url1.value;
    datas[1] = values.data1.value;
    headers[1] = values.header1.value;
    confirmations[1] = values.confirm1.value;
    var urlanddata = urls[1] + datas[1];
    queries[1] = (urlanddata.match(/~Txt/g) || []).length;
    usegps[1] = urlanddata.match(/~Lat/) || urlanddata.match(/~Lon/) || urlanddata.match(/~Acc/) || urlanddata.match(/~Spd/) || 
      urlanddata.match(/~Hed/) || urlanddata.match(/~Alt/) || urlanddata.match(/~Ala/) || urlanddata.match(/~Gmp/) || urlanddata.match(/~Adr/);
    
    labels[2] = values.label2.value;
    urls[2] = values.url2.value;
    datas[2] = values.data2.value;
    headers[2] = values.header2.value;
    confirmations[2] = values.confirm2.value;
    urlanddata = urls[2] + datas[2];
    queries[2] = (urlanddata.match(/~Txt/g) || []).length;
    usegps[2] = urlanddata.match(/~Lat/) || urlanddata.match(/~Lon/) || urlanddata.match(/~Acc/) || urlanddata.match(/~Spd/) || 
      urlanddata.match(/~Hed/) || urlanddata.match(/~Alt/) || urlanddata.match(/~Ala/) || urlanddata.match(/~Gmp/) || urlanddata.match(/~Adr/);
    
    labels[3] = values.label3.value;
    urls[3] = values.url3.value;
    datas[3] = values.data3.value;
    headers[3] = values.header3.value;
    confirmations[3] = values.confirm3.value;
    urlanddata = urls[3] + datas[3];
    queries[3] = (urlanddata.match(/~Txt/g) || []).length;
    usegps[3] = urlanddata.match(/~Lat/) || urlanddata.match(/~Lon/) || urlanddata.match(/~Acc/) || urlanddata.match(/~Spd/) || 
      urlanddata.match(/~Hed/) || urlanddata.match(/~Alt/) || urlanddata.match(/~Ala/) || urlanddata.match(/~Gmp/) || urlanddata.match(/~Adr/);
    
    for (var i=1; i<=3; i++) {
      console.log("Label " + i + " set to: " + labels[i]);
      localStorage.setItem("label"+i, labels[i]);
      console.log("URL " + i + " set to: " + urls[i]);
      localStorage.setItem("url"+i, urls[i]);
      console.log("Data " + i + " set to: " + datas[i]);
      localStorage.setItem("data"+i, datas[i]);
      console.log("Header " + i + " set to: " + headers[i]);
      localStorage.setItem("header"+i, headers[i]);
      console.log("Confirmation " + i + " set to: " + confirmations[i]);
      localStorage.setItem("confirmation"+i, confirmations[i]);
      console.log("Queries " + i + " set to: " + queries[i]);
    }
    
    runtime = values.quickgps.value ? 0 : 5;
    localStorage.setItem("runtime", runtime);
    console.log("Run time set to: " + runtime);

    displayMessage = values.displaymessage.value;
    localStorage.setItem("displaymessage", displayMessage ? 1 : 0);
    console.log("Display message set to: " + displayMessage);

    displayResponse = values.displayresponse.value;
    localStorage.setItem("displayResponse", displayResponse ? 1 : 0);
    console.log("Display response set to: " + displayResponse);

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
  var dictionary;
  switch(error.code) {
    case error.PERMISSION_DENIED:
      errorMessage  = "!Location\nrequest\ndenied" ;
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage  =  "!Location\ninformation\nunavailable";
      break;
    case error.TIMEOUT:
      errorMessage  = "!Location\nrequest\ntimeout";
      break;
    default:
      errorMessage  = "!Unknown\nlocation\nerror";
  }
  console.log("over=" + samplingTimeOver, "sent=" + sentToServer, "first=" + firstOfRun, "watcher=" + locationWatcher);
  console.warn('Location error ' + error.code + ': ' + error.message);
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
  var address, dictionary;
  
  if (usegps[message]) {
    if (myAccuracy < 999999) /* we have a valid location */ {
      
      // Send location back to watch.
      dictionary = {
        "msg" : (myLat>=0 ? myLat.toFixed(5)+"N" : (-myLat).toFixed(5)+"S") + "\n" + (myLong>=0 ? myLong.toFixed(5)+"E" : (-myLong).toFixed(5)+"W") + "\n\u00B1" + myAccuracy.toFixed(0) + "m"
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
    } else /* myAccuracy >= 999999, which means we didn't get a reading */ {
      dictionary = { "msg" : errorMessage };
      sendMessage(dictionary); 
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
  xhr.onload = function (response) { 
    console.log("Response is " + JSON.stringify(response)); 
    // Send message to watch to acknowledge servers receipt of message.
    dictionary = {
      "msg" : (confirmation.length === 0) ? "Message\nreceived\nby server." : ((confirmation[0] == "~") ? 
        (JSON.stringify((confirmation.length == 1) ? response : eval("response" + "." + confirmation.substr(1)))) :
        (JSON.stringify(response).indexOf(confirmation) >= 0 ? "Message\naccepted by\nserver." : "Message\nrejected by\nserver."))
    };
    if (dictionary.msg.length <= 30)
      sendMessage(dictionary); 
    else
      Pebble.showSimpleNotificationOnPebble("Result:", dictionary.msg);
    if (displayResponse) Pebble.showSimpleNotificationOnPebble("Response:", JSON.stringify(response));
  };
  xhr.open(type, url);
  for (var i=0; i < headerarray.length - 1; i+=2) {
    xhr.setRequestHeader(headerarray[i],headerarray[i+1]);
    console.log("Set header " + headerarray[i] + " to " + headerarray[i+1]);
  }
  xhr.send(data);
  console.log("Call made to server.");
  if (displayMessage) Pebble.showSimpleNotificationOnPebble("Sent " + type + ":", url + "\n" + data + "\n" + headerarray);
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

