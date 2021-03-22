# Moleskine
A discord bot for the popular Belgian tv show "De Mol" ([invite link](https://discord.com/api/oauth2/authorize?client_id=818578882000846898&permissions=76864&scope=bot))

## ES6
As node doesn't support ES6 out of the box (and `type: module` not a clean solution is) this bot uses rimraf and babel to automatically transpile the code.

## Logging
This project uses Winston for logging. The only supported levels are: error, warn and info. Please do not use any of the other levels when contributing. It is automatically set up such that while developing the logs are printed to stdout and in production these are written to `moleskine.log`.

## How to run locally
1. Fill the `config.json` in as shown in `template.config.json`
2. Install the dependencies
3. Run `npm run watch:dev`to run the bot

## Publishing
Publishing is as simple as making the `config.json` and running `npm run prod`.

### Screen
The usage of `screen` is recommended above `nohup`, as nohup errors with the current npm setup.
To use screen for continuous running on your server follow these steps:
1. Make sure you have `screen` installed with `screen --version`
2. Run `screen -S moleskine` to start a named session with the name "moleskine"
3. Follow the steps mentioned in publishing
4. To exit the sessions press `Ctrl-a` followed by `Ctrl-d`

In the case that you want to restart the bot, or shut it down, you can resume the screen with: `screen -r moleskine`.

## Bot usage
The default prefix is '?'. To change this set the owners setting manually in your MongoDB (Atlas) instance, then issue the `setSetting` command.
  
To get a list of all available commands run: `[prefix]help`.
