/*
* tlsDecryptor module
* Description: This covers all encryption scheme related to TLS Tunnel and etc
* Author: PANCHO7532, research: @aliraqy_2021
*
* WARNING: This module is in a beta phase forked directly from slipk algorithm, due to the shit scheme of TLS Tunnel cfgs,
* this may not work for all versions and you would end trying it using /raw
*/
const metadata = {
    "title":"tlsDecryptor",
    "author":"PANCHO7532/aliraqy_2021",
    "version":1,
    "schemeLength":1
}
const crypto = require('crypto');
const fs = require('fs');
module.exports.metadata = metadata;
function aesDecrypt(data, password, iv, mac) {
    /*
    * data = binary encoded data
    * password = buffered password
    * iv = buffered data with the iv
    * mac = mac tag extracted from the actual data functions? depr
    */
    var aesgcm = crypto.createDecipheriv("aes-256-gcm", password, iv);
    aesgcm.setAuthTag(mac);
    aesgcm.setAutoPadding(false);
    var result = aesgcm.update(data, "binary", 'utf-8');
    //console.log(result);
    result += aesgcm.final("utf-8");
    return result;
}
function parseDecoded(data, tlsBuild) {
    //parse stuff
    try {
        if(parseInt(tlsBuild) < 200) {
            return data;
        }
    } catch(e) {}
    var predefinedPorts = [
        "Automatic",
        "25",
        "80",
        "110",
        "143",
        "443",
        "465",
        "853",
        "993",
        "995",
        "2525",
        "3128",
        "8080",
        "8888",
        "33827"
    ];
    var dnsConnectionType = [
        "UDP [53]",
        "DoT [853]",
        "DoH [853]"
    ]
    var connectionMethods = [
        "Default Method",
        "Payload",
        "SNI",
        "Payload + SNI",
        "Payload + Proxy",
        "Payload + Proxy + SNI",
        "DNS Tunnel"
    ];
    var result = {};
    data = data.toString().split(":"); //just in case
    /*for(let c = 0; c < data.length; c++) {
        console.log(c + ": " + data[c]);
    }*/
    result["connectionMethod"] = connectionMethods[parseInt(data[0])];
    result["payload"] = Buffer.from(data[1], "base64").toString();
    result["sniValue"] = Buffer.from(data[2], "base64").toString();
    result["note1"] = Buffer.from(data[3], "base64").toString();
    result["sshServer"] = Buffer.from(data[4], "base64").toString();
    result["tlsPredefPort"] = predefinedPorts[parseInt(data[5])]; //unknown numeric value //legacy: int
    result["sshPort"] = Buffer.from(data[6], "base64").toString(); //true
    result["sshUser"] = Buffer.from(data[7], "base64").toString(); //blank
    // fail in older versions
    result["sshPassword"] = Buffer.from(data[8], "base64").toString();
    result["proxyURL"] = Buffer.from(data[9], "base64").toString();
    result["proxyPort"] = Buffer.from(data[10], "base64").toString();
    result["tlsDnsConnectionType"] = dnsConnectionType[parseInt(data[11])];
    result["tlsDnsServer"] = Buffer.from(data[12], "base64").toString();
    result["tlsDnsDomain"] = Buffer.from(data[13], "base64").toString();
    result["tlsDnsPublicKey"] = Buffer.from(data[14], "base64").toString();
    result["unknown"] = data[15];
    result["unknown"] = data[16];
    result["unknown"] = data[17];
    result["unknown"] = data[18];
    result["unknown"] = data[19];
    result["unknown"] = data[20];
    result["unknown"] = data[21];
    result["unknown"] = data[22];
    result["unknown"] = data[23];
    result["unknown"] = data[24];
    result["unknown"] = data[25];
    result["unknown"] = data[26];
    result["unknown"] = data[27];
    result["unknown"] = data[28];
    result["unknown"] = data[29];
    result["unknown"] = data[30];
    result["unknown"] = data[31];
    result["unknown"] = data[32];
    result["unknown"] = data[33];
    result["unknown"] = data[34];
    result["unknown"] = data[35];
    result["unknown"] = data[36];
    result["unknown"] = data[37];
    result["unknown"] = data[38];
    result["unknown"] = data[39];
    result["unknown"] = data[40];
    result["unknown"] = data[41];
    result["unknown"] = data[42];
    result["unknown"] = data[43];
    result["unknown"] = data[44];
    /*
    * hacky integration, probably might break
    */
    try {
        result["lockPayloadAndServers"] = data[data.length-5].substring(1);
    } catch(e) { result["lockPayloadAndServers"] = ""; }
    result["blockTorrent"] = data[data.length-4];
    result["unknown"] = data[47];
    result["unknown"] = data[48];
    result["unknown"] = data[49];
    result["sshAddr"] = result["sshServer"] + ":" + result["sshPort"] + "@" + result["sshUser"] + ":" + result["sshPassword"];
    result["build"] = tlsBuild;
    result["credits"] = "Encryption research for this HCDrill module to aliraqy_2021";
    return JSON.stringify(result, null, "\t");
}
function decryptStage(filecontent, configFile) {
    //parse more stuff
    var keyFile;
    var complete = false;
    var response = {};
    var fileArr;
    response["content"] = "";
    response["raw"] = "";
    response["error"] = 0;
    try {
        fileArr = filecontent.toString().split(":");
        if(fileArr.length > 2) {
            throw "Non-Valid File: OOB";
        }
    } catch(error) {
        response["error"] = 1;
        return response;  
    }
    //preparing file
    var preData, data, iv, mac;
    try {
        keyFile = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["tls"];
        preData = Buffer.from(fileArr[1], "base64")
        data = preData.slice(12, preData.length-16);;
        iv = preData.slice(0, 12);
        mac = preData.slice(preData.length-16, preData.length);
    } catch(error) {
        response["error"] = 1;
        return response;
    }
    //decryption process
    for(let c = 0; c < keyFile.length; c++) {
        try {
            password = Buffer.from(keyFile[c], "base64");
            response["content"] = aesDecrypt(data, password, iv, mac);
            //console.log(response["content"]);
            complete = true;
            break;
        } catch(error) { /*console.log(error)*/ }
    }
    //eval
    if(complete) {
        response["raw"] = response["content"];
        response["content"] = parseDecoded(response["content"], fileArr[0]);
        //return;
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