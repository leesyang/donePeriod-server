'use strict';
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

// ----- string constants -----
const TicketConstants = {};
TicketConstants.WORK_IN_PROGRESS = 'Work in progress';
TicketConstants.UNRESOLVED = 'Unresolved';

// ----- utility functions -----
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

// ----- schemas -----
const ticketCommentSchema = new Schema({
    addedBy: { type: ObjectId, ref:'User' },
    dateAdded: { type: Date, default: Date.now() },
    comment: String
});

const worklogActivitySchema = new Schema({
    addedBy: { type: ObjectId, ref: 'User'},
    dateAdded: { type: Date, default: Date.now() },
    comment: String,
    files: Array
})

const ticketSchema = new Schema({
    ticketId: { type: String },
    description: { type: Object, default: { text: 'N/A' }},
    title: { type: String, default: 'New Ticket'},
    ticketInfo: Object,
    dueDate: { type: Date, default: new Date().addDays(7)},
    assignee: { type: ObjectId, ref: 'User' },
    reporter: { type: ObjectId, ref: 'User' },
    team: [ { type: ObjectId, ref: 'User' } ],
    votes: [ { type: ObjectId, ref: 'User' } ],
    watchers: [ { type: ObjectId, ref: 'User'} ],
    created: { type: Date, default: Date.now() },
    updated: { type: Date, default: Date.now()},
    attachments: Array,
    comments: [ ticketCommentSchema ],
    worklog: [ worklogActivitySchema ],
});

// ----- methods -----
ticketSchema.methods.filterDescription = function() {
    return { description: this.description }
}
ticketSchema.methods.filterTicketInfo = function() {
    return { ticketInfo: this.ticketInfo }
}
ticketSchema.methods.filterVotes = function() {
    return { votes: this.votes }
}
ticketSchema.methods.filterComments = function() {
    return { comments: this.comments }
}
ticketSchema.methods.filterWorklog = function() {
    return { worklog: this.worklog }
}

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = { Ticket, TicketConstants };