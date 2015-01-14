//
// User
//

'use strict';

var bcrypt = require('bcryptjs'),
    md5 = require('MD5'),
    hash = require('node_hash'),
    settings = require('./../config');

var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    uniqueValidator = require('mongoose-unique-validator'),
    validate = require('mongoose-validate'),
    settings = require('./../config');

var UserSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        trim: true
    },
    uid: {
        type: String,
        required: false,
        trim: true,
        validate: [function(v) {
            return (v.length <= 24);
        }, 'invalid ldap/kerberos username']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate: [ validate.email, 'invalid email address' ]
    },
    password: {
        type: String,
        required: false, // Only required if local
        trim: true,
        match: /^.{8,64}$/i,
        set: function(value) {
            // User can only change their password if it's a local account
            if (this.local) {
                return value;
            }
            return this.password;
        }
    },
    apiKey: {
        type: String,
        required: false,
        unique: true,
        trim: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        match: /^[a-z0-9_]+$/i,
        set: function(value) {
            // User can only change their username if it's a local account
            if (this.local || !this.username) {
                return value.toLowerCase();
            }
            return this.username;
        }
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    joined: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        trim: true
    },
    rooms: [{
		type: ObjectId,
		ref: 'Room'
    }],
	messages: [{
		type: ObjectId,
		ref: 'Message'
	}]
}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});

UserSchema.virtual('local').get(function() {
    return this.provider === 'local';
});

UserSchema.virtual('avatar').get(function() {
    return md5(this.email);
});

UserSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }

    bcrypt.hash(user.password, 10, function(err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});

UserSchema.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (isMatch) {
            return cb(null, true);
        }

        var salt = settings.auth.local && settings.auth.local.salt;
        if (salt) {
            var legacyPassowrd = hash.sha256(password, salt);
            isMatch = legacyPassowrd === this.password;
        }

        cb(null, isMatch);

    }.bind(this));
};

UserSchema.statics.authenticate = function(identifier, password, cb) {
    var options = {};

    if (identifier.indexOf('@') === -1) {
        options.username = identifier;
    } else {
        options.email = identifier;
    }

    this.findOne(options, function(err, user) {
        if (err) {
            return cb(err);
        }
        // Does the user exist?
        if (!user) {
            return cb(null, null, 0);
        }
        // Is password okay?
        user.comparePassword(password, function(err, isMatch) {
            if (err) {
                return cb(err);
            }
            if (isMatch) {
                return cb(null, user);
            }
            // Bad password
            return cb(null, null, 1);
        });
    });
};

UserSchema.plugin(uniqueValidator, {
    message: 'Expected {PATH} to be unique'
});

// EXPOSE ONLY CERTAIN FIELDS
// It's really important that we keep
// stuff like password private!
UserSchema.method('toJSON', function() {
    return {
        id: this._id,
        firstName: this.firstName,
        lastname: this.lastName,
        username: this.username,
        displayName: this.displayName,
        avatar: this.avatar,
        email: this.email,
        local: this.local
    };
});

module.exports = mongoose.model('User', UserSchema);
