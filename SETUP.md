# Nova Setup Guide
---
## Prerequisits
- [Node.js](https://nodejs.org/en/download) 22.0.0 or later
- NPM 10.0.0 or later (Comes with Node.js unless specifically declined.)
- [Visual Studio Code](https://code.visualstudio.com/Download) (Other IDEs may be used, but VSC is recomended.)
---
# 1. Downloading & Installing Nova
### There are 3 main ways to install Nova's source code. All three of the following will have instructions below.
- Using the pre-made installers in `./install-tools`
- Installing the code in a zip package
- Cloning the repo over SSH (It is not recommended unless you know what you're doing.)

## Using Nova with a premade installer
### To use one of these simple copy the file into Powershell or Bash based on the OS you're using. Once the script is run, it will copy the files and install the packages, and that's it for this version.

## Using a download/zip.
### First off, confirm you have Node.js 22 or later installed on your system by running `node -v` in a powershell terminal.

### Secondly, if you haven't unzipped the folder, then do so now. It's recomended to unzip it into your Downloads folder.

### Thirdly, in a powershell terminal run `cd %UserProfile%\Downloads\NovaBot` once the folder is unzipped. (*If the name of the unzipped folder is different, then change `NovaBot` to the correct name.*)

### Fourthly, install all of Nova's dependancies by running these in the powershell terminal from above. `npm i`(i is short for install. This installs the packages listed in the `package.json` file.) then if needed run `npm audit fix`.

## Using SSH
### If you're using SSH, you probably know what you're doing. If not, go ask ChatGPT or use one of the above methods.
---
# 2. Setting up Nova
### Setup of Nova is rather simple. with most commands using standard assets except for emojis.

## Setting up core services
### The `.env` file is where most of the API keys you use live. This is done for security reasons and so they're all in one place.
### Here's some info on how to get the core API keys. (Discord, Statuspage, & Firebase)

## Getting the Discord keys
### To get the token, go over to the [Discord Dev Homepage](https://discord.com/developer) and select your bot, then click "Bot" then regen the token. Copy this and paste it into the `.env` file. While you're there, you'll also need your app ID, which you can get from the overview screen.

## Getting the Statuspage Keys
### For Statuspage integration, you need an API key. You get this by clicking in the top right, then clicking API Keys. After this, just set up your page using the Page ID in page settings and the component IDs in the edit menu for the components.

## Additional setups
### If you do not wish to use additional services, then simply either keep the API key blank in the `.env` file or remove it and the command/module that uses it.
---
# 3. Running Nova
### So it's finally set up. What now?

## The Testbench
### If you wish to test specific parts/modules of the bot, then add them to `testbench.js` and run `npm run tbench`.

## Running the actual bot
### To start the bot simply run `npm start`. This will first publish all the commands in the `commands` folder. Then it will start sharding the bot and start it.
---
##### Last updated: `7/3/25`
###### Written by `@thatWest7014`
