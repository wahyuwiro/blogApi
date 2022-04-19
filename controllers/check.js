'use strict';

const request = require('request');
let message = {};
var mongoose = require('mongoose').set('debug', true);
var mongo = require('../config/mongo');
var accountSchema = require('../config/accountSchema');
var authService = require('../service/authService');

async function findDataAccount(data) {
  try {
    mongoose.Promise = global.Promise;
    await mongoose.connect(mongo.mongoDb.url);
    let tc = await accountSchema.findOne({
      "token": data,
    });
    await mongoose.connection.close();
    if (tc === null) {
      return ({
        responseCode: process.env.NOTFOUND_RESPONSE,
        responseMessage: "Not found account"
      })
    } else {
      return ({
        responseCode: process.env.SUCCESS_RESPONSE,
        responseMessage: "Success",
        data: tc
      })
    }
  } catch (e) {
    console.log('Error find data account ==> ', e);
    return ({
      responseCode: process.env.ERRORINTERNAL_RESPONSE,
      responseMessage: 'Internal server error, please try again!'
    })
  }
}

async function updateLoginAccount(data) {
  try {
    var tc = {};
    var newTok = {};
    tc.newToken = "aaaaaaaaaaaaaaaaaaaaaaaaa";
    var sortLatest = {
      "createdDate": "-1"
    };
    mongoose.Promise = global.Promise;
    await mongoose.connect(mongo.mongoDb.url);
    tc = await accountSchema.findOneAndUpdate({
      "phone": data.phone,
      "phoneCode": data.phoneCode,
      "userType": "ultipage"
    }, {
      $set: {
        "token": data.newToken
      }
    }, {
      new: true,
      sort: sortLatest
    });
    newTok = {
      "newToken" : data.newToken
    }
    await mongoose.connection.close();
    if (tc) {
      let newObj = Object.assign(newTok,tc._doc)
      tc.tokennnnnnnnnnnnnn = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
      return ({
        responseCode: process.env.SUCCESS_RESPONSE,
        responseMessage: "Success",
        data: newObj
      })
    } else {
      return ({
        responseCode: process.env.NOTACCEPT_RESPONSE,
        responseMessage: "Failed"
      })
    }
  } catch (e) {
    console.log('Error update login account ===> ', e);
    return ({
      responseCode: process.env.ERRORINTERNAL_RESPONSE,
      responseMessage: 'Internal server error, please try again!'
    })
  }
}

