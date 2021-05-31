const fs = require('fs');
const path = require('path');
const syncRequest = require('sync-request');
var configFile;
try {
    configFile = JSON.parse(fs.readFileSync(__dirname + "/../cfg/config.inc.json"));
} catch(error) {
    console.log("[ERROR] - There was an error while loading config file at module " + path.parse(__filename)["base"]);
    process.exit();
}
module.exports.fileDownload = function(url) {
    //this will return the filename of the file saved
    var request = syncRequest("GET", url);
    if(request["statusCode"] != 200) {
        return -1;
    }
    fs.writeFileSync(configFile["storagePath"] + path.parse(url)["base"], request["body"]);
    return path.parse(url)["base"];
}
module.exports.telegramRetrieve = function(data) {
    //this is done mainly for organize a bit the code inside HCDrill for keep it as clean as possible
    var response = {};
    response["localName"] = this.fileDownload("https://api.telegram.org/file/bot" + configFile["botToken"] + "/" + data["file_path"]);
    //calculate the number of the newly received file
    response["fileNumber"] = parseInt(path.parse(data["file_path"])["name"].split("_")[1]);
    return response;
}
module.exports.jsonResponseParsing = function(jsonText, languageObject, layoutObject) {
    //ok so we are going to do this to save space on main JS file
    //the main goal of this function is to parse the JSON response in mooore readable text so we can throw it on Telegram
    let jsonObject;
    let jsonProperties;
    let response = layoutObject["header"] + "\r\n\r\n";
    //let response = "";
    try {
        jsonObject = JSON.parse(jsonText);
        jsonProperties = Object.keys(jsonObject);
    } catch(error) {
        console.log("[ERROR] - There was an error while parsing JSON text at module " + path.parse(__filename)["base"]);
    }
    //alright, here is the deal
    //languageObject = language file where we will extract the text/meaning of the keys in jsonObject
    //layoutObject = contains property separator, header and footer for the response message
    //jsonObject = json data with all the decrypted stuff and etc etc etc
    //jsonProperties = json properties with all of the keys of jsonObject, ex: payload, note1, sshAddress, etc
    //response = the response
    for(let c = 0; c < jsonProperties.length; c++) {
        if(languageObject["_" + jsonProperties[c]]) {
            if(jsonObject[jsonProperties[c]].length > 1) {
                response += layoutObject["propertyIndicator"] + " " + languageObject["_" + jsonProperties[c]] + "\r\n" + jsonObject[jsonProperties[c]] + "\r\n";
            }
        }
    }
    response += layoutObject["footer"];
    return response;
}