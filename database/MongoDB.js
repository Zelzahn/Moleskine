const Discord = require('discord.js');
const config = require('./../config.json');
const	guildsDB = require('./Schematics/Guild.js');
const	membersDB = require('./Schematics/User.js');
const	logsDB = require('./Schematics/Log.js');

// Create/find Guilds Database
module.exports.getGuildDB = async function(guildID) {

	let guildDB = await guildsDB.findOne({ id: guildID });

	if(guildDB) {
		return guildDB;
	}
	else {
		guildDB = new guildsDB({
			id: guildID,
		});
		await guildDB.save().catch(err => console.log(err));
		return guildDB;
	}
};

// Create/find Members Database
module.exports.getMemberDB = async function(userID, guildID) {

	let memberDB = await membersDB.findOne({ id: userID, guildID: guildID });
	if(memberDB) {
		return memberDB;
	}
	else {
		memberDB = new membersDB({
			id: userID,
			guildID: guildID,
		});
		await memberDB.save().catch(err => console.log(err));
		return memberDB;
	}
};

// Create/find Log in Database
module.exports.getLogDB = async function(user, guild, cmd) {

	const logDB = new logsDB({
		commandName: cmd.name,
		author: { username: user.username, discriminator: user.discriminator, id: user.id },
		guild: { name: guild ? guild.name : 'dm', id: guild ? guild.id : 'dm' },
	});
	await logDB.save().catch(err => console.log(err));
	return;

};
