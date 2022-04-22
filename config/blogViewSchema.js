'use strict';
var mongoose = require('mongoose').set('debug', true);
const Schema = mongoose.Schema;

const blogViewSchema = new Schema({
    blogId: {
        type: Schema.Types.ObjectId,
        ref: 'blogs'
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
const blogView = mongoose.model('blogViews', blogViewSchema);
module.exports = blogView;