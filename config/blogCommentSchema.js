'use strict';
var mongoose = require('mongoose').set('debug', true);
const Schema = mongoose.Schema;

const blogCommentSchema = new Schema({
    blogId: {
        type: Schema.Types.ObjectId,
        ref: 'blogs'
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: false
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
const blogComment = mongoose.model('blogComments', blogCommentSchema);
module.exports = blogComment;