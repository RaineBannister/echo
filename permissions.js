/**
 * Enum of permissions
 * @type {{SAY: number, MSG: number, WELCOME: number, GRANT: number, REVOKE: number}}
 */
const PERMISSIONS = {
    'NONE': 0,
    'SAY': 1,
    'MSG': 2,
    'WELCOME': 3,
    'GRANT': 4,
    'REVOKE': 5,
    'WARN': 6,
    'PERMISSIONS': 7,
    'CLEAR': 8,
    'MUTE': 9,
    'LOGS': 10
};

PERMISSIONS.key = function( value ) {
    for( let prop in this ) {
        if( this.hasOwnProperty( prop ) ) {
            if( this[ prop ] === value )
                return prop;
        }
    }
};

module.exports = PERMISSIONS;