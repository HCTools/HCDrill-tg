#!/usr/bin/env node
/*
* HCDrill v2.2.2 - Telegram version
* Coded by PANCHO7532 - P7COMunications LLC
* Copyright (c) HCTools Group - 2021
*
* This program comes with a LICENSE file that you must read before redistributing or modifying this code.
*/
/*
* TODO:
* - fix some "undecryptable" custom and sockshttp files (23/01/21: patch provided for custom, under investigation)
* - investigate Telegram issues with file retrieving
*/
const fs = require('fs');
const path = require('path');
const mainUtils = require('./lib/mainUtils');
var configFile;
var languageFile;
var usersFile; //json database to store user ids and usernames. useful for /announce command.
var layoutFile;
var cleanFiles = true;
var showHelp = false;
//reading all decoding libs
var libMethodsDirListArray = fs.readdirSync(__dirname + "/lib/methods");
var libMethodsArray = [];
for(let c = 0; c < libMethodsDirListArray.length; c++) {
    if(path.parse(libMethodsDirListArray[c]).ext == ".js") {
        libMethodsArray.push(require(__dirname + "/lib/methods/" + libMethodsDirListArray[c]));
    }
}
//config file reading
try {
    configFile = JSON.parse(fs.readFileSync(__dirname + "/cfg/config.inc.json"));
} catch(error) {
    console.log("[ERROR] - There was an error while loading config file at module " + path.parse(__filename)["base"]);
    process.exit();
}
//language file reading
try {
    languageFile = JSON.parse(fs.readFileSync(__dirname + "/cfg/lang/" + configFile["language"] + ".lang.json"));
} catch(error) {
    console.log("[ERORR] - There was an error while loading language file.");
    process.exit();
}
//layout file reading
try {
    layoutFile = JSON.parse(fs.readFileSync(__dirname + "/cfg/layout/" + configFile["layout"] + ".layout.json"));
} catch(error) {
    console.log("[ERORR] - There was an error while loading the layout file.");
    process.exit();
}
try {
    usersFile = JSON.parse(fs.readFileSync(__dirname + "/cfg/chatIDS.json"));
} catch(error) {
    console.log("[ERROR] - There was an error while loading chat IDs file at module " + path.parse(__filename)["base"]);
    process.exit();
}


//splash
console.log("HCDrill v2.2.1\r\nCopyright (c) HCTools Group - 2021\r\nCoded by P7COMunications LLC");
for(let c = 0; c < process.argv.length; c++) {
    switch(process.argv[c]) {
        case "--botToken":
        case "-bt":
            console.log("[INFO] - Your bot token was automatically saved into the main configuration file.");
            configFile["botToken"] = process.argv[c+1];
            break;
        case "--dir":
        case "-d":
            console.log("[INFO] - Your new download directory was automatically saved into the main configuration file.");
            configFile["storagePath"] = process.argv[c+1];
            break;
        case "--keyFile":
        case "-k":
            console.log("[INFO] - Your new key file path was automatically saved into the main configuration file.");
            configFile["keyFile"] = process.argv[c+1];
            break;
        case "--maxFileSize":
        case "-mfs":
            console.log("[INFO] - Your new max file size limit was automatically saved into the main configuration file.");
            configFile["maxFileSize"] = parseInt(process.argv[c+1]);
            break;
        case "--loopRefresh":
        case "-lrf":
            console.log("[INFO] - Your new interval value for internal loop function was automatically saved into the main configuration file.");
            configFile["loopRefresh"] = parseInt(process.argv[c+1]);
            break;
        case "--language":
        case "-lng":
            console.log("[INFO] - Your new language preference was automatically saved into the main configuration file.");
            configFile["language"] = process.argv[c+1];
            break;
        case "--conserve":
        case "-c":
            cleanFiles = false;
            break;
        case "--help":
        case "-h":
            showHelp = true;
            break;
    }
}
if(showHelp) {
    var helpContent = [
        "Usage: node script.js [--args -a...]",
        "",
        "--botToken, -bt\t\tSet your bot token",
        "--dir, -d\t\tSet a custom download dir for incoming files",
        "--keyFile, -k\t\tSpecify an exact path for a custom keyFile",
        "--maxFileSize, -mfs\tSet a limit (in bytes) for applicable files to decrypt",
        "--loopRefresh, -lrf\t\Set a custom interval (in ms) for internal loop functions",
        "--language, -lng\tSet a custom language for outgoing bot messages",
        "--conserve, -c\t\tConserve uploaded files",
        "--help, -h\t\tDisplay this help text"
    ];
    for(let c = 0; c < helpContent.length; c++) {
        console.log(helpContent[c]);
    }
    process.exit();
}
//functions
function banUser(actionID,unban){
	//let actionID = parseInt(messageText.split(" ")[1]);//user to be banned id.
	if (!unban){configFile["banned"].push(actionID);return;}
	
	for( let i = 0; i < configFile["banned"].length; i++){ 
				if ( configFile["banned"][i] === actionID){
					configFile["banned"].splice(i, 1); //Remove user from ban list.
					}
	}
	return;
}
function isAdmin(userID){
	if(configFile["admins"].includes(userID)){//ignore if sender's not an admin.
		return true;
	}
	return false;
}
function loopFunction() {
    //this function will execute in an interval method every few seconds
    try {
		fs.writeFileSync(__dirname + "/cfg/chatIDS.json", JSON.stringify(usersFile, null, "\t"));
        fs.writeFileSync(__dirname + "/cfg/config.inc.json", JSON.stringify(configFile, null, "\t"));
    } catch(error) {
        console.log("[ERROR] - An error occured writing the configuration or the database file.");
        process.exit();
    }
}
loopFunction(); //for update with latest changes from cmd
setInterval(loopFunction, configFile["loopRefresh"]);
const apiTelegram = require('node-telegram-bot-api');
const bot = new apiTelegram(configFile["botToken"], {polling: true});
bot.on('message', function(message) {
	var chatID = parseInt(message.chat.id); //Message sender user id.
	var userID = parseInt(message.from.id); //sender's user id.
	var messageText= message.text; //Recieved message content.
	var banRegex = /\/ban (\d)/;
	var unbanRegex = /\/unban (\d)/;
    if(message.from.is_bot) { return; } //ignoring messages from other bots.
	if(configFile["banned"].includes(chatID)){ return;} //ignoring messages from banned users.
	
	/*
	Here we check if the user exists in our cahtIDS.json
	If not, we create a new user.
	*/
	if(!usersFile.hasOwnProperty(chatID)){
		usersFile[chatID]= {
						   "date_joined":Date(),
						   "username":message.from.username,
						   "language_code":message.from.language_code
						   }
		}
	if (banRegex.test(messageText)){
		let banID = parseInt(messageText.split(" ")[1]);
		if(isAdmin(banID)){bot.sendMessage(chatID,languageFile["cantBanAdmin"]);return;}//Ignores banning other admins.
		if(!isAdmin(chatID)){//ignore if sender's not an admin.
			bot.sendMessage(chatID, languageFile["notAdmin"], {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
			return;
			}
		banUser(banID,false)
		bot.sendMessage(banID, languageFile["bannedWarning"]);
		bot.sendMessage(chatID, languageFile["bannedUser"]+banID, {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
		return;
	}
	else if (unbanRegex.test(messageText)){
		let unbanID = parseInt(messageText.split(" ")[1]); //user to be un-banned id.
		if(!isAdmin(chatID)){//ignore if sender's not an admin.
			bot.sendMessage(chatID, languageFile["notAdmin"], {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
			return;
			}
		banUser(unbanID,true);
		bot.sendMessage(unbanID, languageFile["unbannedWarning"]);
		bot.sendMessage(chatID, languageFile["unbannedUser"]+unbanID, {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
		}
	
    switch(message.text) {
        //here goes any custom slash commands and respective actions
        case "/start":
            //action
            bot.sendMessage(chatID, languageFile["startMessage"], {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
            return;
        case "/statsd":
            //action
            var response = "";
            response += languageFile["statsMessage_recvfiles"] + " " + configFile["stats"]["totalFiles"] + "\r\n";
            response += languageFile["statsMessage_decryptedfiles"] + " " + configFile["stats"]["decryptedFiles"] + "\r\n";
            response += languageFile["statsMessage_failedfiles"] + " " + configFile["stats"]["failedFiles"] + "\r\n";
            bot.sendMessage(message.chat.id, response, {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
            return;
		case "/uptime":
			var uptimeMessage = languageFile["uptime"] + mainUtils.format_time();
			bot.sendMessage(message.chat.id, uptimeMessage, {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
			return;
    }
    if(!message.document) { return; } //ignoring other messages that aren't a document
    /*ignore other file extensions foreign to whitelist*/
    var extPass = false;
    for(let c = 0; c < configFile["validExtensions"].length; c++) {
        if(path.parse(message.document.file_name)["ext"] == configFile["validExtensions"][c]) {
            extPass = true;
        }
    }
    if(!extPass) {
        configFile["stats"]["failedFiles"]++;
        bot.sendMessage(message.chat.id, languageFile["invalidExtension"], {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
        return;
    }
    //checking if file is too big
    if(message.document.file_size > configFile["maxFileSize"]) {
        configFile["stats"]["failedFiles"]++;
        bot.sendMessage(message.chat.id, languageFile["heavyFile"], {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
        return;
    }
    bot.getFile(message.document.file_id).then(function(value) {
        //aaand, here we go!
        var localResponse = mainUtils.telegramRetrieve(value);
        if(localResponse["localName"].toString().indexOf("-1") != -1) {
            bot.sendMessage(message.chat.id, languageFile["downloadError1"], {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
            return;
        }
        var decryptionStage;
        configFile["stats"]["totalFiles"] = localResponse["fileNumber"];
        //initialize decryption process (and lib calling)
        for(let c = 0; c < libMethodsArray.length; c++) {
            for(let d = 0; d < libMethodsArray[c].metadata["schemeLength"]; d++) {
                decryptionStage = libMethodsArray[c].decryptFile(fs.readFileSync(configFile["storagePath"] + localResponse["localName"]), configFile, d);
                if(decryptionStage["error"] != 1) { break; }
            }
            if(decryptionStage["error"] != 1) { break; }
        }
        if(decryptionStage["error"] == 1) {
            configFile["stats"]["failedFiles"]++;
            if(cleanFiles) { fs.unlinkSync(configFile["storagePath"] + localResponse["localName"]); }
            bot.sendMessage(message.chat.id, languageFile["decryptionFailed"], {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
        } else {
            configFile["stats"]["decryptedFiles"]++;
            if(cleanFiles) { fs.unlinkSync(configFile["storagePath"] + localResponse["localName"]); }
            //removing characters that may be foreign to telegram idk
            //console.log(decryptionStage);
            decryptionStage["content"] = decryptionStage["content"].replace(/[\u2000-\u20ef]/g, "");
            decryptionStage["raw"] = decryptionStage["raw"].replace(/[\u2000-\u20ef]/g, "");
            switch(message.caption) {
                case "raw":
                    //stuff
                    if(decryptionStage["raw"].length > 4096) {
                        bot.sendDocument(message.chat.id, Buffer.from(decryptionStage["raw"]), {caption: languageFile["largeContentWarning"], reply_to_message_id: message.message_id}, {filename: message.from.id + "_" + decryptionStage["raw"].length + Math.round(Math.random()*1000) + ".txt", contentType: "application/octet-stream"}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
                    } else {
                        bot.sendMessage(message.chat.id, decryptionStage["raw"], {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
                    }
                    break;
                case "json":
                    //stuff
                    if(decryptionStage["content"].length > 4096) {
                        bot.sendDocument(message.chat.id, Buffer.from(decryptionStage["content"]), {caption: languageFile["largeContentWarning"], reply_to_message_id: message.message_id}, {filename: message.from.id + "_" + decryptionStage["content"].length + Math.round(Math.random()*1000) + ".txt", contentType: "application/octet-stream"}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
                    } else {
                        bot.sendMessage(message.chat.id, decryptionStage["content"], {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
                    }
                    break;
                case "txt":
                    //stuff 2: electric boogaloo
                    bot.sendDocument(message.chat.id, Buffer.from(mainUtils.jsonResponseParsing(decryptionStage["content"], languageFile, layoutFile)), {caption: "", reply_to_message_id: message.message_id}, {filename: message.from.id + "_" + decryptionStage["content"].length + Math.round(Math.random()*1000) + ".txt", contentType: "application/octet-stream"}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
                    break;
                default:
                    //stuff (so, basically this is the parsed output and etc)
                    if(decryptionStage["content"].length > 4096) {
                        bot.sendDocument(message.chat.id, Buffer.from(mainUtils.jsonResponseParsing(decryptionStage["content"], languageFile, layoutFile)), {caption: languageFile["largeContentWarning"], reply_to_message_id: message.message_id}, {filename: message.from.id + "_" + decryptionStage["content"].length + Math.round(Math.random()*1000) + ".txt", contentType: "application/octet-stream"}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
                    } else {
                        bot.sendMessage(message.chat.id, mainUtils.jsonResponseParsing(decryptionStage["content"], languageFile, layoutFile), {reply_to_message_id: message.message_id}).catch(function(error) { console.log("[ERROR] - " + error.message + " at chat id: " + message.chat.id)});
                    }
                    break;
            }
        }
    });
});
//error handling and all bullshit
bot.on('error', function(error) {
    console.log("[UNEXPECTED-ERROR] - " + error.message);
});
bot.on('polling_error', function(error){
    console.log("[POLLING-ERROR] - " + error.message);
});
bot.on('webhook_error', function(error) {
    console.log("[WEBHOOK-ERROR] - " + error.message);
});