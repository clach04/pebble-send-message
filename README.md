# Send Message

GPS-aware and dictation (or tertiary text input) -enabled HTTP client supporting GET and POST requests, request header configuration and server response verification or display.

Can be used for sending text messages or lots of other things when paired with an appropriate web service.

Allows configuration with three sets of label, URL to call, JSON data segment (if using POST), request headers and string to check for in the response to verify that the server accepted the message or a field from the response to display on the watch.

In the URL and data, `~Lat` will be replaced with the latitude, `~Lon` with the longitude, `~Acc` with the accuracy, `~Alt` with the altitude, `~Spd` with the speed, `~Hed` with the heading, `~Lbl` with the label text, `~Adr` with your street address, `~Gmp` with a URL to your location on Google maps and `~Txt` with your dictated (or entered) text (several times if necessary, in which case you will be prompted up to three times).

If you don't have a server of your own, you can use one of the many public SMS-sending services to send text messages for you, e.g.

http://www.smsglobal.com/http-api.php?action=sendsms&user=&password=&from=Peter&to=61456789123&text=~Lbl at ~Adr (see ~Gmp)

or to send the label text and location to a predefined number;

http://www.smsglobal.com/http-api.php?action=sendsms&user=&password=&from=Peter&to=61456789123&text=~Txt at ~Adr (see ~Gmp);

or (to send a message that you dictate to a number that you dictate)

http://www.smsglobal.com/http-api.php?action=sendsms&user=&password=&from=Peter&text=~Txt&to=~Txt.

If you specify a confirmation string starting with `~`, the watch will display this field when the response is received from the server, otherwise the watch will simply tell you whether the confirmation string was found in the response.

There's an option on the configuration screen to do a quick read of the GPS – this may be less accurate and can returns old results from iPhones so it defaults to off.

There are two options in the configuration to display the final message (with any substitutions) and the server response as notifications for debugging purposes.  Cloudpebble.net may also help you in debugging your setup. If you want to use it, either load my source code or create a single c file with the lines:

    #include

    int main(void) {
    app_event_loop();
    }

then use it to view the app logs while the Send Message app runs.

This app is provided as is - you are responsible for testing this app thoroughly and determining whether it works appropriately and meets your needs. The source code is available if you want to examine how it works or customize it.

If you find it useful, please give it a heart.

Updated 24 Sep 2016
