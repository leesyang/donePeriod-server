'use strict';
const router = require('express').Router();

// ----- authentication -----
const { localAuth } = require('../middlewares/auth');

// ----- controllers -----
const { authCtrl } = require('../controllers');

// ----- routes -----

router.post('/login', localAuth, authCtrl.login);

module.exports = { router };