require('dotenv').config();
const request = require('request');
var mongoose = require('mongoose').set('debug', true);
var mongo = require('../config/mongo');
var accountSchema = require('../config/accountSchema');
var authService = require('../service/authService');
var masterService = require('../service/masterService');
const fs = require('fs');
const argon2 = require('argon2');
let jwt = require("jsonwebtoken");
const privateKey = fs.readFileSync('./private.key', 'utf8');
const Cryptr = require("cryptr");
const cryptr = new Cryptr(privateKey);

var message = {}, logObj = {}, dataObj = {};

function registerAccount(data) {
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
            var dateObj = new Date().getTime();
            const password = await argon2.hash(data.email + ':' + data.password);
            await mongoose.connect(mongo.mongoDb.url, {
                useNewUrlParser: true
            });
            var objData = {
                password: password,
                createdAt: convertDate                
            }
            if(data.fullname) objData.fullname = data.fullname;
            if(data.email) objData.email = data.email;
            if(data.phone) objData.phone = data.phone;
            if(data.originPassword) objData.originPassword = data.originPassword;
            if(data.fullname) objData.fullname = data.fullname;
            var newAccount = new accountSchema(objData);            
            var saveAcc = await newAccount.save();
            console.log('saveAcc ==> ', saveAcc)
            await mongoose.connection.close();
            if (saveAcc) {
                res.responseCode= process.env.SUCCESS_RESPONSE,
                res.responseMessage= 'Success'
            } else {
                res.responseCode= process.env.NOTACCEPT_RESPONSE,
                res.responseMessage= 'Failed'
            }           
            resolve(res);
        } catch (e) {
            console.log('Error save register account ==> ', e);
            res.responseCode = process.env.ERRORINTERNAL_RESPONSE,
            res.responseMessage = 'Internal server error, please try again!'
            resolve(res);
        }
    })
}

async function checkExistAccount(data) {
    let res = {};
    try {
        // open connection for find data by phone
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url, {
            useNewUrlParser: true
        });
        let query = await accountSchema.findOne({
            "phone": data.phone
        });
        await mongoose.connection.close();
        // close connection for find data by phone
        if (query === null) {
            mongoose.Promise = global.Promise;
            await mongoose.connect(mongo.mongoDb.url, {
                useNewUrlParser: true
            });
            let q = await accountSchema.findOne({
                "email": data.email
            });
            await mongoose.connection.close();
            if (q === null) {
                res.responseCode = process.env.NOTFOUND_RESPONSE;
                res.responseMessage = 'Not found';
                return res;
            } else {
                res.responseCode = process.env.NOTACCEPT_RESPONSE;
                res.responseMessage = 'Account already exist';
                res.data = q
                return res;
            }
        } else {
            res.responseCode = process.env.NOTACCEPT_RESPONSE;
            res.responseMessage = 'Account already exist';
            return res;
        }
    } catch (e) {
        console.log('Error check account ==> ', e);
        res.responseCode = process.env.ERRORINTERNAL_RESPONSE;
        res.responseMessage = 'Internal server error, please try again!';
        return (res);
    }
}

async function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.registerAccount = function (body) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log('body =>', body)
            if (!body.email) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Email required"
                }
                resolve(message);
            }
            if (!body.fullname) {
                message = {
                    "responseCode": process.env.NOTACCEPT_RESPONSE,
                    "responseMessage": "Fullname required"
                }
                resolve(message);
            }
            // if (!body.appId) {
            //     message = {
            //         "responseCode": process.env.NOTACCEPT_RESPONSE,
            //         "responseMessage": "App ID required"
            //     }
            //     resolve(message);
            // }

            let cd = await checkExistAccount(body);
            console.log('check regist account => ', cd);
            if (cd.responseCode == process.env.NOTFOUND_RESPONSE) {
                // check data register on account service
                let cr = await registerAccount(body);
                console.log('registerAccount ==> ', cr)
                resolve(cr);
            } else {
                resolve(cd);
            }
        } catch (e) {
            console.log('Error register account => ', e)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Internal server error. Try again later!"
            }
            resolve(message);
        }
    })
}

exports.loginAccount = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            if (!data.email) {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "email is required"
                })
                return;
            }
            if (!data.password) {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "password is required"
                })
                return;
            }
            let cd = await checkDataAccount(data);
            console.log('checkDataAccount =>', cd)
            resolve(cd);

        } catch (e) {
            console.log('Error login ==> ', e);
            resolve({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: "Internal server error, please try again!"
            })
        }
    })
}

async function checkDataAccount(data) {
    try {
        var res = {}, resData = {};
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url, {
            useNewUrlParser: true
        });
        let query = await accountSchema.findOne({
            "email": data.email
        }, {fullname: 1, email: 1, phone: 1, password: 1, _id: 1 });
        console.log('query =>',query)
        await mongoose.connection.close();
        if (query === null) {            
            res = {
                responseCode: process.env.NOTACCEPT_RESPONSE,
                responseMessage: "Data not found"
            }
        } else {
            if(data.password) {
                resData = query;
                let password = data.email + ":" + data.password;
                console.log('password =>',password)
                console.log('query =>',query)
                let check = await argon2.verify(query.password, password);
                console.log('argon2 check =>', check)
                if(check) {
                    var token = await generateToken(query)
                    console.log('generateToken =>',token)
                    if(token != process.env.ERRORINTERNAL_RESPONSE) {
                        resData = {
                            _id: query._id,
                            fullname: query.fullname,
                            email: query.email,
                            phone: query.phone,
                            token: token
                        }; 
                        console.log('resData new =>',resData)
                    }
                    var u = await updateToken(resData)
                    console.log('updateToken =>',u)

                    res = {
                        responseCode: process.env.SUCCESS_RESPONSE,
                        responseMessage: "Success",
                        data: resData
                    }    
                }else{
                    res = {
                        responseCode: process.env.NOTACCEPT_RESPONSE,
                        responseMessage: "Data not found"
                    }    
                }
            }else{      
                res = {
                    responseCode: process.env.SUCCESS_RESPONSE,
                    responseMessage: "Success"
                }
            }
        }
        return (res)
    } catch (e) {
        console.log('Error check data account ==> ', e);
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}

exports.checkExistAccount = function (data) { // checking account for edit profile
    console.log('checkExistAccount =>', data)
    return new Promise(async function (resolve, reject) {
        try {
            let cd = await checkExistAccount(data);
            resolve(cd);
        } catch (e) {
            console.log('Error checkExistAccount ===> ', e);
            return ({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: 'Internal server error, please try again!'
            })
        }
    })
}

async function generateToken(data) {
    try {
      let payload = {
        id: data._id,
        fullname: data.fullname,
        email: data.email,
        phone: data.phone
      };
      console.log('payload =>',payload)
  
      // PRIVATE and PUBLIC key
      let privateKEY = fs.readFileSync("./private.key", "utf8");
    //   let publicKEY = fs.readFileSync("./public.key", "utf8");
      let i = process.env.ISSUER_CONTACT; // Issuer
      let s = process.env.SUBJECT_KEY; // Subject
      let a = process.env.AUDIENCE_SCOPE; // Audience
  
      // SIGNING OPTIONS
      let signOptions = {
        issuer: i,
        subject: s,
        audience: a,
        expiresIn: "1h",
        algorithm: "RS256",
      };
      let token = await jwt.sign(payload, privateKEY, signOptions);

      console.log('token =>',token)
    //   let token = await wrapToken(tk);
    //   console.log('tkkkkkkkkkkkkkkk final =>',token)
      // let token = tk;
      return token;
    } catch (err) {
      console.log("error generate token => ", err);
      return process.env.ERRORINTERNAL_RESPONSE;
    }
  }
  async function updateToken(data) {
    let newValues = {};
    try {
        let sorting = {
            "createdDate": "-1"
        };
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url);
        let tc = await accountSchema.findOneAndUpdate({_id: data._id}, {
            $set: {token : data.token}
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
        console.log('Error updateToken ==> ', e)
        return ({
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            responseMessage: "Internal server error, please try again!"
        })
    }
}
exports.checkToken = function (token) {
    return new Promise(async function (resolve, reject) {
        try {
            let un = await unWrap(token);
            console.log('UN => ', un)
            if (un == process.env.UNAUTHORIZED_RESPONSE) {
                console.log('Check token has been expired!')
                message = {
                    "responseCode": process.env.UNAUTHORIZED_RESPONSE,
                    "responseMessage": "Your token has been expired. Please login again!"
                }
                resolve(message);
            } else if (un == process.env.ERRORINTERNAL_RESPONSE) {
                console.log('Check token have something problem!')
                message = {
                    "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                    "responseMessage": "Internal server error"
                }
                resolve(message);
            } else {
                let ct = await checkValidToken(token);
                if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
                    message = {
                        "responseCode": process.env.SUCCESS_RESPONSE,
                        "responseMessage": "Your data token",
                        "data": un
                    }
                    resolve(message);
                } else {
                    resolve(ct);
                }
            }
        } catch (err) {
            console.log("error checking token on authentication => ", err)
            message = {
                "responseCode": process.env.ERRORINTERNAL_RESPONSE,
                "responseMessage": "Something error in internal server!"
            }
            resolve(message);
        }
    });
}

async function unWrap(data) {
    try {
        console.log('UNWRAP DATA => ', data)
        let publicKEY = fs.readFileSync('./public.key', 'utf8');
        let i = process.env.ISSUER_CONTACT; // Issuer 
        let s = process.env.SUBJECT_KEY; // Subject 
        let a = process.env.AUDIENCE_SCOPE; // Audience
        let verifyOptions = {
            issuer: i,
            subject: s,
            audience: a,
            expiresIn: "1h",
            algorithm: "RS256"
        };
        let cj = jwt.verify(data, publicKEY, verifyOptions);
        console.log('UNWRAP => ', cj)
        return cj;
    } catch (err) {
        console.log('Error unwrap => ', err)
        if (err == "TokenExpiredError: jwt expired" || err == "JsonWebTokenError: jwt malformed") {
            return process.env.UNAUTHORIZED_RESPONSE;
        } else {
            return process.env.ERRORINTERNAL_RESPONSE;
        }
    }
}
async function checkValidToken(token) {
    let res = {};
    try {
        mongoose.Promise = global.Promise;
        await mongoose.connect(mongo.mongoDb.url, {
            useNewUrlParser: true
        });
        let query = await accountSchema.findOne({
            "token": token
        });
        console.log('query =>',query)
        await mongoose.connection.close();
        if (query === null) {            
            res.responseCode = process.env.UNAUTHORIZED_RESPONSE;
            res.responseMessage = "Please login first!";
        } else {
            res.responseCode = process.env.SUCCESS_RESPONSE;
        }
        return res;
        
    } catch (e) {
        console.log('Error check valid token on pg database => ', e);
        res.responseCode = process.env.ERRORINTERNAL_RESPONSE;
        res.responseMessage = "Internal server error";
    }
}
exports.logoutAccount = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            let sorting = {
                "createdDate": "-1"
            };
            if (!data.token) {
                resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "token is required"
                })
                return;
            }
            mongoose.Promise = global.Promise;
            await mongoose.connect(mongo.mongoDb.url);
            let tc = await accountSchema.findOneAndUpdate({token: data.token}, {
                $set: {token : ''}
            }, {
                new: true,
                sort: sorting
            });
            await mongoose.connection.close();
            if (tc) {
                return resolve({
                    responseCode: process.env.SUCCESS_RESPONSE,
                    responseMessage: "Success",
                    data: tc
                })
            } else {
                return resolve({
                    responseCode: process.env.NOTACCEPT_RESPONSE,
                    responseMessage: "Failed"
                })
            }            

        } catch (e) {
            console.log('Error logoutAccounte ==> ', e);
            resolve({
                responseCode: process.env.ERRORINTERNAL_RESPONSE,
                responseMessage: "Internal server error, please try again!"
            })
        }
    })
}