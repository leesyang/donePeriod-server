'use strict';
const fs = require('fs');
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const aws = require('aws-sdk');
const shortid = require('shortid')

const { app, runServer, closeServer } = require('../server');
const { User, Ticket } = require('../models');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config/constants');

const expect = chai.expect;

chai.use(chaiHttp);

// ----- seed database with tickets -----

const generateComments = (user_Id) => {
    return {
        addedBy: user_Id,
        dateAdded: Date.now(),
        comment: 'this is a comment'
    }
}

const generateWorkLog = (user_Id) => {
    return {
        addedBy: user_Id,
        dateAdded: Date.now(),
        comment: 'this is a worklog comment',
        files: []
    }
}

const randomizeWords = (array) => {
    return array[Math.floor(Math.random() * array.length)]
}

const generateTickets = (dbUsers) => {
    const user_Id = dbUsers[0]._id;
    const user_Id_2 = dbUsers[1]._id
    return {
        ticketId: shortid.generate(),
        description: faker.random.words(),
        title: faker.name.title(),
        ticketInfo: {
            type: randomizeWords(['Purchase', 'Incident', 'Repair']),
            priority: randomizeWords(['High', 'Normal', 'Low']),
            status: randomizeWords(['Work in progress', 'Delayed', 'Completed', 'Archived']),
            resolution: randomizeWords(['Unresolved', 'Resolved'])
        },
        dueDate: new Date().addDays(7),
        assignee: user_Id,
        reporter: user_Id,
        votes: [user_Id],
        watchers: [user_Id],
        attachments: [],
        comments: generateComments(user_Id),
        worklog: generateWorkLog(user_Id),
        created: Date.now(),
        updated: Date.now(),
    }
}

const seedTickets = (dbUsers) => {
    const tickets = [];
    for(let i =0; i < 5; i++ ) {
        tickets.push(generateTickets(dbUsers))
    };
    return Ticket.insertMany(tickets);
}

// ---- generate users -----
let newUsers = []; // non-hashed pw
let dbUsers = []; // contains hashed pw

function generateUserSignup () {
  return { 
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    username: faker.internet.userName(),
    password: faker.internet.password(),
  }
}

function seedUserData () {
  let users = [];
  for ( let i = 0; i < 2; i++) {
    users.push(generateUserSignup())
  };
  newUsers = users;
  const pwPromises = users.map(user => {
    return User.hashPassword(user.password);
  })
  return Promise.all(pwPromises)
  .then(passwords => {
    const hashedUsers = users.map((user, index) => {
      user = Object.assign({}, user)
      user.password = passwords[index];
      return user;
    })
    return User.insertMany(hashedUsers)
  })
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
  };

describe('ticket endpoints', function() {
    before(function() {
        return runServer(TEST_DATABASE_URL);
    });
    
    after(function() {
        return closeServer();
    })

    beforeEach(function() {
        return seedUserData()
        .then(function(users) {
            dbUsers = users;
        })
    })

    afterEach(function() {
        return tearDownDb();
    })

    describe('/tickets', function() {
        // ----- code that runs before each of the blocks below ------
        beforeEach(function(){
            return seedTickets(dbUsers)
            .then(tickets  => console.log(tickets))
        });

        describe('GET tickets', function() {
            it.only('should get tickets', function() {
                return chai.request(app)
                .get('/tickets')
            })
        }

        describe('POST new ticket', function() {
            it('should post a new ticket', function() {
                
            })
        })
    })
})