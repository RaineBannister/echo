const Discord = require('discord.js');
const PERMISSIONS = require('./permissions');

class Command {
    /**
     *
     * @param {string} command
     * @param {string} args
     * @param {string} desc
     * @param {Array.<number>} discordPermissions
     * @param {Array.<number>} permissions
     * @param {function} called
     */
    constructor(command, args, desc, discordPermissions, permissions, called) {
        this.command = command;
        this.args = args;
        this.desc = desc;
        this.discordPermissions = discordPermissions;
        this.permissions = permissions;
        this.called = called;
    }
}

/**
 * Start of generating array of commands for the server.
 * @type {Array.<Command>}
 */
let commands = [];
commands.push(
    new Command(
        'mute',
        '<time> <@user> [@user...]',
        'Mutes a player for a certain amount of minutes',
        [Discord.Permissions.FLAGS.MUTE_MEMBERS],
        [],
        function(message, args, db) {
            let toMute = message.mentions.members.array();
            let time = parseInt(args[1]);
            if(isNaN(time)) {
                message.channel.send('Beep, Boop! You didn\'t give me a number!');
            } else {
                let muted = message.guild.roles.find("name", "muted");

                if(muted === undefined) {
                    message.channel.send('Beep, Boop! This server does not have a "muted" role, sorry!');
                    return;
                }

                for(let i = 0; i < toMute.length; i ++) {
                    let mute = toMute[i];
                    mute.addRole(muted);

                    mute.send("You have been muted in " + message.guild.name + " for " + time + " minutes.");

                    setTimeout(function(){
                        mute.removeRole(muted);
                    },time*1000*60);
                }
            }
        }
    )
);

commands.push(
    new Command(
        'say',
        '[text]',
        'Makes this bot say something',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        [PERMISSIONS.SAY],
        function(message, args, db) {
            let text = '';
            for(let i = 1; i < args.length; i ++) {
                text += ' ' + args[i];
            }
            message.channel.send(text);
        }
    )
);

commands.push(
    new Command(
        'msg',
        '<@user> [text]',
        'Private messages a user',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        [PERMISSIONS.MSG],
        function(message, args, db) {
            let text = '';
            for(let i = 2; i < args.length; i ++) {
                text += ' ' + args[i];
            }
            let msg = message.mentions.members.array();
            for(let i = 0; i < msg.length; i ++) {
                msg[i].send(text);
            }
            message.channel.send('Beep, Boop! Message has been sent!');
        }
    )
);

commands.push(
    new Command(
        'welcome',
        '[text]',
        'Sets the message a user is private messaged when they join this server',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        [PERMISSIONS.WELCOME],
        function(message, args, db) {
            let text = '';
            for(let i = 1; i < args.length; i ++) {
                text += ' ' + args[i];
            }
            db.servers[message.guild.id].welcome = text;
            message.channel.send('Beep, Boop! Welcome message set!');
        }
    )
);

commands.push(
    new Command(
        'grant',
        '<command name> [@user...]',
        'Grants a user access to a command',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        [PERMISSIONS.GRANT],
        function(message, args, db) {
            message.mentions.members.array().forEach(function(member) {
                let mem = db.servers[message.guild.id].members[member.id];
                if(mem.permissions.indexOf(PERMISSIONS[args[1]]) === -1)
                    mem.permissions.push(PERMISSIONS[args[1]]);
            });
        }
    )
);

commands.push(
    new Command(
        'revoke',
        '<command name> [@user...]',
        'Revokes a user\'s access to a command',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        [PERMISSIONS.REVOKE],
        function(message, args, db) {
            message.mentions.members.array().forEach(function(member) {
                let mem = db.servers[message.guild.id].members[member.id];
                if(mem.permissions.indexOf(PERMISSIONS[args[1]]) !== -1) {
                    let temp = mem.permissions;
                    temp.splice(temp.indexOf(PERMISSIONS[args[1]]), 1);
                    mem.permissions = temp;
                }
            });
        }
    )
);

commands.push(
    new Command(
        'warn',
        '<@user> [reason]',
        'Warns a user',
        [Discord.Permissions.FLAGS.ADMINISTRATOR, Discord.Permissions.FLAGS.KICK_MEMBERS],
        [PERMISSIONS.WARN],
        function(message, args, db) {
            if (message.mentions.members.array().length === 1) {
                let mention = message.mentions.members.array()[0];
                let member = db.servers[message.guild.id].members[mention.id];

                let text = '';
                for(let i = 2; i < args.length; i ++) {
                    text += ' ' + args[i];
                }

                if(member.warnings === undefined) member.warnings = [];
                let warns = member.warnings;
                warns.push(text);
                member.warnings = warns;
                mention.send("You have been warned on '" + message.guild.name + "' for: " + text + ". This is warning number " + member.warnings.length + ".");
            } else {
                message.channel.send("No user mentioned!");
            }
        }
    )
);

commands.push(
    new Command(
        'setinfo',
        '[text...]',
        'Lets you set info about yourself',
        [Discord.Permissions.FLAGS.SEND_MESSAGES],
        [],
        function(message, args, db) {
            let member = db.servers[message.guild.id].members[message.author.id];
            let text = '';
            for(let i = 1; i < args.length; i ++) {
                text += ' ' + args[i];
            }
            member.info = text;
            message.channel.send("Beep, boop! Set your info succesfully!");
        }
    )
);

commands.push(
    new Command(
        'info',
        '[@user]',
        'Views a user\'s info!',
        [Discord.Permissions.FLAGS.SEND_MESSAGES],
        [],
        function(message, args, db) {
            let member = undefined;
            if(message.mentions.members.array().length === 0) {
                // The user wants to view their own...
                member = db.servers[message.guild.id].members[message.author.id];
            } else if (message.mentions.members.array().length === 1) {
                // The user is wanting to view someone else...
                let mention = message.mentions.members.array()[0];

                member = db.servers[message.guild.id].members[mention.id];
            }

            if(member.info === undefined) {
                message.channel.send(message.member + ": That user has not set up their info yet!");
            } else {
                message.channel.send(message.member + ": " + member.info);
            }
        }
    )
);

commands.push(
    new Command(
        'permissions',
        '<@user>',
        'Views a user\'s permissions',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        [PERMISSIONS.PERMISSIONS],
        function(message, args, db) {
            if (message.mentions.members.array().length === 1) {
                let mention = message.mentions.members.array()[0];
                let member = db.servers[message.guild.id].members[mention.id];
                let permissions = member.permissions;
                let text = "";
                permissions.forEach(function(permission) {
                    Object.keys(PERMISSIONS).forEach(function(key) {
                        if(PERMISSIONS[key] === permission) {
                            text += " " + key;
                        }
                    })
                });
                message.channel.send("User has these permissions: " + text);
            } else {
                message.channel.send("No user mentioned!");
            }
        }
    )
);
module.exports = commands;