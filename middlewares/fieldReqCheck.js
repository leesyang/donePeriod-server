'use strict';
// ----- imports -----
const { checkReq } = require('../common/common');
const { User } = require('../models');

// ----- users routes -----
const newUserInputCheck = function(req, res, next) {
      const fieldIs = {
          required: ['username', 'password', 'firstName', 'lastName', 'email'],
          string: ['username', 'password', 'firstName', 'lastName'],
          explicityTrimmed: ['username', 'password'],
          sizedFields: {
            username: { min: 2 },
            password: { min: 10, max: 72 }
        }
      };
    
      const isMissing = checkReq.missingFields(fieldIs.required, req.body);
      if (isMissing && isMissing.code) {
        return res.status(isMissing.code).json(isMissing)
      }

      const isNonString = checkReq.nonStringFields(fieldIs.string, req.body);
      const hasWhitespace = checkReq.whitespaceFields(fieldIs.explicityTrimmed, req.body);
      const improperlySized = checkReq.improperlySizedFields(fieldIs.sizedFields, req.body);

      const fieldError = [isNonString, hasWhitespace, improperlySized];
      for (let i = 0; i < fieldError.length; i++) {
        if (fieldError[i] && fieldError[i].code) {
          return res.status(fieldError[i].code).json(fieldError[i]);
        }
      };
      next();
};

// ----- songs route -----
const newTicketFieldsCheck = function(req, res, next) {
    let isMissing = checkReq.missingFields(['type', 'priority', 'status', 'resolution'], req.body.ticketInfo);
    isMissing = checkReq.missingFields(['dueDate', 'description', 'assignee'], req.body);
    if (isMissing) {
      return res.status(isMissing.code).json(isMissing);
    }

    next();
};

const newAssignFieldCheck = function(req, res, next) {

  User.findById(req.body.assignee)
  .then(user => {
    if(user) {
      console.log('went through newassingfieldCheck')
      next();
    }
    else {
      res.status(404).json({
        code: 404,
        reason: 'ValidationError',
        message: 'Not a valid assignee',
    }) 
    }
  })
}

module.exports = { 
  newUserInputCheck, 
  newTicketFieldsCheck,
  newAssignFieldCheck
 };