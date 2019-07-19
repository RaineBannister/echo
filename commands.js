const Discord = require('discord.js');
const PERMISSIONS = require('./permissions');
let fs = require('fs');
const global_config = JSON.parse(fs.readFileSync('config.json'));

class Command {
    /**
     *
     * @param {string} command
     * @param {string} args
     * @param {string} desc
     * @param {Array.<number>} discordPermissions
     * @param {Number} permissions
     * @param {function} called
     */
    constructor(command, args, desc, discordPermissions, permission, called) {
        this.command = command;
        this.args = args;
        this.desc = desc;
        this.discordPermissions = discordPermissions;
        this.permission = permission;
        this.called = called;
    }
}

//TODO: allow for more detailed explanations of each command with !help <command_name>

/**
 * Start of generating array of commands for the server.
 * @type {Array.<Object>}
 */
let commands = [];

let general  = {
    name: "General",
    commands: []
};

let administrative = {
    name: "Administrative",
    commands: []
};

let settings = {
    name: "Settings",
    commands: []
};

let permissions = {
    name: "Permissions",
    commands: []
};

let roles = {
    name: "Roles",
    commands: []
};

administrative.commands.push(
    new Command(
        'mute',
        '<time> <@user> [@user...]',
        'Mutes a player for a certain amount of minutes',
        [Discord.Permissions.FLAGS.MUTE_MEMBERS],
        PERMISSIONS.MUTE,
        function(message, args, db) {
            let toMute = message.mentions.members.array();
            let time = parseInt(args[1]);
            if(isNaN(time)) {
                throw "You didn't give me a number!";
            } else {
                let muted = message.guild.roles.find("name", "muted");

                if(muted === undefined) {
                    throw "No muted role found";
                }

                // TODO: Add mute to DB table
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

administrative.commands.push(
    new Command(
        'say',
        '[text]',
        'Makes this bot say something',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        PERMISSIONS.SAY,
        function(message, args, db) {
            let text = '';
            for(let i = 1; i < args.length; i ++) {
                text += ' ' + args[i];
            }
            sendMessage(message.channel, text);
        }
    )
);

administrative.commands.push(
    new Command(
        'msg',
        '<@user> [text]',
        'Private messages a user',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        PERMISSIONS.MSG,
        function(message, args, db) {
            let text = '';
            for(let i = 2; i < args.length; i ++) {
                text += ' ' + args[i];
            }
            let msg = message.mentions.members.array();
            for(let i = 0; i < msg.length; i ++) {
                msg[i].send(text);
            }
            sendMessage(message.channel, `Beep, Boop! Message has been sent!`);
        }
    )
);

permissions.commands.push(
    new Command(
        'grant',
        '<command name> [@user...]',
        'Grants a user access to a command',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        PERMISSIONS.GRANT,
        function(message, args, db) {
            message.mentions.members.array().forEach(function(member) {
                db.ServerMember.findOne({
                    where: {
                        server_id: message.guild.id,
                        member_id: member.id
                    }
                }).then(member => {
                    if((PERMISSIONS[args[1]] !== undefined && !member.permissions.split(' ').includes(PERMISSIONS[args[1]])) || message.member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
                        member.permissions += " " + PERMISSIONS[args[1]];
                        member.save();
                        sendMessage(message.channel, `Permission has been granted`);
                    }
                });
            });
        }
    )
);

permissions.commands.push(
    new Command(
        'revoke',
        '<command name> [@user...]',
        'Revokes a user\'s access to a command',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        PERMISSIONS.REVOKE,
        function(message, args, db) {
            message.mentions.members.array().forEach(function(member) {
                db.ServerMember.findOne({
                    where: {
                        server_id: message.guild.id,
                        member_id: message.member.id
                    }
                }).then(member => {
                    let permissions = member.permissions.split(" ");

                    if(permissions.indexOf(PERMISSIONS[args[1]]) !== -1) {
                        permissions.splice(permissions.indexOf(PERMISSIONS[args[1]]), 1);
                        member.permissions = permissions;
                        member.save();
                        sendMessage(message.channel, `Permission has been revoked`);
                    }
                });
            });
        }
    )
);

administrative.commands.push(
    new Command(
        'warn',
        '<@user> [reason]',
        'Warns a user',
        [Discord.Permissions.FLAGS.ADMINISTRATOR, Discord.Permissions.FLAGS.KICK_MEMBERS],
        PERMISSIONS.WARN,
        function(message, args, db) {
            if (message.mentions.members.array().length !== 1) {
                throw "You need to mention one user";
            }

            let mention = message.mentions.members.array()[0];

            let warning = args.splice(2).join(' ');

            db.Warning.create({
                    server_id: message.guild.id,
                    member_id: message.member.id,
                    warn: warning
                }
            ).then(() => {
                db.Warning.count({
                    where: {
                        server_id: message.guild.id,
                        member_id: message.member.id
                    }
                }).then(count => {
                    mention.send("You have been warned on '" + message.guild.name + "' for: " + warning + ". This is warning number " + count + ".");
                });
            });
        }
    )
);

general.commands.push(
    new Command(
        'warnings',
        '<@user>',
        'Gets a user\'s warnings',
        [Discord.Permissions.FLAGS.SEND_MESSAGES],
        PERMISSIONS.NONE,
        function(message, args, db) {
            if (message.mentions.members.array().length !== 1) {
                throw "You need to mention one user";
            }

            let mention = message.mentions.members.array()[0];

            db.Warning.findAll({
                where: {
                    server_id: message.guild.id,
                    member_id: message.member.id
                }
            }).then(warnings => {
                let embed = new Discord.RichEmbed();
                embed.setColor(global_config.color);
                embed.setDescription("Beep, Boop! Here are their warnings!");
                embed.setTimestamp();

                for(let i = 0; i < warnings.length; i ++) {
                    embed.addField(`Warning Number ${i + 1}`, warnings[i].warn);
                }

                message.channel.send(embed);
            });
        }
    )
);

general.commands.push(
    new Command(
        'setinfo',
        '[text...]',
        'Lets you set info about yourself',
        [Discord.Permissions.FLAGS.SEND_MESSAGES],
        PERMISSIONS.NONE,
        function(message, args, db) {
            db.ServerMember.findOne({
                where: {
                    server_id: message.guild.id,
                    member_id: message.member.id
                }
            }).then(member => {
                member.info = args.splice(1).join(" ");
                member.save().then(() => {
                    sendMessage(message.channel, "Beep, boop! Set your info successfully!");
                });
            });
        }
    )
);

general.commands.push(
    new Command(
        'info',
        '[@user]',
        'Views a user\'s info!',
        [Discord.Permissions.FLAGS.SEND_MESSAGES],
        PERMISSIONS.NONE,
        function(message, args, db) {
            let member_id = undefined;
            if(message.mentions.members.array().length === 0) {
                // The user wants to view their own...
                member_id = message.author.id;
            } else if (message.mentions.members.array().length === 1) {
                // The user is wanting to view someone else...
                let mention = message.mentions.members.array()[0];
                member_id = mention.id;
            }

            db.ServerMember.findOne({
                where: {
                    server_id: message.guild.id,
                    member_id: member_id
                }
            }).then(member => {
                if(member.info === "") {
                    sendMessage(message.channel, message.member + ": That user has not set up their info yet!");
                } else {
                    sendMessage(message.channel, message.member + ": " + member.info);
                }
            });
        }
    )
);

permissions.commands.push(
    new Command(
        'permissions',
        '<@user>',
        'Views a user\'s permissions',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        PERMISSIONS.PERMISSIONS,
        function(message, args, db) {
            if (message.mentions.members.array().length !== 1) {
                throw "You must mention one user";
            }

            let mention = message.mentions.members.array()[0];

            db.ServerMember.findOne({
                where: {
                    server_id: message.guild.id,
                    member_id: mention.id
                }
            }).then(member => {
                let text = "";
                let permissions = member.permissions.trim().split(' ');

                for (let i = 0; i < permissions.length; i ++) {
                    text += " " + PERMISSIONS.key(parseInt(permissions[i]));
                }

                message.channel.send("User has these permissions: " + text);
            });

            // let member = db.servers[message.guild.id].members[mention.id];
            // let permissions = member.permissions;
            // let text = "";
            // permissions.forEach(function(permission) {
            //     Object.keys(PERMISSIONS).forEach(function(key) {
            //         if(PERMISSIONS[key] === permission) {
            //             text += " " + key;
            //         }
            //     })
            // });
            //
        }
    )
);

administrative.commands.push(
    new Command(
        'clear',
        '<# of messages>',
        'Clears a number of messages',
        [Discord.Permissions.FLAGS.MANAGE_MESSAGES],
        PERMISSIONS.CLEAR,
        function(message, args, db) {
            let messages = parseInt(args[1]);
            let channel = message.channel;

            if(messages >= 100) {
                throw "You can only delete less than 100 messages";
            }

            // TODO: Investigate error from this action
            channel.bulkDelete(messages).then(function(message){
                sendMessage(channel, "Beep, Boop! Deleted " + messages + " messages!");
            }).catch(console.error);

        }
    )
);

settings.commands.push(
    new Command(
        'set',
        '',
        'Sets a variable',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        PERMISSIONS.NONE,
        function(message, args, db) {
            switch(args[1]) {
                case "welcome-channel": {
                    db.ServerConfigParam.findOrCreate({
                        where: {
                            server_id: message.guild.id,
                            name: 'welcome-channel'
                        },
                        defaults: {
                            value: ''
                        }
                    }).then(config => {
                        config[0].value = message.channel.id;
                        config[0].save();
                        sendMessage(message.channel, `Welcome channel has been set`);
                    });

                    /*db.servers[message.guild.id].welcomeChannel = message.channel.id;
                    sendMessage(message.channel, "Beep, Boop! This channel is now the welcoming channel!");*/
                } break;
                // Deprecated
                /*case "log-channel": {
                    db.ServerConfigParam.findOrCreate({
                        where: {
                            server_id: message.guild.id,
                            name: 'log-channel'
                        },
                        defaults: {
                            value: ''
                        }
                    }).then(config => {
                        //config[0].value = message.channel.id;
                        //config[0].save();
                    });

                    /!*db.servers[message.guild.id].logChannel = message.channel.id;
                    sendMessage(message.channel, "Beep, Boop! This channel is now the logging channel!");*!/
                } break;*/
            }
        }
    )
);

settings.commands.push(
    new Command(
        'unset',
        '',
        'Unsets a variable',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        PERMISSIONS.NONE,
        function(message, args, db) {
            switch(args[1]) {
                case "welcome-channel": {
                    db.ServerConfigParam.findOrCreate({
                        where: {
                            server_id: message.guild.id,
                            name: 'welcome-channel'
                        },
                        defaults: {
                            value: ''
                        }
                    }).then(config => {
                        config[0].value = '';
                        config[0].save();
                        sendMessage(message.channel, `Welcome channel has been unset. Welcome messages won't appear until you reset it`);
                    });
                    /*db.servers[message.guild.id].welcomeChannel = undefined;
                    sendMessage(message.channel, "Beep, Boop! Unset the welcome channel!");*/
                } break;
                // Deprecated
                /*case "log-channel": {
                    db.ServerConfigParam.findOrCreate({
                        where: {
                            server_id: message.guild.id,
                            name: 'log-channel'
                        },
                        defaults: {
                            value: ''
                        }
                    }).then(config => {
                        config[0].value = '';
                        config[0].save();
                    });
                    /!*db.servers[message.guild.id].logChannel = undefined;
                    sendMessage(message.channel, "Beep, Boop! Unset the log channel!");*!/
                }*/
            }

        }
    )
);

roles.commands.push(
    new Command(
        'addRole',
        '<role_name>',
        'Adds a role to the available roles',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        PERMISSIONS.NONE,
        function(message, args, db) {

            db.ServerConfigParam.findOrCreate({
                where: {
                    server_id: message.guild.id,
                    name: 'roles'
                },
                defaults: {
                    value: '[]'
                }
            }).then(config => {
                let roles = JSON.parse(config[0].value);
                let newRole = message.guild.roles.find('name', args[1]);

                if(newRole === null) {
                    throw "That role does not exist!";
                }

                // TODO: search nested roles?
                if(roles.indexOf(newRole.id) < 0) {
                    sendMessage(message.channel, `Role ${newRole} was added`);
                    roles.push(newRole.id);
                } else {
                    throw "That role has already been added!"
                }

                config[0].value = JSON.stringify(roles);
                config[0].save();
            });


            /*let role = message.guild.roles.find('name', args[1]);
            if(role !== null) {
                let roles = db.servers[message.guild.id].availableRoles;
                if(roles === undefined) {
                    roles = [];
                }
                roles.push(role.id);
                db.servers[message.guild.id].availableRoles = roles;
            } else {
                sendMessage(message.channel, "Beep, Boop! That role does not exist!");
            }*/
        }
    )
);

roles.commands.push(
    new Command(
        'removeRole',
        '<role_name>',
        '',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        PERMISSIONS.NONE,
        function(message, args, db) {
            // TODO: Add functionality
            throw "This feature not currently available";
        }
    )
);

roles.commands.push(
    new Command(
        'addRoleToGroup',
        '<group_name> <role_name>',
        '',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        PERMISSIONS.NONE,
        function(message, args, db) {
            db.ServerConfigParam.findOrCreate({
                where: {
                    server_id: message.guild.id,
                    name: 'roles'
                },
                defaults: {
                    value: '[]'
                }
            }).then(config => {
                let roles = JSON.parse(config[0].value);
                let newRoles = roles;
                let found = false;

                //remove any existing role from the list
                roles = roles.filter((role, index) => {
                    if (typeof role === typeof "") {
                        if(message.guild.roles.find('id', role).name === args[2]) {
                            return false;
                        } else {
                            return true
                        }
                    } else { //it is nested
                        role.roles = role.roles.filter((nested, nestedIndex) => {
                            if(message.guild.roles.find('id', nested).name === args[2]) {
                                return false;
                            }
                            else {
                                return true;
                            }
                        });
                        if(role.roles.length > 0) return true;
                        else return false;
                    }
                });


                // add it to the group listed
                found = false;
                roles.forEach(role => {
                    if (typeof role === typeof {}) {
                        if(role.name === args[1]) { // if this is the group we are looking for
                            found = true;
                            role.roles.push(message.guild.roles.find('name', args[2]).id);
                            sendMessage(message.channel, `${args[2]} added to ${args[1]}`);
                        }
                    }
                });

                //the group doesn't exist yet
                if(!found) {
                    roles.push({
                        name: args[1],
                        roles: [
                            message.guild.roles.find('name', args[2]).id
                        ]
                    });
                    sendMessage(message.channel, `${args[2]} added to ${args[1]}`);
                }

                config[0].value = JSON.stringify(roles);
                config[0].save();
            });
        }
    )
);

roles.commands.push(
    new Command(
        'roles',
        '',
        'Shows list of available roles',
        [Discord.Permissions.FLAGS.SEND_MESSAGES],
        PERMISSIONS.NONE,
        function(message, args, db) {

            db.ServerConfigParam.findOrCreate({
                where: {
                    server_id: message.guild.id,
                    name: 'roles'
                },
                defaults: {
                    value: '[]'
                }
            }).then(config => {
                let roles = JSON.parse(config[0].value);

                let embed = new Discord.RichEmbed();

                embed.setDescription('Here are the roles you can assign to yourself');
                embed.setTimestamp();
                embed.setColor(global_config.color);
                let list = "";

                roles.forEach(role => {
                    if(typeof role === typeof {}) {
                        let theseRoles = "";
                        role.roles.forEach(nested => {
                            let thisRole = message.guild.roles.find('id', nested);
                            theseRoles += `${thisRole.name}\n`;
                        });
                        embed.addField(role.name, theseRoles);
                    } else {
                        let thisRole = message.guild.roles.find('id', role);
                        list += `${thisRole.name}\n`;
                    }
                });

                if(list === "") {
                    list = "There are no roles available";
                }

                embed.addField("General Roles:", list);
                message.channel.send(embed);
            });

            // let roles = db.servers[message.guild.id].availableRoles;
            //
            // let embed = new Discord.RichEmbed();
            //
            // embed.setDescription('Here are the roles you can assign to yourself');
            // embed.setTimestamp();
            // embed.setColor(config.color);
            // let list = "";
            //
            // roles.forEach(role => {
            //     let thisRole = message.guild.roles.find('id', role);
            //
            //     list += `${thisRole.name}\n`;
            // });
            // embed.addField("Roles:", list);
            // message.channel.send(embed);
        }
    )
);

roles.commands.push(
    new Command(
        'role',
        '<role_to_assign>',
        'Gives a user a role',
        [Discord.Permissions.FLAGS.SEND_MESSAGES],
        PERMISSIONS.NONE,
        function(message, args, db) {

            db.ServerConfigParam.findOrCreate({
                where: {
                    server_id: message.guild.id,
                    name: 'roles'
                },
                defaults: {
                    value: '[]'
                }
            }).then(config => {
                let roles = JSON.parse(config[0].value);

                if(args[1] === undefined) {
                    args[1] = "";
                }

                let role = message.guild.roles.find('name', args[1]);

                if(role === null) {
                    throw "That role doesn't exist";
                }

                let found = false;
                let group = false;
                roles.forEach((role_) => {
                    if(typeof role_ === typeof "") {
                        if (role_ === role.id) found = true;
                    } else {
                        if (role_.roles.includes(role.id)) {
                            found = true;
                            group = role_.roles;
                        }
                    }
                });
                if(!found) {
                    throw "You don't have permission for that role";
                }

                // if the role they are trying to assign is a part of a group, we need to check to see if they have another from that group and remove it
                if(group !== false) {
                    group.forEach((role) => {
                        let maybe = message.member.roles.find('id', role);
                        if(maybe !== null) message.member.removeRole(maybe);
                    });
                }


                message.member.addRole(role);
            });

            /*let roles = db.servers[message.guild.id].availableRoles;

            if(args[1] === undefined) {
                args[1] = "";
            }

            let role = message.guild.roles.find('name', args[1]);

            if(role !== null) {
                if(roles.includes(role.id)) {

                } else {
                    sendMessage(message.channel, "Beep, Boop! You don't have permission to add that role!");
                }
            } else {
                sendMessage(message.channel, "Beep, Boop! That role doesn't exist!");
            }*/
        }
    )
);

general.commands.push(
    new Command(
        'forceupdate',
        '',
        'Do not use this',
        [Discord.Permissions.FLAGS.ADMINISTRATOR],
        PERMISSIONS.NONE,
        function(message, args, db) {
            if(message.member.id !== "468070906376224778") return;

            message.client.guilds.forEach(guild => {
                db.Server.create({
                    id: guild.id
                });

                guild.roles.forEach(role => {
                    db.Role.create({
                        id: role.id
                    })
                });

                guild.members.forEach(member => {
                    db.Member.create({
                        id: member.id
                    });
                    db.ServerMember.create({
                        server_id: guild.id,
                        member_id: member.id,
                        name: member.displayName,
                        permissions: "",
                        info: ""
                    });

                    member.roles.forEach(role => {
                        db.ServerMemberRole.create({
                            server_id: guild.id,
                            member_id: member.id,
                            role_id: role.id
                        });
                    })
                });
            })
        }
    )
);

administrative.commands.push(new Command(
    'logs',
    '[offset=0] [@user|#channel]',
    'Displays logs. Specify a offset to display older actions. Mention a user or channel to get logs specifically relating to that target',
    [Discord.Permissions.FLAGS.ADMINISTRATOR],
    PERMISSIONS.LOGS,
    function(message, args, db) {
        // TODO: add support for offset within the command
        let limit = 10;
        let offset = 0;

        // make sure the first arg isn't a mention...
        if (args.length > 1) {
            if(args[1].charAt(0) !== '<' || args[1].charAt(args[1].length - 1) !== '>') {
                offset = parseInt(args[1]);
            }
        }

        if(message.mentions.members.array().length === 1 && message.mentions.channels.array().length === 0) {
            // we have a user mention
            db.Message.findAll({
                where: {
                    server_id: message.guild.id,
                    member_id: message.mentions.members.array()[0].id
                },
                limit: limit,
                offset: offset,
                order: [
                    ['createdAt', 'DESC']
                ]
            }).then(messages => {
                let toret = "";
                messages.forEach(thismessage => {
                    let logSender = message.guild.members.find('id', thismessage.member_id);
                    toret += thismessage.type + " " + thismessage.content + " " + logSender + "\n";
                });
                sendMessage(message.channel, toret);
            });
        } else if (message.mentions.channels.array().length === 1 && message.mentions.members.array().length === 0) {
            // we have a channel mention
            db.Message.findAll({
                where: {
                    server_id: message.guild.id,
                    channel_id: message.mentions.channels.array()[0].id
                },
                limit: limit,
                offset: offset,
                order: [
                    ['createdAt', 'DESC']
                ]
            }).then(messages => {
                let toret = "";
                messages.forEach(thismessage => {
                    let logSender = message.guild.members.find('id', thismessage.member_id);
                    toret += thismessage.type + " " + thismessage.content + " " + logSender + "\n";
                });
                sendMessage(message.channel, toret);
            });
        } else if (message.mentions.members.array().length === 0 && message.mentions.channels.array().length === 0) {
            // we have no mention
            db.Message.findAll({
                where: {
                    server_id: message.guild.id,
                },
                limit: limit,
                offset: offset,
                order: [
                    ['createdAt', 'DESC']
                ]
            }).then(messages => {
                let toret = "";
                messages.forEach(thismessage => {
                    let logSender = message.guild.members.find('id', thismessage.member_id);
                    toret += thismessage.type + " " + thismessage.content + " " + logSender + "\n";
                });
                sendMessage(message.channel, toret);
            });
        } else {
            throw "You can only mention one channel or one user";
        }

    }
));

function sendMessage(channel, message) {
    let embed = new Discord.RichEmbed()
        .setTimestamp()
        .setDescription(message)
        .setColor(global_config.color);

    channel.send(embed);
}

commands.push(general);
commands.push(administrative);
commands.push(roles);
commands.push(settings);
commands.push(permissions);

module.exports = commands;