'use strict';
const router = require('express').Router();
const cookieParser = require('cookie-parser');
const jsonParser = require('body-parser').json();

// ----- cookies -----
router.use(cookieParser());
router.use(jsonParser);

// ---- import routes -----
const { router: authRoute } = require('./authRoute'),
      { router: usersRoute } = require('./usersRoute'),
      { router: ticketsRoute } = require('./ticketsRoute');

// ----- router -----
router.use('/auth', authRoute);
router.use('/users', usersRoute);
router.use('/tickets', ticketsRoute);


module.exports = { router };