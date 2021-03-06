// ==UserScript==
// @name       HF PM Push Notifications
// @author xadamxk
// @namespace  https://github.com/xadamxk/
// @version    1.0.2
// @description  Receive push notifications for PMs from HF.
// @require https://code.jquery.com/jquery-3.1.1.js
// @match      *://hackforums.net*
// @match      *://hackforums.net/*
// @copyright  2016+
// @iconURL https://raw.githubusercontent.com/xadamxk/HF-Userscripts/master/scripticon.jpg
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// ------------------------------ Change Log ----------------------------
// version 1.0.2: Compatible with V1 Beta
// version 1.0.1: Public Release
// version 1.0.0: Beta Release
// ==/UserScript==
// ------------------------------ Dev Notes -----------------------------
//
// ------------------------------ SETTINGS ------------------------------
// HF API Key (https://hackforums.net/apikey.php)
var apikey = "";
// Pushover API Token (https://pushover.net/api)
var pushoverAPIToken = "";
// Pushover UserKey (Purchase 1 time fee of $5 - https://pushover.net/clients)
var pushoverUserKey = "";
// Site
var siteAPI = "hackforums.net";
// Check interval
var interval = 1000 * 60 * 5; // 1000 milli * 60 secs * x = minutes (No lower than 5 or timeout!)
// ------------------------------ On Page ------------------------------
// Key used to store pm timestamps.
const GM_ValAddr = "datelineList"; // (Default: 'datelineList')
//GM_deleteValue(GM_ValAddr);
setInterval(function(){
$.ajax
({
    type: "GET",
    url: "https://"+siteAPI+"/api/v1/inbox",
    dataType: 'json',
    async: false,
    username: apikey,
    password: "",
    success: function (data){
        // Get list of pm ids
        $.each(data.result, function(pmID, item) {
            // If message is unread
            if($(this)[0].status == "0"){
                generateOutput($(this)[0].pmid,$(this)[0].dateline,$(this)[0].sender,$(this)[0].subject);
            }
        });

    }});
}, interval);
// ------------------------------ Functions ------------------------------
// Generate output info
function generateOutput(pmid,date,sender,subject){
    var existingRecord = false;
    var prevInfo = String(GM_getValue(GM_ValAddr, false)); // false if empty
    var datelineArray;
    if (!prevInfo){
    } else {
        if(prevInfo.includes(",")){
            datelineArray = prevInfo.trim().split(',');
        } else{
            datelineArray = prevInfo;
        }
        //console.log(datelineArray);
        for (var i = 0; i < datelineArray.length; i++) {
            if(datelineArray[i] == date.toString()){
                existingRecord = true;
                break;
            }
        }
    }
    // If not existing
    if (!existingRecord){
        // Add to list
        if (!prevInfo)
            GM_setValue(GM_ValAddr, date);
        else
            GM_setValue(GM_ValAddr, GM_getValue(GM_ValAddr) + "," + date);
        // Get username of uid
        var senderUsername;
        $.ajax({
            type: "GET",
            url: "https://"+siteAPI+"/api/v1/user/"+sender,
            dataType: 'json',
            async: false,
            username: apikey,
            password: "",
            success: function (data){
                // Username of sender
                senderUsername = data.result.username;
            }
        });
        // Send notification
        $.post("https://api.pushover.net/1/messages.json",
               {
            "token": pushoverAPIToken,
            "user": pushoverUserKey,
            "message": "From: "+senderUsername+".",
            "title": "New Mesage: "+subject,
            "url": "https://"+siteAPI+"/private.php?action=read&pmid="+pmid,
            "url_title": "Click to Open PM",
            "timestamp": date
        },
               function(data,status){
            if(debug){console.log("Notification Sent: "+ status);}
        });
    }
}
// Returns true if request fails
function isError(json){
    return json.success ? false : true;
}
// Sterilizes json obj
function steralizeJson(json){
    if(isJsonValid(json))
        return JSON.parse(json);
}
// Returns true if valid json
function isJsonValid(json){
    return JSON.parse(json) ? true : false;
}
// Epoch to Json Date http://stackoverflow.com/questions/4631928/convert-utc-epoch-to-local-date-with-javascript
function epochToJsDate(ts){
    // ts = epoch timestamp
    // returns date obj
    return new Date(ts*1000);
}