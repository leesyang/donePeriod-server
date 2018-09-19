'use strict';
const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const passport = require('passport');
mongoose.Promise = global.Promise;

// ----- constants -----
const { JWT_SECRET, JWT_EXPIRY } = require('./constants');

// ----- imports -----
const { User } = require('../models');

// ----- serializing/deserializing user login -----
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  User.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

// ----- local strategy -----
const localStrategy = new LocalStrategy(
    function (username, password, callback) {
    let user;
    let mypass = password;
    User.findOne({ username: username })
    .populate('watching', 'ticketId id dueDate')
    .populate('notes')
      .then(_user => {
        user = _user;
        if (!user) {
          return Promise.reject({
            reason: 'LoginError',
            location: 'username',
            message: 'Incorrect username'
          });
        }
        return user.validatePassword(password);
      })
      .then(isValid => {
        if (!isValid) {
          return Promise.reject({
            reason: 'LoginError',
            location: 'password',
            message: 'Incorrect password'
          });
        }
        return callback(null, user.serialize());
      })
      .catch(err => {
         if (err.reason === 'LoginError') {
          return callback(null, false, err);
        }
        return callback(null, err);
      });
  });

// ----- jwt strategy -----
const jwtStrategy = new JwtStrategy(
    {
        secretOrKey: JWT_SECRET,
        // Look for the JWT as a Bearer auth header
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Only allow HS256 tokens - the same as the ones we issue
        algorithms: ['HS256']
      },
      (payload, done) => {
        done(null, payload.user);
      }
);

module.exports = { localStrategy, jwtStrategy };