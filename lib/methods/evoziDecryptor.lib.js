/*
 * evoziDecryptor module
 * Description: This module aims for decrypt HTTP Injector and HTTP Injector Lite configuration files
 * Author: PANCHO7532, research: @aliraqy_2021
 * Special thanks to @discomforting for helping me through the development of this module
 */
const metadata = {
    "title":"evoziDecryptor",
    "author":"PANCHO7532/aliraqy_2021",
    "version":1,
    "schemeLength":1
}
const crypto = require('crypto');
const fs = require('fs');
require("../customBase64");
module.exports.metadata = metadata;
function xorCrypto(key, data) {
    //classic xor with a few steroids
    let preData, result;
    preData = "";
    result = "";
    for(let c = 0; c < data.length;) {
        if(c >= data.length) { break; }
        preData += String.fromCharCode(parseInt(data.substring(c, c + 2), 16));
        c = c + 2;
    }
    //preData = data;
    for(let a = 0, b = 0; a < preData.length; a++, b++) {
        if(b >= key.length) {b = 0}
        result += String.fromCharCode(preData.charCodeAt(a) ^ key.charCodeAt(b));
    }
    return result;
}
function aesDecrypt(data, key, iv) {
    let result;
    const aesOperation = crypto.createDecipheriv("aes-256-cbc", key, iv);
    result = aesOperation.update(data, "binary", "utf-8");
    //console.log(result);
    result += aesOperation.final("utf-8");
    return result;
}
function aesDecrypt2(data, key, iv) {
    /*
    console.log("received key;");
    console.log(key);
    console.log("received iv;");
    console.log(iv);
    console.log("received data:");
    console.log(data);
    */
    let result;
    const aesOperation = crypto.createDecipheriv("aes-128-cbc", key, iv);
    result = aesOperation.update(data, "base64", "utf-8");
    //console.log(result);
    result += aesOperation.final("utf-8");
    return result;
}
function reverseString(string) {
    let newString = "";
    let stringLength = string.length - 1;
    while(stringLength != -1) {
        newString += string[stringLength];
        stringLength--;
    }
    return newString;
}
function parseDecoded(data) {
    //console.log(data);
    let content = {};
    let configSaltxD = "";
    let preDataxD = "";
    var cb64Keys = [
        "host",
        "user",
        "password",
        "remoteProxy",
        "payload",
        "sniHostname",
        "configMessage",
        "shadowsocksConfig",
        "v2rWsPath",
        "v2rWsHeader",
        "v2rVmessSecurity",
        "v2rVlessSecurity",
        "v2rUserId",
        "v2rSsSecurity",
        "v2rQuicSecurity",
        "v2rProtocol",
        "v2rPort",
        "v2rPassword",
        "v2rNetwork",
        "v2rMuxConcurrency",
        "v2rKcpHeaderType",
        "v2rHost",
        "v2rAlterId",
        "v2rQuicHeaderType",
        "shadowsocksHost",
        "shadowsocksPassword",
        "publicKey",
        "remoteProxyPassword",
        "remoteProxyUsername",
        "v2rTlsSni",
        "v2rTcpHeaderType",
        "v2rRawJson"
    ];
    try {
        preDataxD = JSON.parse(data);
        if(!preDataxD["configSalt"] || preDataxD["configSalt"].length < 0) {
            configSaltxD = "EVZJNI";
        } else {
            configSaltxD = preDataxD["configSalt"];
            //configSaltxD = "EVZJNI";
        }
        //console.log("something something");
        //console.log(preDataxD);
        for(let c = 0; c < Object.keys(preDataxD).length; c++) {
            try {
                //trynception
                if(preDataxD["configVersionCode"] > 10000) {
                    //it might be ehil

                    //let test = "";
                    //console.log("reverse");
                    //test = reverseString(preDataxD[cb64Keys[c]]);
                    //console.log(test);
                    //console.log("base64 decoded");
                    //test = test.fromBase64("RkLC2QaVMPYgGJW/A4f7qzDb9e+t6Hr0Zp8OlNyjuxKcTw1o5EIimhBn3UvdSFXs?", "?");
                    //console.log(test);
                    preDataxD[cb64Keys[c]] = reverseString(preDataxD[cb64Keys[c]]).fromBase64("t6uxKcTwhBn3UvRkLC2QaVM1o5A4f7Hr0Zp8OyjqzDb9e+dSFXsEIimPYgGJW/lN?", "?");
                    preDataxD[cb64Keys[c]] = xorCrypto(configSaltxD, preDataxD[cb64Keys[c]]);
                } else {
                    preDataxD[cb64Keys[c]] = reverseString(preDataxD[cb64Keys[c]]).fromBase64("RkLC2QaVMPYgGJW/A4f7qzDb9e+t6Hr0Zp8OlNyjuxKcTw1o5EIimhBn3UvdSFXs?", "?");
                    preDataxD[cb64Keys[c]] = xorCrypto(configSaltxD, preDataxD[cb64Keys[c]]);
                    //until we somehow figure out what the fuck configMessage is and how it's encrypted
                    /*console.log(preDataxD[cb64Keys[c]]);
                    preDataxD[cb64Keys[c]] = preDataxD[cb64Keys[c]].replace(/[\\}]/g, "");
                    preDataxD[cb64Keys[c]] = reverseString(preDataxD[cb64Keys[c]]).fromBase64("RkLC2QaVMPYgGJW/A4f7qzDb9e+t6Hr0Zp8OlNyjuxKcTw1o5EIimhBn3UvdSFXs?", "?");
                    preDataxD[cb64Keys[c]] = xorCrypto(configSaltxD, preDataxD[cb64Keys[c]]);*/
                }
            } catch(e) { /*console.log(e)*/ }
        }
    } catch(e) {
        //console.log(e);
        content = {};
        content["note1"] = "Something went wrong.";
        return JSON.stringify(content);
    }
    content["payload"] = preDataxD["payload"];
    content["proxyAddress"] = preDataxD["remoteProxy"];
    content["proxyUser"] = preDataxD["remoteProxyUsername"];
    content["proxyPassword"] = preDataxD["remoteProxyPassword"];
    content["sshServer"] = preDataxD["host"];
    content["sshPort"] = preDataxD["port"];
    content["sshUser"] = preDataxD["user"];
    content["sshPassword"] = preDataxD["password"];
    content["publicKey"] = preDataxD["publicKey"];
    content["sniValue"] = preDataxD["sniHostname"];
    content["routes"] = preDataxD["customRoutes"];
    content["excludedRoutes"] = preDataxD["excludedRoutes"];
    content["build"] = preDataxD["configVersionCode"];
    content["created"] = preDataxD["configTimestamp"];
    content["ownerHWID"] = preDataxD["configIdentifier"];
    content["hwidValue"] = preDataxD["configHwid"];
    content["shadowsocksHost"] = preDataxD["shadowsocksHost"];
    content["shadowsocksPort"] = preDataxD["shadowsocksPort"];
    content["shadowsocksEncryptionMethod"] = preDataxD["shadowsocksEncryptionMethod"];
    content["shadowsocksPassword"] = preDataxD["shadowsocksPassword"];
    content["V2RayHost"] = preDataxD["v2rHost"];
    content["V2RayPort"] = preDataxD["v2rPort"];
    content["V2RayUserId"] = preDataxD["v2rUserId"];
    content["V2RayAlterId"] = preDataxD["v2rAlterId"];
    content["V2RayPass"] = preDataxD["v2rPassword"];
    content["V2RayTLS"] = preDataxD["v2rTlsSni"];
    content["V2RayProtocol"] = preDataxD["v2rProtocol"];
    content["V2RayNetwork"] = preDataxD["v2rNetwork"];
    content["V2RayRAW"] = preDataxD["v2rRawJson"];
    if(preDataxD["lockModes"].indexOf("\"payload\"") != -1) {
        content["lockPayload"] = "true";
    } if(preDataxD["lockModes"].indexOf("hwid_lock") != -1) {
        content["hwidEnabled"] = "true";
    } if(preDataxD["lockModes"].indexOf("anti_root") != -1) {
        content["lockRoot"] = "true";
    } if(preDataxD["lockModes"].indexOf("block_torrent") != -1) {
        content["blockTorrent"] = "true";
    } if(preDataxD["lockModes"].indexOf("block_terminal") != -1) {
        content["blockTerminal"] = "true";
    } if(preDataxD["lockModes"].indexOf("gaming_mode") != -1) {
        content["gamingMode"] = "true";
    } if(preDataxD["lockModes"].indexOf("play_store_only") != -1) {
        content["googlePlay"] = "true";
    } if(preDataxD["lockModes"].indexOf("remote_proxy") != -1) {
        content["unlockProxy"] = "false";
    } if(preDataxD["lockModes"].indexOf("proxy_auth") != -1) {
        content["unlockProxyCredentials"] = "false";
    } if(preDataxD["lockModes"].indexOf("sni_host_port") != -1) {
        content["unlockSni"] = "false";
    } if(preDataxD["lockModes"].indexOf("expiry") != -1) {
        content["enableExpire"] = "true";
    }
    return JSON.stringify(content);
}
function decryptStage(fileContent, configFile) {
    //oh boi, here we go
    if(fileContent.toString().indexOf("ehil") != -1) {
        //console.log("its a lite config");
        fileContent = fileContent.slice(41, fileContent.length);
    } else {
        //console.log("its a normal config");
        fileContent = fileContent.slice(40, fileContent.length);
    }
    var keyFile, keyFile2, IVs;
    var complete = false;
    var response = {};
    response["content"] = "";
    response["raw"] = "";
    response["error"] = 0;
    try {
        keyFile = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["evozi"][0];
        keyFile2 = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["evozi"][1];
        IVs = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["evozi"][2];
    } catch(error) {
        response["error"] = error;
        return response;
    }
    //decrypting stage
    var preDecodedContent = "";
    for(let c = 0; c < keyFile.length; c++) {
        let complete1 = false;
        for(let d = 0; d < IVs.length; d++) {
            //console.log("first stage:");
            //console.log("using key1: " + keyFile[c]);
            //console.log("using iv: " + IVs[d]);
            try {
                preDecodedContent = aesDecrypt(fileContent, Buffer.from(keyFile[c], "base64"), IVs[d]);
                complete1 = true;
                //console.log("complete");
                //console.log(preDecodedContent);
                break;
            } catch(error) { /*console.log("failed")*/ }
        }
        if(complete1) { /*console.log("complete, so break");*/ break; }
    }
    if(preDecodedContent.length > 1) {
        //second round
        var preDecodedContent2 = "";
        preDecodedContent = preDecodedContent.split(":")
        preDecodedContent = preDecodedContent[preDecodedContent.length-1];
        for(let c = 0; c < keyFile2.length; c++) {
            let complete2 = false;
            for(let d = 0; d < IVs.length; d++) {
                //console.log("second stage:");
                //console.log("using key2: " + keyFile2[c]);
                //console.log("using iv: " + IVs[d]);
                try {
                    preDecodedContent2 = aesDecrypt2(preDecodedContent, Buffer.from(keyFile2[c], "base64"), IVs[d]);
                    complete2 = true;
                    break;
                } catch(error) { /*console.log("failed")*/ }
            }
            if(complete2) { complete = true; break; }
        }
    }
    if(complete) {
        //console.log(response);
        response["content"] = preDecodedContent2.replace(preDecodedContent2.substring(0, 17), "{\"a");
        response["raw"] = response["content"];
        response["content"] = parseDecoded(response["content"]);
        //console.log(response);
        return response;
    } else {
        console.log(response);
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
//hello