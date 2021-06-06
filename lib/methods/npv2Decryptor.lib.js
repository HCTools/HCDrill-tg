/*
 * npv2Decryptor module
 * Description: This module aims for decrypt NapsternetV config files
 * Author: PANCHO7532, research: @ReverseLIvE
 */
const metadata = {
    "title":"npv2Decryptor",
    "author":"PANCHO7532/ReverseLIvE",
    "version":1,
    "schemeLength":1
}
const fs = require('fs');
module.exports.metadata = metadata;
function xorCrypto(key, data) {
    //classic xor with a smol modification
    let result = "";
    for(let a = 0, b = 0; a < data.length; a++, b++) {
        if(b >= key.length) {b = 0}
        result += String.fromCharCode(data.charCodeAt(a) - key.charCodeAt(b));
    }
    return result;
}
function parseDecoded(data) {
    let response = {}, connectionType = [];
    connectionType = [
        "V2Ray (vmess)",
        "Shadowsocks",
        "Socks",
        "V2Ray (vless)",
        "Trojan"
    ]
    //console.log(data);
    /*if(!data["vmess"]) {
        //pls remind me of fix this one
        let content = {};
        content["note1"] = "Something went wrong.";
        return JSON.stringify(content);
    }*/
    if(data["vmess"]) {
        switch(data["vmess"]["configType"]) {
            case 0:
                //V2Ray
                response["connectionMethod"] = connectionType[data["vmess"]["configType"]];
                response["remarks"] = data["vmess"]["remarks"];
                response["V2RayHost"] = data["vmess"]["address"];
                try {response["V2RayPort"] = data["vmess"]["port"].toString()} catch(e) {};
                response["V2RayUserId"] = data["vmess"]["id"];
                try {response["V2RayAlterId"] = data["vmess"]["alterId"].toString()} catch(e) {};
                response["V2RayNetwork"] = data["vmess"]["network"];
                response["V2RayWSPath"] = data["vmess"]["path"];
                response["V2RayWSHost"] = data["vmess"]["requestHost"];
                response["V2RaySecurity"] = data["vmess"]["security"];
                response["V2RayTLS"] = data["vmess"]["sni"];
                try {response["V2RayTLSInsecure"] = data["vmess"]["allowInsecure"].toString()} catch(e) {};
                response["V2RayQUICSec"] = data["vmess"]["quicSecurity"];
                response["V2RayQUICKey"] = data["vmess"]["quicKey"];
                response["V2RayHeader"] = data["vmess"]["headerType"];
                response["V2RayEncryption"] = data["vmess"]["encryption"];
                try {response["V2RayMux"] = data["vmess"]["enableMux"].toString()} catch(e) {};
                break;
            case 1:
                //shadowsocks
                response["connectionMethod"] = connectionType[data["vmess"]["configType"]];
                response["remarks"] = data["vmess"]["remarks"];
                response["shadowsocksHost"] = data["vmess"]["address"];
                try {response["shadowsocksPort"] = data["vmess"]["port"].toString()} catch(e) {};
                response["shadowsocksEncryptionMethod"] = data["vmess"]["security"];
                response["shadowsocksPassword"] = data["vmess"]["id"];
                try {response["shadowsocksMux"] = data["vmess"]["enableMux"].toString()} catch(e) {};
                break;
            case 2:
                //socks
                response["connectionMethod"] = connectionType[data["vmess"]["configType"]];
                response["remarks"] = data["vmess"]["remarks"];
                response["socksHost"] = data["vmess"]["address"];
                try {response["socksPort"] = data["vmess"]["port"].toString()} catch(e) {};
                response["socksUsername"] = data["vmess"]["username"];
                response["socksPassword"] = data["vmess"]["id"];
                try {response["socksMux"] = data["vmess"]["enableMux"].toString()} catch(e) {};
                break;
            case 3:
                //vless
                //note for later, should i copypaste v2ray vmess scheme?
                //probably yes
                response["connectionMethod"] = connectionType[data["vmess"]["configType"]];
                response["remarks"] = data["vmess"]["remarks"];
                response["V2RayHost"] = data["vmess"]["address"];
                try {response["V2RayPort"] = data["vmess"]["port"].toString()} catch(e) {};
                response["V2RayUserId"] = data["vmess"]["id"];
                try {response["V2RayAlterId"] = data["vmess"]["alterId"].toString()} catch(e) {};
                response["V2RayNetwork"] = data["vmess"]["network"];
                response["V2RayWSPath"] = data["vmess"]["path"];
                response["V2RayWSHost"] = data["vmess"]["requestHost"];
                response["V2RaySecurity"] = data["vmess"]["security"];
                response["V2RayTLS"] = data["vmess"]["sni"];
                try {response["V2RayTLSInsecure"] = data["vmess"]["allowInsecure"].toString()} catch(e) {};
                response["V2RayQUICSec"] = data["vmess"]["quicSecurity"];
                response["V2RayQUICKey"] = data["vmess"]["quicKey"];
                response["V2RayHeader"] = data["vmess"]["headerType"];
                response["V2RayEncryption"] = data["vmess"]["encryption"];
                try {response["V2RayMux"] = data["vmess"]["enableMux"].toString()} catch(e) {};
                break;
            case 4:
                //trojan
                response["connectionMethod"] = connectionType[data["vmess"]["configType"]];
                response["remarks"] = data["vmess"]["remarks"];
                response["trojanAddress"] = data["vmess"]["address"];
                try {response["trojanPort"] = data["vmess"]["port"].toString()} catch(e) {};
                response["trojanPass"] = data["vmess"]["id"];
                response["trojanSNI"] = data["vmess"]["sni"];
                try {response["trojanVerifySSL"] = data["vmess"]["allowInsecure"].toString()} catch(e) {};
                break;
            default:
                //no matches?
                //content = {};
                response["note1"] = "Something went wrong.";
                break;
                //fix this one retard
                //return JSON.stringify(content);
        }
    }
    if(data["security"]) {
        try {response["blockedRoot"] = data["security"]["blockRooted"].toString()} catch(e) {};
        try {response["mobileData"] = data["security"]["onlyMobileNetwork"].toString()} catch(e) {};
        try {response["googlePlay"] = data["security"]["onlyPlayStore"].toString()} catch(e) {};
        if(data["security"]["password"].length > 1) {
            response["passwordProtected"] = "true";
            response["passwordValue"] = data["security"]["password"];
        }
        response["build"] = data["security"]["version"];
        if(data["security"]["expiryDate"].length > 1) {
            response["expireDate"] = data["security"]["expiryDate"];
        } else if(data["security"]["xExpiryDate"]) {
            response["expireDate"] = data["security"]["xExpiryDate"];
        }
    }
    //lol why this is unreachable, vscode you dumb fuck
    response["credits"] = "Encryption research for this HCDrill module to ReverseLIvE";
    return JSON.stringify(response);
}
function decryptStage(fileContent, configFile) {
    var keyFile;
    var complete = false;
    var response = {};
    response["content"] = "";
    response["raw"] = "";
    response["error"] = 0;
    try {
        keyFile = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["npv2"];
    } catch(error) {
        response["error"] = error;
        return response;
    }
    //decrypting stage
    var deXoredContent = "";
    for(let c = 0; c < keyFile.length; c++) {
        deXoredContent = xorCrypto(keyFile[c], fileContent.toString("utf-8"));
        //console.log(deXoredContent);
        try {
            response["content"] = JSON.parse(deXoredContent);
            response["raw"] = deXoredContent;
            complete = true;
            break;
        } catch(error) {}
    }
    //console.log(response);
    if(complete) {
        response["content"] = parseDecoded(response["content"]);
        //console.log(response);
        return response;
    } else {
        response["error"] = 1;
        return response;
    }
}
module.exports.decryptFile = function(file, configFile, type) {
    // This function acts like a "hub" between the decoding methods, less fashioned that the other solution, but hopefully can work.
    //console.log("npv2")
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
//hello