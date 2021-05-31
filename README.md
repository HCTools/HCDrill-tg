# HCDrill - Telegram version
Telegram bot for on-demand HTTP Custom, APK Custom, eProxy, SocksHTTP, TLS Tunnel, HA Tunnel and ShellTun configuration file decryptions

# Installation instructions
- Download Node.JS [Download Here](https://nodejs.org/en/download/ "Node.JS Download")
- Once installed, execute "install-dep" .sh/.bat script depending on your platform, or...
- ... execute `npm update --save` in the same folder as the script.

# Basic Usage
This script supports arguments to avoid editing the file and exposing your Telegram bot token. Instead, you need to pass it as an argument at each bot startup, like so:

`node HCDrill.js -bt (your bot token)`

You can also change the "storage" folder, (where the files from Telegram will be downloaded) using the -d argument

`node HCDrill.js -bt (your bot token here) -d (physical path where the incoming files should be stored)`

The bot automatically deletes incoming files at the end of each decryption call once the final data is returned.

If for some reason you want to keep the files, you can pass the -c argument and the bot will avoid deleting every downloaded file.

`node HCDrill.js -bt (your token) -d (temp dir path) -c`

All your preferences will be saved automatically into config.inc.json for your pleasure ;)

# Argument summary

```
-bt, --botToken         Start the bot with the desired token
-d, --dir               Set up an custom temporary directory path where all files from Telegram should be downloaded
-c, --conserve          Conserve files and not delete them after each requested task is done
-k, --keyFile           Specify an exact path for a custom keyFile
-mfs, --maxFileSize     Set a limit (in bytes) for applicable files to decrypt
-lrf, --loopRefresh     Set a custom interval (in ms) for internal loop functions
-lng, --language        Set a custom language for outgoing bot messages
-h, --help              Display the help
```

# Language Files and Translation
In the latest update (v2.1.0) we introduced .lang.json files, which contains all the strings used by the bot for communicate on Telegram. Feel free to translate these to your favorite language and pull request your translation to this repo.

All language files should be stored into cfg/lang/ and be set-up using -lng parameter when launching the bot... or modifying the "language" parameter on config.inc.json

# Layout Files
In this update (v2.1.0) layout files were introduced. These simple JSON files are located inside cfg/layout/ and contains the header and footer content displayed on the messages on telegram. Including the property indicator. You can have multiple layout files as long as those are located on cfg/layout/ and then specifying the name in the "layout" parameter inside config.inc.json

# Bug Reporting
Report any bugs in the "issues" section of this repository, attaching:
- Full terminal output, including full errors and details (feel free to censor/modify personal information that should appear if you think that it doesn't affect the behaviour of the bot runtime.)
- Full command used to execute the bot (make sure to censor your Telegram Token)
- File(s) *if any* to trigger the error
- Full steps to reproduce the error

The staff will review your issue and check if there's a solution.