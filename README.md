# Moleskine
A discord bot for the popular Belgian tv show "De Mol"

## ES6
As node doesn't support ES6 out of the box (and `type: module` not a clean solution is) this bot uses rimraf and babel to automatically transpile the code.

## Logging
This project uses Winston for logging. The only supported levels are: error, warn and info. Please do not use any of the other levels when contributing. It is automatically set up such that while developing the logs are printed to stdout and in production these are written to `moleskine.log`.

## How to run locally
1. Fill the `config.json` in as shown in `template.config.json`
2. Run `npm run watch:dev`to run the bot

## Publishing
Publishing is as simple as making the `config.json` and running `npm run prod`.

## Bot usage
The default prefix is '?'. To change this set the owners setting manually in your MongoDB (Atlas) instance, then issue the `setSetting` command.
  
To get a list of all available commands run: `[prefix]help`.
