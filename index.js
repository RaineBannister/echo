/**
 * Created by kee22 on 4/7/2017.
 */

const Discord = require("discord.js");
/**
 *
 * @type {Array.<Command>}
 */
const Commands = require("./commands.js");
const PERMISSIONS = require('./permissions.js');
let db = require('./database');
const client = new Discord.Client();
let fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));
let filter = require('./language-filter');
let filtered_words = [];

const token = config.key;

//TODO: Set up a separate system for throttling messages being sent

client.on('channelCreate', (channel) => {
	if(channel.type !== 'text') return;
    db.Message.create({
        server_id: channel.guild.id,
        member_id: channel.id.client.user.id,
        channel_id: channel.id,
        content: channel.name,
        type: "CHANNEL-CREATED"
    });
});

client.on('channelDelete', (channel) => {
    db.Message.create({
        server_id: channel.guild.id,
        member_id: channel.id.client.user.id,
        channel_id: channel.id,
        content: channel.name,
        type: "CHANNEL-DELETED"
    });
});

client.on('channelPinsUpdate', (channel, time) => {
    db.Message.create({
        server_id: channel.guild.id,
        member_id: channel.id.client.user.id,
        channel_id: channel.id,
        content: channel.name,
        type: "CHANNEL-PINS_UPDATE"
    });
});

client.on('channelUpdate', (oldChannel, newChannel) => {

    // TODO: Actually check what was updated (and if it was relevant)
    db.Message.create({
        server_id: newChannel.guild.id,
        member_id: 0,
        channel_id: newChannel.id,
        content: newChannel.name,
        type: "CHANNEL-UPDATED"
    });
});

client.on('emojiCreate', (emoji) => {
    db.Message.create({
        server_id: emoji.guild.id,
        member_id: emoji.client.user.id,
        channel_id: 0,
        content: emoji.name,
        type: "EMOJI-CREATED"
    });
});

client.on('emojiDelete', (emoji) => {
    db.Message.create({
        server_id: emoji.guild.id,
        member_id: emoji.client.user.id,
        channel_id: 0,
        content: emoji.name,
        type: "EMOJI-DELETED"
    });
});

client.on('emojiUpdate', (oldEmoji, newEmoji) => {

    // TODO: Actually check what was updated so that we can see relevant information
    db.Message.create({
        server_id: newEmoji.guild.id,
        member_id: newEmoji.client.user.id,
        channel_id: 0,
        content: newEmoji.name,
        type: "EMOJI-UPDATED"
    });
});

client.on('error', (error) => {
    console.log(error.message);
});

client.on('guildBanAdd', (guild, user) => {
    db.Message.create({
        server_id: guild.id,
        member_id: user.id,
        channel_id: 0,
        content: user.username,
        type: "MEMBER-BANNED"
    });
});

client.on('guildBanRemove', (guild, user) => {
    db.Message.create({
        server_id: guild.id,
        member_id: user.id,
        channel_id: 0,
        content: user.username,
        type: "MEMBER-UNBANNED"
    });
});

client.on('guildCreate', (guild) => {
    // This is called when we join a server
    // TODO: investigate if we need to add everything at this time...
});

client.on('guildMemberAdd', member => {
    /*let dbMember = db.servers[member.guild.id].members[member.id];
    if(dbMember !== undefined) {
        if(dbMember.roles === undefined) return;
        dbMember.roles.forEach(function(r) {
            let role = member.guild.roles.find(function(rol) {
                return rol.id === r;
            });
            if(role !== undefined) {
                let p = member.addRole(role, "Adding role after user re-joined the server");
            }
        });

        if(dbMember.name !== undefined) {
            let p = member.setNickname(dbMember.name);
        }
    } else {
        let s = db.getServer(member.guild.id);
        if(s !== undefined) {
            s.members.push({
                "id": member.id,
                "roles":[],
                "permissions":[],
                "name": undefined,
            });
            db.save();
        }
    }

    try {
        if(db.servers[member.guild.id].welcomeChannel !== undefined) {
            let welcomeChannel = member.guild.channels.get(db.servers[member.guild.id].welcomeChannel);
            if(welcomeChannel !== undefined) {
                //welcomeChannel.send('Beep, Boop! Welcome, ' + member.displayName + '!');

                let embed = new Discord.RichEmbed()
                    .setDescription(`Beep, Boop! Welcome, ${member.displayName}!`)
                    .setThumbnail(member.user.avatarURL)
                    .setTimestamp()
                    .setColor(config.color);

                welcomeChannel.send(embed);
            }
        }

        let s = db.servers[member.guild.id];
        if(s !== undefined && s.welcome !== undefined && s.welcome !== "") {
            member.send(s.welcome);
        }

    } catch(e) {}*/

    // TODO: Add previous roles...

    db.ServerConfigParam.findOrCreate({
        where: {
            server_id: member.guild.id,
            name: 'welcome-channel'
        },
        defaults: {
            value: ''
        }
    }).then(channel => {
        let welcomeChannel = member.guild.channels.get(db.servers[member.guild.id].welcomeChannel);
        if(welcomeChannel === undefined) {
            throw "The channel could not be found";
        }

        let embed = new Discord.RichEmbed()
            .setDescription(`Beep, Boop! Welcome, ${member.displayName}!`)
            .setThumbnail(member.user.avatarURL)
            .setTimestamp()
            .setColor(config.color);

        welcomeChannel.send(embed);

    });

    db.ServerConfigParam.findOrCreate({
        where: {
            server_id: member.guild.id,
            name: 'welcome-message'
        },
        defaults: {
            value: ''
        }
    }).then(welcomeMessage => {
        if(welcomeMessage.value === "") return;

        member.send(welcomeMessage.value);
    });

    db.Message.create({
        server_id: member.guild.id,
        member_id: member.id,
        channel_id: 0,
        content: member.user.username,
        type: "MEMBER-JOINED"
    });
});

client.on('guildMemberRemove', member => {

    /*try {
        if(db.servers[member.guild.id].welcomeChannel !== undefined) {
            let welcomeChannel = member.guild.channels.get(db.servers[member.guild.id].welcomeChannel);
            if(welcomeChannel !== undefined) {

                let embed = new Discord.RichEmbed()
                    .setDescription(`Beep, Boop! Bye, ${member.displayName}! You will be missed!`)
                    .setThumbnail(member.user.avatarURL)
                    .setTimestamp()
                    .setColor(config.color);

                welcomeChannel.send(embed);
            }
        }
    } catch(e) {}*/

    db.ServerConfigParam.findOrCreate({
        where: {
            server_id: member.guild.id,
            name: 'welcome-channel'
        },
        defaults: {
            value: ''
        }
    }).then(channel => {
        let welcomeChannel = member.guild.channels.get(db.servers[member.guild.id].welcomeChannel);
        if(welcomeChannel === undefined) {
            throw "The channel could not be found";
        }

        let embed = new Discord.RichEmbed()
            .setDescription(`Beep, Boop! Bye, ${member.displayName}! You will be missed!`)
            .setThumbnail(member.user.avatarURL)
            .setTimestamp()
            .setColor(config.color);

        welcomeChannel.send(embed);

    });

    db.Message.create({
        server_id: member.guild.id,
        member_id: member.id,
        channel_id: 0,
        content: member.user.username,
        type: "MEMBER-LEFT"
    });
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    /*let member = db.servers[newMember.guild.id].members[newMember.id];
    member.roles = [];
    newMember.roles.array().forEach(function(role) {
        member.roles.push(role.id);
    });
    member.name = newMember.nickname;*/

    // TODO: Update db to match user's roles
    // TODO: Update db to match user's name
    // TODO: Track what actually changes
    db.Message.create({
        server_id: newMember.guild.id,
        member_id: newMember.id,
        channel_id: 0,
        content: newMember.user.username,
        type: "MEMBER-UPDATED"
    });
});

client.on('message', message => {
    // Check to make sure not in dms
    if(message.channel.type !== "text") return;

    // If user that sent message is not in the db add them
    db.Member.findOrCreate({
        where: {
            id: message.member.id
        }
    });
    db.ServerMember.findOrCreate({
        where: {
            server_id: message.guild.id,
            member_id: message.member.id
        },
        defaults: {
            name: message.member.displayName,
            permissions: "",
            info: ""
        }
    });

    // TODO: Make command prefix settable in the future
    // Check to see if command
    // Parse command
    if(message.content.startsWith("!")) {
        let args = message.content.substr(1).split(' ');
        let com = args[0].replace('!','');

        Commands.forEach(commandsGroup => {
            commandsGroup.commands.forEach(command => {
                if(command.command === com) { // we have the command, now to check permissions...
                    let hasPermission = false;

                    for(let j = 0; j < command.discordPermissions.length; j ++) {
                        if(message.member.hasPermission(command.discordPermissions[j])) {
                            hasPermission = true;
                        }
                    }

                    db.ServerMember.findOne({
                        where: {
                            server_id: message.guild.id,
                            member_id: message.member.id
                        }
                    }).then((member) => {
                        if(member.permissions.trim().split(' ').includes(command.permission.toString())) {
                            hasPermission = true;
                        }

                        if(hasPermission) {
                            try {
                                command.called(message, args, db);
                            } catch(error) {
                                sendMessage(message.channel, error, `(Tried: !${args.join(' ')})`);
                            }

                        } else {
                            sendMessage(message.channel, "Sorry, " + message.member + " you do not have permission to run that command!", "(Tried: !" + args.join(' ') + ")");
                        }

                        message.delete(500);
                    });
                }
            });
        });

        if(com === 'help') {
            let embed = new Discord.RichEmbed()
                .setColor(config.color)
				.setThumbnail(config.icon)
                .setTimestamp()
                .setDescription(`Beep, Boop! ${message.member} here are some commands you can use!`)
                .addField("!help", "Shows this help box")
                .setFooter("Echo 2.0.0");

            if(args.length === 1) {
                let list = [];
                Commands.forEach(commandsGroup => {
                    let commands = "";
                    commandsGroup.commands.forEach(command => {
                        let hasPermission = false;

                        for(let j = 0; j < command.discordPermissions.length; j ++) {
                            if(message.member.hasPermission(command.discordPermissions[j])) {
                                hasPermission = true;
                            }
                        }

                        list.push(db.ServerMember.findOne({
                            where: {
                                server_id: message.guild.id,
                                member_id: message.member.id
                            }
                        }).then((member) => {
                            if(member.permissions.trim().split(' ').includes(command.permission.toString)) {
                                hasPermission = true;
                            }

                            if(hasPermission) {
                                commands += `**!${command.command}** ${command.args} \n`;
                            }
                        }));
                    });
                    Promise.all(list).then(() => {
                        if(commands !== "") {
                            embed.addField(commandsGroup.name, commands);
                        }
                        list = [];
                    });

                });

                Promise.all(list).then(() => {
                    message.delete(500);
                    message.channel.send(embed);
                });
            } else if (args.length === 2) {
                // We are looking for help for a specific command
                // TODO: Add Functionality
            }
        }
    }

    // run the profanity check here
	/*let filtered = filter.checkMessage(message.cleanContent, filtered_words)
    if(filtered !== false) {
        message.delete();
		
		let text = "";
		for(let i = 0; i < filtered.length; i++) {
			text += `[${filtered[i].join(' => ')}] `;
		}
		
		db.Message.create({
			server_id: message.guild.id,
			member_id: message.member.id,
			channel_id: message.channel.id,
			content: text,
			type: "FILTERED-WORDS"
		});
    }*/

    db.Message.create({
        server_id: message.guild.id,
        member_id: message.member.id,
        channel_id: message.channel.id,
        content: message.content,
        type: "MESSAGE-SENT"
    });

    // TODO: Somehow save attachments to be viewed after deletion
    message.attachments.array().forEach(attachment => {
        db.Message.create({
            server_id: message.guild.id,
            member_id: message.member.id,
            channel_id: message.channel.id,
            content: attachment.url,
            type: "MESSAGE-ATTACHMENT"
        });
    });
});

client.on('messageDelete', (message) => {
    db.Message.create({
        server_id: message.guild.id,
        member_id: message.member.id,
        channel_id: message.channel.id,
        content: message.content,
        type: "MESSAGE-DELETED"
    });
});

client.on('messageUpdate', (oldMessage, message) => {
    if(!message.author.bot) {
        db.Message.create({
            server_id: message.guild.id,
            member_id: message.member.id,
            channel_id: message.channel.id,
            content: message.content,
            type: "MESSAGE-UPDATED"
        });
    }
});

client.on('ready', ()=> {
    /*for(let i = 0; client.guilds.array().length > i; i ++) {
        let guild = client.guilds.array()[i];

        let found = false;
        for(let j = 0; j < db.servers.length; j ++) {
            if(db.servers[guild.id] !== undefined) {
                found = true;
            }
        }

        if(!found) {
            db.data.servers.push({
                "id": guild.id,
                "members": [],
                "mutes": [],
            });
        }
    }

    db.save();*/



    // TODO: Check to see if DB has all the servers we are in
    // TODO: If the server isn't in the DB, add it

    // Set the current playing status
    client.user.setActivity(config.game, {type: config.type});

    // load up the filtered words to cache them..
    db.FilteredWord.findAll({
        attributes: ['word']
    }).then(words => {
        words.forEach(word => {
            filtered_words.push(word.word);
        });
    });
});

client.on('roleCreate', (role) => {
    // TODO: Add role to DB (invesgate if needed here)

    db.Message.create({
        server_id: role.guild.id,
        member_id: role.client.user.id,
        channel_id: 0,
        content: role.name,
        type: "ROLE-CREATED"
    });
});

client.on('roleDelete', (role) => {
    db.Message.create({
        server_id: role.guild.id,
        member_id: role.client.user.id,
        channel_id: 0,
        content: role.name,
        type: "ROLE-DELETED"
    });
});

//update role
client.on('roleUpdate', (oldRole, newRole) => {
    // TODO: Update role in DB

    db.Message.create({
        server_id: newRole.guild.id,
        member_id: newRole.client.user.id,
        channel_id: 0,
        content: newRole.name,
        type: "ROLE-UPDATED"
    });
});


client.on('userUpdate', (oldUser, newUser) => {
    // TODO: ???
    //let log = generateLog();
    //sendLog(newUser.guild, log);
});

client.login(token);

function sendMessage(channel, message, footer) {
    let embed = new Discord.RichEmbed()
        .setTimestamp()
        .setDescription(message)
        .setFooter(footer)
        .setColor(config.color);

    channel.send(embed);
}


