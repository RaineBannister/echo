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


const token = config.key;

//TODO: Set up a separate system for throttling messages being sent

client.on('channelCreate', (channel) => {
    let log = generateLog();

    // Make sure it is a guild channel
    if(["text","voice","category"].includes(channel.type)) {
        log.setTitle(`Channel ${channel.name} was created`);
        sendLog(channel.guild, log);
    }
});

client.on('channelDelete', (channel) => {
    let log = generateLog();

    // Make sure it is a guild channel
    if(["text","voice","category"].includes(channel.type)) {
        log.setTitle(`Channel ${channel.name} was deleted`);
        sendLog(channel.guild, log);
    }
});

client.on('channelPinsUpdate', (channel, time) => {
    let log = generateLog();

    // Make sure it is a guild channel
    if(["text","voice","category"].includes(channel.type)) {
        log.setTitle(`Channel ${channel.name}'s pins were updated`);
        sendLog(channel.guild, log);
    }
});

client.on('channelUpdate', (oldChannel, newChannel) => {
    let log = generateLog();

    // Make sure it is a guild channel
    if(["text","voice","category"].includes(newChannel.type)) {
        log.setTitle(`Channel ${newChannel.name}'s was updated`);
        sendLog(newChannel.guild, log);
    }
});

client.on('emojiCreate', (emoji) => {
    let log = generateLog();

    log.setTitle(`Emoji ${emoji.name} was created`);
    sendLog(emoji.guild, log);
});

client.on('emojiDelete', (emoji) => {
    let log = generateLog();

    log.setTitle(`Emoji ${emoji.name} was deleted`);
    sendLog(emoji.guild, log);
});

client.on('emojiUpdate', (oldEmoji, newEmoji) => {
    let log = generateLog();

    log.setTitle(`Emoji ${newEmoji.name} was updated`);
    sendLog(newEmoji.guild, log);
});

client.on('error', (error) => {
    console.log(error.message);
});

client.on('guildBanAdd', (guild, user) => {
    let log = generateLog();

    log.setTitle(`User ${user.username} has been banned`);
    sendLog(guild, log);
});

client.on('guildBanRemove', (guild, user) => {
    let log = generateLog();

    log.setTitle(`User ${user.username} has been unbanned`);
    sendLog(guild, log);
});

client.on('guildCreate', (guild) => {
    // This is called when we join a server
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
            server_id: message.guild.id,
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
            server_id: message.guild.id,
            name: 'welcome-message'
        },
        defaults: {
            value: ''
        }
    }).then(welcomeMessage => {
        if(welcomeMessage.value === "") return;

        member.send(welcomeMessage.value);
    });

    let log = generateLog();
    log.setTitle(`User ${member.user.username} joined the server`);
    sendLog(member.guild, log);
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

    // TODO: Send goodbye message

    db.ServerConfigParam.findOrCreate({
        where: {
            server_id: message.guild.id,
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

    let log = generateLog();
    log.setTitle(`User ${member.user.username} has left the server`);
    sendLog(member.guild, log);
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

    let log = generateLog();

    log.setTitle(`User ${newMember.user.username} has updated`);
    sendLog(newMember.guild, log);
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

        Commands.forEach(command => {
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
                    if(member.permissions.split(' ').includes(command.permission)) {
                        hasPermission = true;
                    }

                    if(hasPermission) {
                        command.called(message, args, db);
                    } else {
                        sendMessage(message.channel, "Sorry, " + message.member + " you do not have permission to run that command!", "(Tried: !" + args.join(' ') + ")");
                    }

                    message.delete(500);
                });
            }
        });
        if(com === 'help') {
            let embed = new Discord.RichEmbed()
                .setColor(config.color)
                .setTimestamp()
                .setDescription(`Beep, Boop! ${message.member} here are some commands you can use!`)
                .addField("!help", "Shows this help box")
                .setFooter("Echo 2.0.0");

            let list = [];
            Commands.forEach(command => {
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
                    if(member.permissions.split(' ').includes(command.permission)) {
                        hasPermission = true;
                    }

                    if(hasPermission) {
                        embed.addField(`!${command.command} ${command.args}`, `${command.desc}`);
                    }
                }));
            });

            Promise.all(list).then(() => {
                message.delete(500);
                message.channel.send(embed);
            })
        }
    }

    db.Message.create({
        server_id: message.guild.id,
        member_id: message.member.id,
        message: message.content
    });
});

client.on('messageDelete', (message) => {
    let log = generateLog();
    log.setTitle(`Message deleted`);
    log.setDescription(`${message.cleanContent}`);
    sendLog(message.guild, log);
});

client.on('messageUpdate', (oldMessage, message) => {
    if(!message.author.bot) {
        let log = generateLog();
        log.setTitle(`Message edited`);
        log.setDescription(`${message.cleanContent}`);
        sendLog(message.guild, log);
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
});

client.on('roleCreate', (role) => {
    // TODO: Add role to DB

    let log = generateLog();
    sendLog(role.guild, log);
});

client.on('roleDelete', (role) => {
    let log = generateLog();
    sendLog(role.guild, log);
});

//update role
client.on('roleUpdate', (oldRole, newRole) => {
    // TODO: Update role in DB

    let log = generateLog();
    sendLog(newRole.guild, log);
});


client.on('userUpdate', (oldUser, newUser) => {
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

/**
 *
 * @returns {module:discord.js.RichEmbed}
 */
function generateLog() {
    return new Discord.RichEmbed()
        .setTimestamp()
        .setColor(config.color);
}

function sendLog(server, log) {
    /*let logChannel = server.channels.get(db.servers[server.id].logChannel);
    if(logChannel !== undefined) {
        logChannel.send(log);
    }*/
}


