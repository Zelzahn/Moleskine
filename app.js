// DIT IS EEN PROBEERSEL!!!!!

const Discord = require('discord.js');
const config = require('./config.json'),
	fs = require('fs'),
	util = require('util'),
	readdir = util.promisify(fs.readdir),
	mongoose = require('mongoose');

const client = new Discord.Client();

client.events = new Discord.Collection();
client.commands = new Discord.Collection();
client.data = require('./database/MongoDB.js');
client.logger = require('./modules/Logger.js');
client.tools = require('./modules/Tools.js');

async function startUp() {

	// Starting all events
	const eventFiles = fs.readdirSync('./events/').filter(file => file.endsWith('.js'));
	for (const file of eventFiles) {
		const event = require(`./events/${file}`);
		const eventName = file.split('.')[0];
		client.logger.event(`Loading Event - ${eventName}`);
		client.on(eventName, event.bind(null, client));
	}

	// Load all the commands
	const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		client.commands.set(command.name, command);
	}

	// Connect to mongoose database
	mongoose.connect(config.mongoDB, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}).then(() => {
		// If it connects log the following
		client.logger.log('Connected to the Mongodb database.', 'log');
	}).catch((err) => {
		// If it doesn't connect log the following
		client.logger.log('Unable to connect to the Mongodb database. Error:' + err, 'error');
	});
	client.login(config.token);
}

startUp();


// if there are errors, log them
client.on('disconnect', () => client.logger.log('Bot is disconnecting...', 'warn'))
	.on('reconnecting', () => client.logger.log('Bot reconnecting...', 'log'))
	.on('error', (e) => client.logger.log(e, 'error'))
	.on('warn', (info) => client.logger.log(info, 'warn'));

// For any unhandled errors
process.on('unhandledRejection', (err) => {
	console.error(err);
});