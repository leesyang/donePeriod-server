'use strict';
const router = require('express').Router();

// ----- authentication -----
const { jwtAuth } = require('../middlewares/auth');

// ----- controllers -----

// ----- routes -----
router.get('/', jwtAuth, (req, res) => {
    res.send('working protected route')
})

module.exports = { router };