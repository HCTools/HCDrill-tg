/*
* eProDecryptor module
* Description: Yeah, this module aims to decrypt almost every config from ePro Dev Team apps.
* Author: PANCHO7532
*/
const metadata = {
    "title":"eProDecryptor",
    "author":"PANCHO7532",
    "version":5,
    "schemeLength":4
}
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const xorValues = ['。', '〃', '〄', '々', '〆', '〇', '〈', '〉', '《', '》', '「', '」', '『', '』', '【', '】', '〒', '〓', '〔', '〕'];
module.exports.metadata = metadata;
function xorDeobfs(file) {
    //xor deobfs
    file = file.replace(/[\u2000-\u20ef]/g, "");
    file = file.replace(/\n|\r/g, "");
    var deobfs_val = "";
    for(let a = 0, b = 0; a < file.length; a++, b++) {
        if(b >= xorValues.length) {b = 0}
        deobfs_val += String.fromCharCode(file.charCodeAt(a) ^ xorValues[b].charCodeAt(0));
    }
    return deobfs_val;
}
function sha1crypt(data) {
    var outp1 = crypto.createHash("sha1");
    outp1 = outp1.update(data);
    outp1 = outp1.digest();
    return outp1.slice(0, outp1.length-4);
}
function aesDecrypt(data, key) {
    //aes but with base64 encoded data
    //data = receives base64 string
    //key = buffered sha1 value
    const aesoutp1 = crypto.createDecipheriv("aes-128-ecb", key, null);
    //ok, so we need to refactor this... byte by byte idk
    //but that means that we need to throw away all the base64 bullshit and try to stream to some variable the decoded output
    //probably this wont work... but anyway
    const decb64 = Buffer.from(data, "base64");
    var result = "";
    for(let c = 0; c < decb64.length; c++) {
        try {
            result += aesoutp1.update(Buffer.from([decb64[c]]), "binary", "utf-8");
        } catch(error) {
            break;
        }
    }
    //result += aesoutp1.final("utf-8");
    //delete \0 from final result: result = result.replace(/\0/g, "");
    return result;
}
function aesDecrypt2(data, key) {
    //aes but with raw data
    //data = receives raw data
    //key = buffered sha1 value
    const aesoutp2 = crypto.createDecipheriv("aes-128-ecb", key, null);
    var result = aesoutp2.update(data, "binary", "utf8");
    result += aesoutp2.final("utf-8");
    return result;
}
function parseDecoded(data) {
    //only json, so, we parse this json inside a json later in the main bot script or any place where this is used
    var st1 = data.split("[splitConfig]");
    var outp2 = {};
    outp2["payload"] = st1[0];
    outp2["proxyURL"] = st1[1];
    outp2["blockedRoot"] = st1[2];
    outp2["lockPayloadAndServers"] = st1[3];
    outp2["expireDate"] = st1[4];
    outp2["containsNotes"] = st1[5];
    outp2["note1"] = st1[6];
    outp2["sshAddr"] = st1[7];
    outp2["mobileData"] = st1[8];
    outp2["unlockProxy"] = st1[9];
    outp2["openVPNConfig"] = st1[10];
    outp2["VPNAddr"] = st1[11];
    outp2["sniValue"] = st1[12];
    outp2["connectSSH"] = st1[13];
    outp2["udpgwPort"] = st1[14];
    outp2["lockPayload"] = st1[15];
    outp2["hwidEnabled"] = st1[16];
    outp2["hwidValue"] = st1[17];
    outp2["note2"] = st1[18];
    outp2["unlockUserAndPassword"] = st1[19];
    outp2["sslPayloadMode"] = st1[20];
    outp2["passwordProtected"] = st1[21];
    outp2["passwordValue"] = st1[22];
    //outp2["raw"] = data;
    return JSON.stringify(outp2);
}
function parseDecoded2(data) {
    //for eProxy
    var st1 = data.split("[pisahConk]");
    var outp2 = {};
    outp2["payload"] = st1[0];
    outp2["proxyAddress"] = st1[1];
    outp2["proxyPort"] = st1[2];
    outp2["autoReplace"] = st1[3];
    outp2["route"] = st1[4];
    outp2["connectSSH"] = st1[5];
    outp2["useTun2Socks"] = st1[6];
    outp2["googlePlay"] = st1[7];
    outp2["mobileData"] = st1[8];
    outp2["customPayload"] = st1[9];
    outp2["hwidEnabled"] = st1[10];
    outp2["unknown"] = st1[11];
    outp2["unknown"] = st1[12];
    outp2["hwidValue"] = st1[13];
    outp2["note1"] = st1[14];
    outp2["bitviseProfileName"] = st1[15];
    outp2["sshServer"] = st1[16];
    outp2["sshPort"] = st1[17];
    outp2["sshUser"] = st1[18];
    outp2["sshPassword"] = st1[19];
    outp2["bool"] = st1[20];
    outp2["autoReconnect"] = st1[21];
    outp2["enableCustomDNS"] = st1[22];
    outp2["enableHTTPProxy"] = st1[23];
    outp2["httpProxy"] = st1[24];
    outp2["extraProtection"] = st1[25];
    outp2["blockedRoot"] = st1[26];
    outp2["unknown"] = st1[27];
    outp2["listenPort"] = st1[28];
    outp2["useDNS"] = st1[29];
    outp2["dnsForward"] = st1[30];
    outp2["batterySaver"] = st1[31];
    outp2["showLog"] = st1[32];
    outp2["expireDate"] = st1[33];
    outp2["directSSH"] = st1[34];
    return JSON.stringify(outp2);
}
function decryptStage(fileContent, configFile) {
    var keyFile;
    var complete = false;
    var response = {};
    response["content"] = "";
    response["raw"] = "";
    response["error"] = 0;
    try {
        keyFile = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["ePro"][0];
    } catch(error) {
        response["error"] = error;
        return response;
    }
    //decrypting stage
    var deXoredContent = xorDeobfs(fileContent.toString("utf-8"));
    var sha1key = "";
    for(let c = 0; c < keyFile.length; c++) {
        sha1key = sha1crypt(keyFile[c]);
        try {
            response["content"] = aesDecrypt(deXoredContent, sha1key);
            if(response["content"].length > 1) {
                if(response["content"].indexOf("[splitConfig]") != -1) { complete = true } else { throw "False content" };
                break;
            } else {
                throw "False UTF-8";
            }
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
function decryptStage2(fileContent, configFile) {
    var keyFile;
    var complete = false;
    var response = {};
    response["content"] = "";
    response["raw"] = "";
    response["error"] = 0;
    try {
        keyFile = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["ePro"][0];
    } catch(error) {
        response["error"] = error;
        return response;
    }
    for(let c = 0; c < keyFile.length; c++) {
        try {
            response["content"] = aesDecrypt2(fileContent, sha1crypt(keyFile[c]));
            if(response["content"].length > 1) {
                if(response["content"].indexOf("[splitConfig]") != -1) { complete = true } else { throw "False content" };
                break;
            } else {
                throw "False UTF-8";
            }
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
function decryptStage3(fileContent, configFile) {
    //alright bl4th4nk, let's write your new decoding scheme
    var keyFile;
    var keyFile2;
    var complete = false;
    var response = {};
    response["content"] = "";
    response["raw"] = "";
    response["error"] = 0;
    try {
        keyFile = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["ePro"][0];
    } catch(error) {
        response["error"] = error;
        return response;
    }
    try {
        keyFile2 = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["ePro"][1];
    } catch(error) {
        response["error"] = error;
        return response;
    }
    //decrypting stage
    var deXoredContent = xorDeobfs(fileContent.toString("utf-8"));
    var sha1key;
    var secondStage;
    for(let d = 0; d < keyFile2.length; d++) {
        try {
            var plainKey = Buffer.from(keyFile2[d]).slice(0, 16);
            secondStage = aesDecrypt(deXoredContent, plainKey);
        } catch(error) {}
    }
    for(let c = 0; c < keyFile.length; c++) {
        sha1key = sha1crypt(keyFile[c]);
        try {
            response["content"] = aesDecrypt(secondStage, sha1key);
            if(response["content"].length > 1) {
                if(response["content"].indexOf("[splitConfig]") != -1) { complete = true } else { throw "False content" };
                break;
            } else {
                throw "False UTF-8";
            }
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
function decryptStage4(fileContent, configFile) {
    //for eProxy, pretty much the same as ApkCustom
    //but since it contains more fields and different placeholder, we put it in a different function
    var keyFile;
    var complete = false;
    var response = {};
    response["content"] = "";
    response["raw"] = "";
    response["error"] = 0;
    try {
        keyFile = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["ePro"][0];
    } catch(error) {
        response["error"] = error;
        return response;
    }
    for(let c = 0; c < keyFile.length; c++) {
        try {
            response["content"] = aesDecrypt2(fileContent, sha1crypt(keyFile[c]));
            if(response["content"].length > 1) {
                if(response["content"].indexOf("[pisahConk]") != -1) { complete = true } else { throw "False content" };
                break;
            } else {
                throw "False UTF-8";
            }
        } catch(error) {}
    }
    if(complete) {
        response["raw"] = response["content"];
        response["content"] = parseDecoded2(response["content"]);
        return response;
    } else {
        response["error"] = 1;
        return response;
    }
}
module.exports.decryptFile = function(file, configFile, type) {
    // This function acts like a "hub" between the decoding methods, less fashioned that the other solutions that i had, but hopefully can work.
    var defaultApiError = {};
    defaultApiError["content"] = "";
    defaultApiError["raw"] = "";
    defaultApiError["error"] = 1;
    switch(type) {
        case 0:
            return decryptStage(file, configFile);
        case 1:
            return decryptStage2(file, configFile);
        case 2:
            return decryptStage3(file, configFile);
        case 3:
            return decryptStage4(file, configFile);
        default:
            return defaultApiError;
    }
}