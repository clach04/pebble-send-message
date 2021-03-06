module.exports = [
{
  "type": "section",
  "items": [
    {
      "type": "heading",
      "defaultValue": "Message 1 (Up)"
    },
    {
      "type": "input",
      "messageKey": "label1",
      "label": "Label",
      "description": "text to put against the watch button"
    },
    {
      "type": "input",
      "messageKey": "url1",
      "label": "URL",
      "description": "http://myserver.mydomain.com/path"
    },
    {
      "type": "input",
      "messageKey": "data1",
      "label": "Data",
      "description": "{'key1':'value1','key2':'value2',etc.}"
    },
    {
      "type": "input",
      "messageKey": "header1",
      "label": "Headers",
      "description": "header1|value1|header2|value2|etc."
    },
    {
      "type": "input",
      "messageKey": "confirm1",
      "label": "Confirm",
      "description": "text confirming success, e.g. 200"
    },
  ]
},
{
  "type": "section",
  "items": [
    {
      "type": "heading",
      "defaultValue": "Message 2 (Select)"
    },
    {
      "type": "input",
      "messageKey": "label2",
      "label": "Label",
      "description": "text to put against the watch button"
    },
    {
      "type": "input",
      "messageKey": "url2",
      "label": "URL",
      "description": "http://myserver.mydomain.com/path"
    },
    {
      "type": "input",
      "messageKey": "data2",
      "label": "Data",
      "description": "{'key1':'value1','key2':'value2',etc.}"
    },
    {
      "type": "input",
      "messageKey": "header2",
      "label": "Headers",
      "description": "header1|value1|header2|value2|etc."
    },
    {
      "type": "input",
      "messageKey": "confirm2",
      "label": "Confirm",
      "description": "text confirming success, e.g. 200"
    },
  ]
},
{
  "type": "section",
  "items": [
    {
      "type": "heading",
      "defaultValue": "Message 3 (Down)"
    },
    {
      "type": "input",
      "messageKey": "label3",
      "label": "Label",
      "description": "text to put against the watch button"
    },
    {
      "type": "input",
      "messageKey": "url3",
      "label": "URL",
      "description": "http://myserver.mydomain.com/path"
    },
    {
      "type": "input",
      "messageKey": "data3",
      "label": "Data",
      "description": "{'key1':'value1','key2':'value2',etc.}"
    },
    {
      "type": "input",
      "messageKey": "header3",
      "label": "Headers",
      "description": "header1|value1|header2|value2|etc."
    },
    {
      "type": "input",
      "messageKey": "confirm3",
      "label": "Confirm",
      "description": "text confirming success, e.g. 200"
    }
  ]
},
{
  "type": "section",
  "items": [
    {
      "type": "toggle",
      "messageKey": "quickgps",
      "label": "Quick GPS",
      "description": "single GPS read (faster but less accurate)"
    },
    {
      "type": "toggle",
      "messageKey": "displaymessage",
      "label": "Display message:",
      "description": "display the message (for debugging)"
    },
    {
      "type": "toggle",
      "messageKey": "displayresponse",
      "label": "Display response:",
      "description": "display the response (for debugging)"
    },
    {
      "type": "submit",
      "defaultValue": "Save"
    }  
  ]
}
];