require('dotenv').config();
const request = require('request');
var mongoose = require('mongoose').set('debug', true);
var mongo = require('../config/mongo');
var accountSchema = require('../config/accountSchema');
var blogSchema = require('../config/blogSchema');
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
            // if (data.phone && !data.phoneCode || data.phoneCode && !data.phone) {
            //     resolve({
            //         responseCode: process.env.NOTACCEPT_RESPONSE,
            //         responseMessage: "Phone and code required"
            //     })
            //     return;
            // }

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

exports.insertBlog = function (data) {
    return new Promise(async function (resolve, reject) {
        var res = {};
        try {
            var priorDate = new Date();
            var expDay = priorDate.getDate();
            var expMonth = priorDate.getMonth() + 1;
            var expYear = priorDate.getFullYear();
            let tmpMonth = ("0" + expMonth).slice(-2); //convert 2 digits
            let tmpDate = ("0" + expDay).slice(-2); //convert 2 digits
            var convertDate = expYear + "-" + tmpMonth + "-" + tmpDate;
            await mongoose.connect(mongo.mongoDb.url, {
                useNewUrlParser: true
            });
            var objData = {
                createdUser: data.profile.id,
                createdAt: convertDate                
            }
            if(data.title) objData.title = data.title;
            if(data.content) objData.content = data.content;
            if(data.status) objData.status = data.status;
            var newBlog = new blogSchema(objData);
            var saveBlog = await newBlog.save();
            await mongoose.connection.close();
            if (saveBlog) {
                res.responseCode= process.env.SUCCESS_RESPONSE,
                res.responseMessage= 'Success'
            } else {
                res.responseCode= process.env.NOTACCEPT_RESPONSE,
                res.responseMessage= 'Failed'
            }           
            resolve(res);            
        } catch (e) {
            console.log('Error insertBlog => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

exports.getBlog = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            let gb = await getBlog(data);
            resolve(gb);
        } catch (e) {
            console.log('Error getBlog => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

function getBlog(data) {
    console.log('getBlog data =>',data)
    return new Promise(async function (resolve, reject) {
        var res = {}, pId = {}, pUser = {};
        try {
            pUser = {
                'createdUser': data.profile.id
            }
            if (data.id) {
                pId = {
                  '_id': data.id
                }
            }
            var param = extend({}, pId, pUser);
            await mongoose.connect(mongo.mongoDb.url, {
                useNewUrlParser: true
            });
            let query = await blogSchema.find(param).sort({'createdDate': -1}).populate('createdUser','fullname');
            console.log('query ==> ', query)
            await mongoose.connection.close();
            if (query === null || query.length == 0) {
                res.responseCode = process.env.NOTFOUND_RESPONSE;
                res.responseMessage = "Not found"
            } else {
                res.responseCode = process.env.SUCCESS_RESPONSE;
                res.responseMessage = "Success";
                res.data = query
            }    
            
            resolve(res);
        } catch (e) {
            console.log('Error get blog ==> ', e);
            res.responseCode = process.env.ERRORINTERNAL_RESPONSE,
            res.responseMessage = 'Internal server error, please try again!'
            resolve(res);
        }
    })
}

exports.updateBlog = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            let ub = await updateBlog(data);
            resolve(ub);
        } catch (e) {
            console.log('Error insertBlog => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

function updateBlog(data) {
    console.log('updateBlog data =>',data)
    return new Promise(async function (resolve, reject) {
        var res = {}, vTitle = {}, vContent = {}, vStatus = {}, viView = {}, viComment = {};
        try {
            if (data.id) {
            } else {
                return resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "Notaccepted"
                })
            }

            if (data.title) {
                vTitle = {
                  'title': data.title
                }
            }
            if (data.content) {
                vContent = {
                  'content': data.content
                }
            }
            if (data.status) {
                vStatus = {
                  'status': data.status
                }
            }
            if (data.iView) {
                viView = {
                  'iView': data.iView
                }
            }
            if (data.iComment) {
                viComment = {
                  'iComment': data.iComment
                }
            }
            var value = extend({}, vTitle, vContent, vStatus, viView, viView);
            await mongoose.connect(mongo.mongoDb.url, {
                useNewUrlParser: true
            });            
            let query = await blogSchema.findOneAndUpdate({
                "_id": data.id
            }, {
                $set: value
            }, {
                useFindAndModify: false
            });
      

            await mongoose.connection.close();
            if (query) {
                res.responseCode = process.env.SUCCESS_RESPONSE;
                res.responseMessage = "Blog updated";
            } else {
                res.responseCode = process.env.FAILED_RESPONSE;
                res.responseMessage = "Failed blog update";
            }
      
            resolve(res);
        } catch (e) {
            console.log('Error update blog ==> ', e);
            res.responseCode = process.env.ERRORINTERNAL_RESPONSE,
            res.responseMessage = 'Internal server error, please try again!'
            resolve(res);
        }
    })
}
exports.deleteBlog = function (data) {
    console.log('deleteBlog data =>',data)
    return new Promise(async function (resolve, reject) {
        var res = {};
        try {
            if (data.id) {
            } else {
                return resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "Notaccepted"
                })
            }
            await mongoose.connect(mongo.mongoDb.url, {
                useNewUrlParser: true
            });            
            let query = await blogSchema.deleteOne({
                "_id": data.id
            });
            console.log('query =>',query)
        

            await mongoose.connection.close();
            if (query.deletedCount > 0) {
                res.responseCode = process.env.SUCCESS_RESPONSE;
                res.responseMessage = "Blog deleted";
            } else {
                res.responseCode = process.env.FAILED_RESPONSE;
                res.responseMessage = "Failed blog delete";
            }
      
            resolve(res);
        } catch (e) {
            console.log('Error deleteBlog => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}
exports.getArticle = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            let gb = await getArticle(data);
            resolve(gb);
        } catch (e) {
            console.log('Error getArticle => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

function getArticle(data) {
    console.log('getArticle data =>',data)
    return new Promise(async function (resolve, reject) {
        var res = {}, pId = {}, pUser = {};
        try {
            if (data.id) {
                pId = {
                  '_id': data.id
                }
            }
            var param = extend({}, pId, pUser);
            await mongoose.connect(mongo.mongoDb.url, {
                useNewUrlParser: true
            });
            let query = await blogSchema.find(param).sort({'createdDate': -1}).populate('createdUser','fullname');
            console.log('query ==> ', query)
            await mongoose.connection.close();
            if (query === null || query.length == 0) {
                res.responseCode = process.env.NOTFOUND_RESPONSE;
                res.responseMessage = "Not found"
            } else {
                res.responseCode = process.env.SUCCESS_RESPONSE;
                res.responseMessage = "Success";
                res.data = query
            }    
            
            resolve(res);
        } catch (e) {
            console.log('Error get blog ==> ', e);
            res.responseCode = process.env.ERRORINTERNAL_RESPONSE,
            res.responseMessage = 'Internal server error, please try again!'
            resolve(res);
        }
    })
}