require('dotenv').config();
const request = require('request');
var mongoose = require('mongoose').set('debug', true);
var mongo = require('../config/mongo');
var accountSchema = require('../config/accountSchema');
var authService = require('../service/authService');
var masterService = require('../service/masterService');
// const pgCon = require('../config/pgConfig');
let message = {};
const fs = require('fs');
let AWS = require('aws-sdk');
const argon2 = require('argon2');
var logObj = {}, dataObj = {};
var query = '';
var param = '';
var exc = '';


exports.getProfile = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log('data =>',data)
            if(data) { data = JSON.parse(data) };
            console.log('data =>',data)
            console.log('data =>',data.email)

            let gpm = await getProfileAccount(data);
            
            resolve(gpm);
        } catch (e) {
            console.log('Error getProfile => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function getProfileAccount(data) {
    console.log('getProfileAccount data=>', data)
    try {
        // open connection for find data by phone in ultipage
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url, {
            useNewUrlParser: true
        });
        let query = await accountSchema.findOne({
            "email": data.email
        });
        await mongoose.connection.close();
        // close connection for find data by phone in ultipage
        if (query === null) {
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: "Not found"
            })
        } else {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: query
            })
        }
    } catch (e) {
        console.log('Error getProfileAccount ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: 'Internal server error, please try again!'
        })
    }
}

exports.updateProfile = function (data) {
    console.log('updateProfile data =>', data)
    return new Promise(async function (resolve, reject) {
        try {
            //delete null value, bcoz encrypt
            if(data.filter == 'change_phone') { 
                if(data.oldEmail == 'null') {
                    delete data.oldEmail;
                }
                if(data.email == 'null') {
                    delete data.email;
                }
            }else if(data.filter == 'change_email') { 
                if(data.oldPhone == 'null') {
                    delete data.oldPhone;
                }
            }

            if (!data.fullname && !data.phone && !data.phoneCode && !data.email && !data.whatsappNumber && !data.language) {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "Please input at least 1 parameter for update profile"
                })
                return;
            }
            if (data.phone && !data.phoneCode || data.phoneCode && !data.phone) {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "Phone and code required"
                })
                return;
            }

            let change = '';
            if (data.fullname) {
                change = "name"
            } else if (data.phone && data.phoneCode) {
                change = "phone"
            } else if (data.email) {
                change = "email"
            } else if (data.language) {
                change = "language"
            }
            if(data.filter == 'change_email') change = "email"
            console.log('change =>', change)
            switch (change) {
                case "name":
                    let upm = await updateProfileMongo(data);
                    resolve(upm);
                    break;
                case "phone":
                    if (!data.oldPhone) {
                        resolve({
                            responseCode: process.env.NOTACCEPT_RESPONSE,
                            responseMessage: "Old phone required"
                        })
                        return;
                    }
                    if (!data.phone) {
                        resolve({
                            responseCode: process.env.NOTACCEPT_RESPONSE,
                            responseMessage: "Phone required"
                        })
                        return;
                    }
                    let fpm = await findProfileMongo(data);
                    console.log('findProfileMongo ==> ', fpm)
                    if (fpm.responseCode == process.env.SUCCESS_RESPONSE) {
                        data.password = fpm.data.originPassword
                        let upm = await updateProfileMongo(data);
                        console.log('updateProfileMongo ==> ', upm)
                        resolve(upm);
                    } else {
                        resolve(fpm);
                        return;
                    }


                    
                    break;
                case "email":
                    if (data.filter == "change_email") {
                        let fpm = await findProfileMongo(data);
                        console.log('findProfileMongo ==> ', fpm)
                        if (fpm.responseCode == process.env.SUCCESS_RESPONSE) {
                            let upm = await updateProfileMongo(data);
                            resolve(upm);
                            return;
                        } else {
                            resolve(upm);
                            return;
                        }                    
                    }

                    break;
                case "language":
                    let upfm = await updateProfileMongo(data); 
                    resolve(upfm);
                    break;    
            }


        } catch (e) {
            console.log('Error updateProfile => ', e);
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

async function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function updateProfileMongo(data) {
    let newValues = {};
    try {
        console.log('data ===> ', data)
        let whereValues = { _id: data._id };
        if (data.fullname) {
            newValues.fullname = data.fullname
        }
        if (data.email) {
            newValues.email = data.email
        }
        if (data.language) {
            newValues.language = data.language
        }
        if (data.token) {
            newValues.token = data.token
        }        
        if(data.filter == 'change_phone') {
            var password = await argon2.hash(data.phone + ':' + data.password);
            newValues.phone = data.phone;
            newValues.password = password;
            whereValues.phone = data.oldPhone;
        }else if(data.filter == 'change_email') {
            newValues.email = data.email;
            whereValues.email = data.oldEmail;
        }
        let sorting = {
            "createdDate": "-1"
        };
        console.log('wherevalues ==> ', whereValues)
        console.log('newvalues ==> ', newValues)
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url);
        let tc = await accountSchema.findOneAndUpdate(whereValues, {
            $set: newValues
        }, {
            new: true,
            sort: sorting
        });
        if (tc) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: tc
            })
        } else {
            return ({
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Failed"
            })
        }
    } catch (e) {
        console.log('Error update profile mongoo ==> ', e)
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

async function findProfileMongo(data) {
    try {
        console.log('data ===> ', data)
        if (data.profile && data.profile.merchantId) {
            data.merchantId = data.profile.merchantId
        }
        let whereValues = {
            merchantId: data.merchantId
        };
        if(data.filter == 'change_phone') {
            delete whereValues.merchantId;
            whereValues.phone = data.oldPhone;
        }else if(data.filter == 'change_email') {
            delete whereValues.merchantId;
            whereValues.email = data.oldEmail;
        }
        console.log('wherevalues ==> ', whereValues)
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url);
        let tc = await accountSchema.findOne(whereValues);
        if (tc) {
            return ({
                responseCode: process.env.SUCCESS_RESPONSE,
                responseMessage: "Success",
                data: tc
            })
        } else {
            return ({
                responseCode: process.env.NOTFOUND_RESPONSE,
                responseMessage: "Not Found"
            })
        }
    } catch (e) {
        console.log('Error update profile mongoo ==> ', e)
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}


function decodeBase64Image(dataString) {
    // console.log('data string ===> ', dataString)
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};
    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}


Date.prototype.minDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() - days);
    return date;
}

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

exports.dateToString = function (date) {
    return new Promise(async function (resolve, reject) {
        try {
            let gs = await dateToString(date);
            resolve(gs);
        } catch (e) {
            console.log('Error dateToString => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}
async function dateToString(date) {
    try {
        // var date = new Date();
        var day = date.getDate();
        var year = date.getFullYear();
        var thirtyMonth = parseInt(date.getMonth()) + 1;
        let tmpMonth = ("0" + thirtyMonth).slice(-2);
        let tmpDay = ("0" + day).slice(-2);
        var dts = year + "-" + tmpMonth + "-" + tmpDay;
        return dts;

    } catch (e) {
        console.log('error dateToString ===> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
      for (var prop in source) {
        target[prop] = source[prop];
      }
    });
    return target;
}