/*
* slipkDecryptor module
* Description: This covers all encryption scheme related to SocksHTTP and their mods
* Author: PANCHO7532
*/
const metadata = {
    "title":"slipkDecryptor",
    "author":"PANCHO7532",
    "version":2,
    "schemeLength":1
}
const crypto = require('crypto');
const fs = require('fs');
const xmlparser = require('fast-xml-parser');
const htmlentities = require('html-entities').XmlEntities;
const xmlent = new htmlentities();
module.exports.metadata = metadata;
function pbkdf2Derivate(data, salt) {
    return crypto.pbkdf2Sync(data, Buffer.from(salt, "base64"), 1000, 16, "sha256") //returns buffer
}
function aesDecrypt(data, password, iv, mac) {
    /*
    * data = base64 encoded data
    * password = buffered password from pbkdf2 functions
    * iv = buffered data with the iv
    * mac = mac tag extracted from the actual data functions
    */
    var aesgcm = crypto.createDecipheriv("aes-128-gcm", password, iv);
    aesgcm.setAuthTag(mac);
    var result = aesgcm.update(data, "base64", "utf-8");
    result += aesgcm.final("utf-8");
    return result;
}
function parseDecoded(data) {
    //here we will parse from xml to almost readable json i guess
    const xmlparserOpts = {
        ignoreAttributes: false,
        allowBooleanAttributes: true
    };
    const parsedContent = xmlparser.parse(data, xmlparserOpts)["properties"]["entry"];
    var json = {};
    for(let c = 0; c < parsedContent.length; c++) {
        switch(parsedContent[c]["@_key"]) {
            case "sshUser":
                json["sshUser"] = parsedContent[c]["#text"];
                break;
            case "sslProtocol":
                json["sslProtocol"] = parsedContent[c]["#text"];
                break;
            case "sshServer":
                json["sshServer"] = parsedContent[c]["#text"];
                break;
            case "sshPass":
                json["sshPassword"] = parsedContent[c]["#text"];
                break;
            case "targetIdHardware":
                json["hwidValue"] = parsedContent[c]["#text"];
                break;
            case "isCustomPayload":
                json["customPayload"] = parsedContent[c]["#text"];
                break;
            case "proxyPasswd":
                json["proxyPassword"] = parsedContent[c]["#text"];
                break;
            case "proxyUser":
                json["proxyUser"] = parsedContent[c]["#text"];
                break;
            case "bloquearRoot":
                json["blockedRoot"] = parsedContent[c]["#text"];
                break;
            case "sshPortaLocal":
                json["localSSHPort"] = parsedContent[c]["#text"];
                break;
            case "tunnelType":
                json["tunnelType"] = parsedContent[c]["#text"];
                break;
            case "dnsResolver":
                json["primaryDNS"] = parsedContent[c]["#text"];
                break;
            case "file.pedirLogin":
                json["file_login"] = parsedContent[c]["#text"];
                break;
            case "dnsResolverSecondary":
                json["secondaryDNS"] = parsedContent[c]["#text"];
                break;
            case "sshPort":
                json["sshPort"] = parsedContent[c]["#text"];
                break;
            case "udpResolver":
                json["udpgwPort"] = parsedContent[c]["#text"];
                break;
            case "permitirApenasRedeMovel":
                json["mobileData"] = parsedContent[c]["#text"];
                break;
            case "file.proteger":
                json["lockPayloadAndServers"] = parsedContent[c]["#text"];
                break;
            case "file.appVersionCode":
                json["appVersion"] = parsedContent[c]["#text"];
                break;
            case "usarProxyAutenticacao":
                json["useProxyAuth"] = parsedContent[c]["#text"];
                break;
            case "proxyRemoto":
                json["proxyAddress"] = parsedContent[c]["#text"];
                break;
            case "dnsForward":
                json["dnsForward"] = parsedContent[c]["#text"];
                break;
            case "sshKeyPublic":
                json["publicSSHKey"] = parsedContent[c]["#text"];
                break;
            case "proxyRemotoPorta":
                json["proxyPort"] = parsedContent[c]["#text"];
                break;
            case "file.msg":
                json["note1"] = xmlent.decode(parsedContent[c]["#text"]);
                break;
            case "proxyPayload":
                json["payload"] = xmlent.decode(parsedContent[c]["#text"]);
                break;
            case "udpForward":
                json["udpForward"] = parsedContent[c]["#text"];
                break;
            case "blockTorrent":
                json["blockTorrent"] = parsedContent[c]["#text"];
                break;
            case "file.validade":
                if(parsedContent[c]["#text"] == 0) {
                    json["expireDate"] = "lifeTime";
                    break;
                } else {
                    json["expireDate"] = new Date(parsedContent[c]["#text"]).toUTCString();
                }
                break;
            case "hostSniSSL":
                json["sniValue"] = parsedContent[c]["#text"];
                break;
            case "sniStr":
                json["sniValue"] = parsedContent[c]["#text"];
                break;
            case "SNI":
                //hi
                json["sniValue"] = parsedContent[c]["#text"];
                break;
        }
    }
    //my attempt on parsing ssh host/port user:pass combo into one readable HTTP Custom string
    json["sshAddr"] = json["sshServer"] + ":" + json["sshPort"] + "@" + json["sshUser"] + ":" + json["sshPassword"];
    if(!!json["proxyUser"] && !!json["proxyPassword"]) {
        json["proxyURL"] = json["proxyAddress"] + ":" + json["proxyPort"] + "@" + json["proxyUser"] + ":" + json["proxyPassword"];
    } else if(!!json["proxyPort"] && !!json["proxyAddress"]){
        json["proxyURL"] = json["proxyAddress"] + ":" + json["proxyPort"];
    }
    //json["raw"] = data;
    return JSON.stringify(json);
}
function decryptStage(filecontent, configFile) {
    //here is where the fun begins lol
    var keyFile;
    var complete = false;
    var response = {};
    var fileArr;
    response["content"] = "";
    response["raw"] = "";
    response["error"] = 0;
    try {
        fileArr = filecontent.toString().split(".");
        if(fileArr.length != 3) {
            throw "Non-Valid File: OOB";
        }
    } catch(error) {
        response["error"] = 1;
        return response;  
    }
    //preparing file
    var preData = Buffer.from(fileArr[2], "base64")
    var data = preData.slice(0, preData.length-16).toString("base64");
    var iv = Buffer.from(fileArr[1], "base64");
    var mac = preData.slice(-16);
    try {
        keyFile = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["slipk"];
    } catch(error) {
        response["error"] = error;
        return response;
    }
    for(let c = 0; c < keyFile.length; c++) {
        var password = pbkdf2Derivate(Buffer.from(keyFile[c]), Buffer.from(fileArr[0], "base64"));
        try {
            response["content"] = aesDecrypt(data, password, iv, mac);
            complete = true;
            break;
        } catch(error) {}
    }
    if(complete) {
        response["raw"] = response["content"];
        response["content"] = parseDecoded(response["content"]);
        return response;
    } else {
        response["error"] = 1;
        return response;
    }
}
module.exports.decryptFile = function(file, configFile, type) {
    // This function acts like a "hub" between the decoding methods, less fashioned that the other solution, but hopefully can work.
    var defaultApiError = {};
    defaultApiError["content"] = "";
    defaultApiError["raw"] = "";
    defaultApiError["error"] = 1;
    switch(type) {
        case 0:
            return decryptStage(file, configFile);
        default:
            return defaultApiError;
    }
}