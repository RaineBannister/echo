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
const JSONDatabase = require('./data.js');
const client = new Discord.Client();
let fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));

const token = config.key;

/**
 *
 * @type {JSONDatabase}
 */
let db = new JSONDatabase();

client.on('ready', ()=> {
    for(let i = 0; client.guilds.array().length > i; i ++) {
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

    db.save();

    client.user.setGame(config.game)
});

client.on('message', message => {
    if(message.channel.type === 'text') {
        if(message.content.charAt(0) === '!') {
            let args = message.content.substr(1).split(' ');
            let com = args[0].replace('!','');
            let found = false;
            for(let i = 0; i < Commands.length; i ++) {
                let command = Commands[i];
                if(command.command === com) { // we have the command, now to check permissions...
                    let hasPermission = false;

                    for(let j = 0; j < command.discordPermissions.length; j ++) {
                        if(message.member.hasPermission(command.discordPermissions[j])) {
                            hasPermission = true;
                        }
                    }

                    for(let j = 0; j < command.permissions.length; j ++) {
                        if(db.hasPermission(message.guild.id, message.author.id, command.permissions[j])) {
                            hasPermission = true;
                        }
                    }

                    if(hasPermission) {
                        command.called(message, args, db);
                    } else {
                        message.channel.send("Sorry, " + message.member + " you do not have permission to run that command!");
                    }

                    found = true;
                    break;
                }
            }
            if(com === 'help') {
                let help = "Beep, Boop! " + message.member + " here are some commands you can use!\n";
                help += "!help - shows this help box\n";
                for(let i = 0; i < Commands.length; i ++) {
                    let command = Commands[i];
                    let hasPermission = false;

                    for(let j = 0; j < command.discordPermissions.length; j ++) {
                        if(message.member.hasPermission(command.discordPermissions[j])) {
                            hasPermission = true;
                        }
                    }

                    for(let j = 0; j < command.permissions.length; j ++) {
                        if(db.hasPermission(message.guild.id, message.author.id, command.permissions[j])) {
                            hasPermission = true;
                        }
                    }

                    if(hasPermission) {
                        help += "!" + command.command + " " + command.args + " - " + command.desc + "\n";
                    }
                }
                message.channel.send(help);
                found = true;
            }

            message.delete(500);
        }

        //log the message
        if(db.servers[message.guild.id].logChannel !== undefined && !message.author.bot) {
            let logChannel = message.guild.channels.get(db.servers[message.guild.id].logChannel);
            if(logChannel !== undefined) {
                let log = '[' + message.channel.name + '] [' + message.author.username + '] ' + message.cleanContent;
                for(let i = 0; i < message.attachments.array().length; i ++) {
                    log += message.attachments.array()[i].url + "\n";
                }
                logChannel.send(log);
            }
        }

        //add user to data if needed
        for(let i = 0; i < db.data.servers.length; i++) {
            if(message.guild.id === db.data.servers[i].id) {
                let server = db.data.servers[i];
                //we have found the guild, now lets find the user within that guild so we can add him
                let found = false;
                for(let j = 0; j < server.members.length; j ++) {
                    if(server.members[j].id === message.author.id) {
                        found = true;
                    }
                }
                if(!found) {
                    //add the user
                    server.members.push({
                        "id": message.author.id,
                        "roles":[],
                        "permissions":[],
                        "name": undefined,
                    });
                    db.save();
                }
            }
        }
    } else if(message.channel.type === 'dm') {
        let log = '[' + message.author.username + '] ' + message.content;
        console.log(log);
    }

});

client.on('messageUpdate', (oldMessage, message) => {
    //log the message
    if(db.servers[message.guild.id].logChannel !== undefined && !message.author.bot) {
        let logChannel = message.guild.channels.get(db.servers[message.guild.id].logChannel);
        if(logChannel !== undefined) {
            let log = '[' + message.channel.name + '] [' + message.author.username + '] ' + message.cleanContent;
            for(let i = 0; i < message.attachments.array().length; i ++) {
                log += message.attachments.array()[i].url + "\n";
            }
            logChannel.send(log);
        }
    }
});
// Create an event listener for new guild members
client.on('guildMemberAdd', member => {

	let dbMember = db.servers[member.guild.id].members[member.id];
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
                welcomeChannel.send('Beep, Boop! Welcome, ' + member.displayName + '!');
            }
        }

        let s = db.servers[member.guild.id];
        if(s !== undefined && s.welcome !== undefined && s.welcome !== "") {
            member.send(s.welcome);
        }

    } catch(e) {}
});

client.on('guildMemberRemove', member => {
    // Send the message to the guilds default channel (usually #general), mentioning the member
	try {
        if(db.servers[member.guild.id].welcomeChannel !== undefined) {
            let welcomeChannel = member.guild.channels.get(db.servers[member.guild.id].welcomeChannel);
            if(welcomeChannel !== undefined) {
                welcomeChannel.send('Beep, Boop! Bye, ' + member.displayName + '!');
            }
        }
	} catch(e) {}
    
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    let member = db.servers[newMember.guild.id].members[newMember.id];
    member.roles = [];
    newMember.roles.array().forEach(function(role) {
       member.roles.push(role.id);
    });
    member.name = newMember.nickname;
});

client.login(token);

function padRight (string, num = 15, fill = " "){
    while(string.length < num) {
        string += fill;
    }
    return string;
};

function getName(server, id) {
    let members = server.members.array();
    for(let i = 0; i < members.length; i ++) {
        let member = members[i];
        if (member.id === id) {
            return member.displayName;
        }
    }
}


