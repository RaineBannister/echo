let fs = require('fs');

class JSONDatabase {
    constructor() {
        this.data = undefined;
        this.loadData();
    }
    loadData() {
        this.data = JSON.parse(fs.readFileSync('data.json'));
    }

    save() {
        fs.writeFile('data.json', JSON.stringify(this.data), {}, function(err) {
            if (err) throw err;
        });
    }

    getServer(id) {
        for(let i = 0; i < this.data.servers.length; i ++) {
            let server = this.data.servers[i];
            if (server.id === id) {
                return server;
            }
        }

        return undefined;
    }

    getMember(server, id) {
        for(let i = 0; i < server.members.length; i ++) {
            let member = server.members[i];
            if(member.id === id) {
                return member;
            }
        }

        return undefined;
    }

    getMemberInServer(id, mId) {
        let server = this.getServer(id);
        if(server !== undefined) {
            return this.getMember(server, mId);
        }
        return undefined;
    }

    hasPermission(serverId, memberId, perm) {
        let member = this.getMemberInServer(serverId, memberId);
        let ret = false;
        if(member !== undefined) {
            member.permissions.forEach(function(p) {
                if (p === perm) ret = true;
            });
        }
        return ret;
    }

    addPermission(serverId, memberId, perm) {
        let member = this.getMemberInServer(serverId, memberId);
        if(member !== undefined) {
            member.permissions.push(perm);
        }
        this.save();
    }

    //BEGIN COOL WRAPPER STUFFS.......................................................................................//
    /**
     * Deprecated
     *
     * @param {number} id
     * @returns {Server}
     */
    server(id) {
        let temp = this.getServer(id);
        return new Server(temp.id, temp.message, temp.mutes, this);
    }

    /**
     *
     * @returns {Array.<Server>}
     */
    get servers() {
        let array = [];
        let db = this;
        let servers = this.data.servers;
        servers.forEach(function(server){
            array[server.id] = new Server(server.id, server.message, server.mutes, db);
        });
        return array;
    }
}

class Server {
    /**
     *
     * @param {number} id
     * @param {string} welcome
     * @param {Array.<number>} mutes
     * @param {JSONDatabase} db
     */
    constructor(id, welcome, mutes, db) {
        this._id = id;
        this._welcome = welcome;
        this._mutes = mutes;
        this._db = db;
    }

    /**
     * Deprecated
     *
     * @param {number} memberID
     * @returns {Member}
     */
    member(memberID) {
        let temp = this._db.getMemberInServer(this._id, memberID);
        return new Member(this._id, temp.id, temp.roles, temp.name, temp.permissions, this._db);
    }

    /**
     *
     * @returns {Array.<Member>}
     */
    get members() {
        let array = [];
        let server = this._db.getServer(this._id);
        let db = this._db;
        server.members.forEach(function(member) {
            array[member.id] = new Member(server.id, member.id, member.roles, member.name, member.permissions, member.warnings, member.info, db);
        });
        return array;
    }

    /**
     *
     * @param {string} welcome
     */
    set welcome(welcome) {
        this._welcome = welcome;
        let server = this._db.getServer(this._id);
        server.welcome = welcome;
        this._db.save();
    }

    /**
     *
     * @returns {string}
     */
    get welcome() {
        return this._message;
    }
}

/**
 *
 */
class Member {
    /**
     *
     * @param {number} serverID
     * @param {number} id
     * @param {Array.<number>} roles
     * @param {string} name
     * @param {Array.<number>} permissions
     * @param {Array.<String>} warnings
     * @param {String} info
     * @param {JSONDatabase} db
     */
    constructor(serverID, id, roles, name, permissions, warnings, info, db) {
        this._serverID = serverID;
        this._id = id;
        this._roles = roles;
        this._name = name;
        this._permissions = permissions;
        this._warnings = warnings;
        this._info = info;
        this._db = db;
    }

    /**
     *
     * @param {Array.<number>} roles
     */
    set roles(roles) {
        this._roles = roles;
        let member = this._db.getMemberInServer(this._serverID, this._id);
        member.roles = roles;
        this._db.save();
    }

    /**
     *
     * @returns {Array.<number>}
     */
    get roles() {
        return this._roles;
    }

    /**
     *
     * @param {string} name
     */
    set name(name) {
        this._name = name;
        let member = this._db.getMemberInServer(this._serverID, this._id);
        member.name = name;
        this._db.save();
    }

    /**
     *
     * @returns {string}
     */
    get name() {
        return this._name;
    }

    /**
     *
     * @param {Array.<number>} permissions
     */
    set permissions(permissions) {
        this._permissions = permissions;
        let member = this._db.getMemberInServer(this._serverID, this._id);
        member.permissions = permissions;
        this._db.save();
    }

    /**
     *
     * @returns {Array.<number>}
     */
    get permissions() {
        return this._permissions;
    }

    /**
     *
     * @param {Array.<String>} warnings
     */
    set warnings(warnings) {
        this._warnings = warnings;
        let member = this._db.getMemberInServer(this._serverID, this._id);
        member.warnings = warnings;
        this._db.save();
    }

    /**
     *
     * @returns {Array.<String>}
     */
    get warnings() {
        return this._warnings;
    }

    /**
     *
     * @param {String} info
     */
    set info(info) {
        this._info = info;
        let member = this._db.getMemberInServer(this._serverID, this._id);
        member.info = info;
        this._db.save();
    }

    /**
     *
     * @returns {String}
     */
    get info() {
        return this._info;
    }
}

class Role {

}

class Channel {

}

module.exports = JSONDatabase;
