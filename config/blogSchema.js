'use strict';
var mongoose = require('mongoose').set('debug', true);
const Schema = mongoose.Schema;

const blogSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false
    },
    iView: {
        type: Number,
        default: 0
    },    
    iComment: {
        type: Number,
        default: 0
    },    
    // createdUser: {
    //     type: String,
    //     required: false
    // },
    createdUser: {
        type: Schema.Types.ObjectId,
        ref: 'accounts'
    },    
    createdDate: {
        type: Date,
        default: Date.now
    },
    updatedDate: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: String,
        required: false
    }
});
const blog = mongoose.model('blogs', blogSchema);
module.exports = blog;