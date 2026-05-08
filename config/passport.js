'use strict';
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const passport = require('passport');

// ----- constants -----
const { JWT_SECRET } = require('./constants');

// ----- imports -----
const { User } = require('../models');

// ----- serializing/deserializing user login -----
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(async function(id, cb) {
  try {
    const user = await User.findById(id);
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});

// ----- local strategy -----
const localStrategy = new LocalStrategy(
  async function (username, password, callback) {
    try {
      const user = await User.findOne({ username })
        .populate('watching', 'ticketId id dueDate')
        .populate('notes')
        .populate('assigned', 'ticketId id dueDate description votes');

      if (!user) {
        return callback(null, false, {
          reason: 'LoginError',
          location: 'username',
          message: 'Incorrect username'
        });
      }

      const isValid = await user.validatePassword(password);
      if (!isValid) {
        return callback(null, false, {
          reason: 'LoginError',
          location: 'password',
          message: 'Incorrect password'
        });
      }

      return callback(null, user.serialize());
    } catch (err) {
      return callback(err);
    }
  }
);

// ----- jwt strategy -----
const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    algorithms: ['HS256']
  },
  (payload, done) => {
    done(null, payload.user);
  }
);

module.exports = { localStrategy, jwtStrategy };
