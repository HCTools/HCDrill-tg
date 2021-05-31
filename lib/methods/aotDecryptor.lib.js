/*
* aotDecryptor module
* Description: Yeah, this module aims to decrypt configs made by Art Of Tunnel dev team.
* Author: PANCHO7532, research: @aliraqy_2021
*
* WARNING: This module is in a beta phase forked directly from epro algorithm,
* this may not work for all versions and you would end trying it using /raw
*/
const metadata = {
    "title":"aotDecryptor",
    "author":"PANCHO7532/aliraqy_2021",
    "version":1,
    "schemeLength":4
}
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
module.exports.metadata = metadata;
function aesDecrypt(data, key) {
    //aes but with raw data
    //data = receives b64 data
    //key = buffered sha1 value
    const aesoutp2 = crypto.createDecipheriv("aes-128-ecb", key, null);
    var result = aesoutp2.update(data, "base64", "utf8");
    result += aesoutp2.final("utf-8");
    return result;
}
function parseDecoded(data) {
    //made with tears
    /*
    * ok so, there's a high chance that profile and profilev4 sand so one are from different versions of Art Of Tunnel apps
    * whatever, i'm going to see if i can do black magic with this theory
    */
    var xd, xdKeys;
    var uwu = {};
    try {
        xd = JSON.parse(data);
        xdKeys = Object.keys(xd);
    } catch(error) {}
    var connectionMode = [
        "Direct Connection", //probably unused
        "Custom Payload (TCP)",
        "Custom Host Header (HTTP)",
        "Custom SNI (SSL/TLS)",
        "Imported Config" //probably unused
    ];
    var connectionMode2 = [
        "SSH",
        "SSL + SSH"
    ]
    var haNodes = [
        //remind me to fill this one
    ];
    if(!!xd["configuration"]) {
        //shelltun
        uwu["connectionMethod"] = connectionMode2[xd["configuration"]["connection_mode"]];
        uwu["usePayload"] = xd["configuration"]["using_http_headers"]
        uwu["payload"] = xd["configuration"]["http_headers"];
        uwu["aotServerGroup"] = xd["configuration"]["server_group_host"];
        uwu["enableHTTPProxy"] = xd["configuration"]["using_proxy"];
        uwu["aotUseHostAsProxy"] = xd["configuration"]["using_server_hosted_proxy"];
        uwu["proxyAddress"] = xd["configuration"]["proxy_host"];
        uwu["proxyPort"] = xd["configuration"]["proxy_port"];
        uwu["aotServerPort"] = xd["configuration"]["aotServerPort"];
        uwu["useSSL"] = xd["configuration"]["using_advssl"];
        uwu["sniValue"] = xd["configuration"]["adv_ssl_spoofhost"];
        uwu["udpgwPort"] = xd["configuration"]["vpn_udpgw_port"];
        uwu["sshServer"] = xd["configuration"]["server_host"];
        uwu["sshUser"] = xd["configuration"]["server_username"];
        uwu["sshPassword"] = xd["configuration"]["server_password"];
    }
    if(!!xd["meta"]) {
        uwu["note1"] = xd["meta"]["meta_vendor_msg"];
    }
    if(!!xd["profile"]){
        //legacy HA Tunnel
        uwu["connectionMethod"] = connectionMode[xd["profile"]["connection_mode"]];
        uwu["payload"] = xd["profile"]["custom_payload"];
        uwu["hostHeader"] = xd["profile"]["custom_host"];
        uwu["sniValue"] = xd["profile"]["custom_sni"];
        try { uwu["aotRealmHost"] = xd["profile"]["use_realm_host"].toString() } catch(e) {};
        uwu["aotRealmHostValue"] = xd["profile"]["realm_host"];
        try { uwu["aotOverrideHost"] = xd["profile"]["override_primary_host"].toString() } catch(e) {};
        uwu["aotPrimaryHost"] = xd["profile"]["primary_host"];
        try { uwu["serverPort"] = xd["profile"]["server_port"].toString() } catch(e) {};
        uwu["aotNode"] = xd["profile"]["primary_node"];
        uwu["aotBaseTunnel"] = xd["profile"]["base_tunnel"];
    }
    if(!!xd["description"]) {
        //legacy description
        uwu["note1"] = xd["description"];
    }
    if(!!xd["profilev4"]) {
        //HA Tunnel Pro
        uwu["connectionMethod"] = connectionMode[xd["profilev4"]["connection_mode"]];
        uwu["payload"] = xd["profilev4"]["custom_payload"];
        uwu["hostHeader"] = xd["profilev4"]["custom_host"];
        uwu["sniValue"] = xd["profilev4"]["custom_sni"];
        try { uwu["aotRealmHost"] = xd["profilev4"]["use_realm_host"].toString() } catch(e) {};
        uwu["aotRealmHostValue"] = xd["profilev4"]["realm_host"];
        try { uwu["aotOverrideHost"] = xd["profilev4"]["override_primary_host"].toString() } catch(e) {};
        uwu["aotPrimaryHost"] = xd["profilev4"]["primary_host"];
        try { uwu["serverPort"] = xd["profilev4"]["server_port"].toString() } catch(e) {};
        uwu["aotNode"] = xd["profilev4"]["primary_node"];
        uwu["aotBaseTunnel"] = xd["profilev4"]["base_tunnel"];
    }
    if(!!xd["descriptionv4"]) {
        uwu["note1"] = xd["descriptionv4"];
    }
    if(!!xd["protextras"]) {
        //sorry for this but the bot wont read raw booleans somehow
        try { uwu["antiSniff"] = xd["protextras"]["anti_sniff"].toString() } catch(e) {};
        try { uwu["mobileData"] = xd["protextras"]["mobile_data"].toString() } catch(e) {};
        try { uwu["blockRoot"] = xd["protextras"]["block_root"].toString() } catch(e) {};
        try { uwu["antiSniff"] = xd["protextras"]["anti_sniff"].toString() } catch(e) {};
        try { uwu["passwordProtected"] = xd["protextras"]["password"].toString() } catch(e) {};
        try { uwu["cryptedPasswordValueMD5"] = xd["protextras"]["password_value"].toString() } catch(e) {};
        try { uwu["hwidEnabled"] = xd["protextras"]["id_lock"].toString() } catch(e) {};
        try { uwu["cryptedHwidValueMD5"] = xd["protextras"]["id_lock_value"].toString() } catch(e) {};
        try { uwu["enableExpire"] = xd["protextras"]["expiry"].toString() } catch(e) {};
        try { uwu["expireDate"] = new Date(xd["protextras"]["expiry_value"]).toUTCString() } catch(e) {};
    }
    uwu["credits"] = "Encryption research for this HCDrill module to aliraqy_2021";
    return JSON.stringify(uwu);
}
function decryptStage(filecontent, configFile) {
    //reeeeeeeeeeeeeeeeeeeeeeeee
    var keyFile;
    var complete = false;
    var response = {};
    response["content"] = "";
    response["raw"] = "";
    response["error"] = 0;
    try {
        keyFile = JSON.parse(fs.readFileSync(configFile["keyFile"]).toString())["aot"];
    } catch(error) {
        response["error"] = 1;
        return response;
    }
    //decrypting stage
    for(let c = 0; c < keyFile.length; c++) {
        key = Buffer.from(keyFile[c], "base64");
        try {
            response["content"] = aesDecrypt(filecontent.toString(), key);
            complete = true;
        } catch(error) {}
    }
    if(complete) {
        response["raw"] = response["content"];
        response["content"] = parseDecoded(response["content"]);
        //return;
        return response;
    } else {
        //response["content"] = parseDecoded(response["content"]); //please comment this one once finished
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