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
        watchers: [user_Id, user_Id_2],
        attachments: [],
        comments: generateComments(user_Id),
        worklog: generateWorkLog(user_Id),
        created: Date.now(),
        updated: Date.now(),
    }
}

const generateTicket = (user_Id) => {
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
    for(let i =0; i < 2; i++ ) {
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
            /* .then(tickets  => console.log(tickets)) */
        });

        // ----- agent for auth requests -----
        const agent = chai.request.agent(app);
        let authToken;

        beforeEach(function() {
        return agent
        .post('/auth/login')
        .send({ username: newUsers[0].username, password: newUsers[0].password })
        .then(res => {
                authToken = res.body.authToken;
            })
        });

        describe('GET tickets', function() {
            it('should get tickets', function() {
                this.timeout(5000);
                let res;
                let resTicket;

                return agent
                .get('/tickets')
                .set('Authorization', `Bearer ${authToken}`)
                .then(_res => {
                    res = _res;
                    resTicket = _res.body[0]
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('array')
                    res.body.forEach(ticket => {
                        expect(ticket).to.be.a('object');
                        expect(ticket).to.include.keys(
                            'description',
                            'title',
                            'dueDate',
                            'votes',
                            'watchers',
                            'created',
                            'updated',
                            'attachments',
                            'ticketId',
                            'ticketInfo',
                            'assignee',
                            'reporter',
                            'comments',
                            'worklog')
                    })
                    return Ticket.findById(_res.body[0]._id)
                })
                .then(ticket => {
                    expect(resTicket.ticketId).to.equal(ticket.ticketId);
                    expect(resTicket.title).to.equal(ticket.title);
                })
            })
        });

        describe('POST a new ticket', function() {
            it.only('should post a new ticket', function() {
                const newTicket = { 
                    type: 'Incident',
                    priority: 'Urgent',
                    assignee: dbUsers[0]._id,
                    dueDate: '2018-10-16',
                    title: 'new title',
                    description: 'a description'
                }
              
                let res;

                return agent
                .post('/tickets')
                .send(newTicket)
                .set('Authorization', `Bearer ${authToken}`)
                .then(_res => {
                    res = _res;
                    console.log(res.body)
                    expect(_res).to.have.status(201);
                    expect(_res.body).to.be.a('object');
                    expect(_res.body).to.include.keys('_id', 'ticketId');
                    return Ticket.findById(_res.body._id)
                })
                .then(ticket => {
                    expect(ticket.ticketId).to.equal(res.body.ticketId);
                })
            })
        })
    })
})