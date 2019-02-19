const Sequelize = require('sequelize');

const sequelize = new Sequelize('echo', null, null, {
    dialect: 'sqlite',
    storage: 'db.sqlite',
    logging: false,
});


const Server = sequelize.define('server', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
});

const Member = sequelize.define('member', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
});

const Role = sequelize.define('role', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
});

const Channel = sequelize.define('channel', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
});


const ServerConfigParam = sequelize.define('server_config_param', {
    server_id: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING
    },
    value: {
        type: Sequelize.STRING
    }
});

const ServerMember = sequelize.define('server_member', {
    server_id: {
        type: Sequelize.STRING,
    },
    member_id: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING
    },
    permissions: {
        type: Sequelize.STRING
    },
    info: {
        type: Sequelize.STRING
    }
});

const Message = sequelize.define('message', {
    server_id: {
        type: Sequelize.STRING,
    },
    member_id: {
        type: Sequelize.STRING,
    },
    message: {
        type: Sequelize.STRING
    }
});

const ServerMemberRole = sequelize.define('server_member_roles', {
    server_id: {
        type: Sequelize.STRING,
    },
    member_id: {
        type: Sequelize.STRING,
    },
    role_id: {
        type: Sequelize.STRING,
    }
});

const Warning = sequelize.define('warning', {
    server_id: {
        type: Sequelize.STRING,
    },
    member_id: {
        type: Sequelize.STRING,
    },
    warn: {
        type: Sequelize.STRING
    }
});

const FilteredWord = sequelize.define('filtered_word', {
    word: {
        type: Sequelize.STRING
    }
});

Server.sync();
Member.sync();
Role.sync();
Channel.sync();
ServerConfigParam.sync();
ServerMember.sync();
Message.sync();
ServerMemberRole.sync();
Warning.sync();
FilteredWord.sync();

module.exports = {
    Server,
    Member,
    Role,
    Channel,
    ServerConfigParam,
    ServerMember,
    Message,
    ServerMemberRole,
    Warning,
    FilteredWord
};