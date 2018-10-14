'use strict';
// ----- constants -----
const { JWT_SECRET, JWT_EXPIRY } = require('../config/constants');
const jwt = require('jsonwebtoken');
const authCtrl = {};

// ----- json web token -----
const createAuthToken = function(user) {
    return jwt.sign({user}, JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: JWT_EXPIRY,
    });
};

authCtrl.login = function (req, res) {
    let authToken = createAuthToken(req.user);
    res.status(200).json({ code: 201, message: 'Successful login', authToken: authToken });
}


module.exports = authCtrl;