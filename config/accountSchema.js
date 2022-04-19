'use strict';
var mongoose = require('mongoose').set('debug', true);
const Schema = mongoose.Schema;

const accountSchema = new Schema({
    fullname: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    originPassword: {
        type: String,
        required: false
    },
    language: {
        type: String,
        required: false
    },
    deviceId: {
        type: String,
        required: false
    },
    token: {
        type: String,
        required: false
    },    
    createdDate: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: String,
        required: false
    },
    createdTime: {
        type: Number,
        required: false
    },
});
const account = mongoose.model('accounts', accountSchema);
module.exports = account;