'use strict';
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

const passport = require('passport');

// ----- constants -----
const { DATABASE_URL, PORT } = require('./config/constants');
const { localStrategy, jwtStrategy } = require('./config/passport');

// ----- imports -----
const { router } = require('./routes');

const app = express();

// ----- CORS -----
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ---- static files -----
app.use(express.static(__dirname + '/public'));

// ----- http logging -----
app.use(morgan('common'));

// ----- passport -----
app.use(passport.initialize());
passport.use('local-login', localStrategy);
passport.use('jwt-protected', jwtStrategy);

// ----- views -----
app.set('view engine', 'ejs');

// ----- routes -----
app.use('/', router);

// ----- server -----
let server;

async function runServer(databaseUrl, port = PORT) {
  await mongoose.connect(databaseUrl);
  await new Promise((resolve, reject) => {
    server = app.listen(port, () => {
      console.log(`Your app is listening on port ${port}`);
      resolve();
    }).on('error', err => {
      mongoose.disconnect();
      reject(err);
    });
  });
}

async function closeServer() {
  await mongoose.disconnect();
  await new Promise((resolve, reject) => {
    console.log('Closing server');
    server.close(err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
