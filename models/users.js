'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const userNotes = new Schema({
    created: { type: Date, default: Date.now() },
    comment: String,
})

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, require: true },
    email: { type: String, required: true, unique: true },
    profilePicture: { type: String, default: 'user-images/default-user-image.svg' },
    watching: [ { type: ObjectId, ref: 'Ticket' } ],
    notes: [ { type: userNotes, default: userNotes } ]
});

userSchema.methods.serialize = function() {
    return {
        username: this.username,
        firstName: this.firstName,
        lastName: this.lastName,
        profilePicture: this.profilePicture,
        watching: this.watching,
        notes: this.notes,
        id: this._id
    };
};

userSchema.methods.filterWatching = function() {
    return {
        ticket_Id: this.ticket_Id,
        id: this._id
    }
}

userSchema.methods.filterNotes = function() {
    return { notes: this.notes }
}

userSchema.statics.hashPassword = function(password) {
    return bcrypt.hash(password, 10);
};

userSchema.methods.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = { User };