'use strict';

require('dotenv').config();
var utils = require('../utils/writer.js');
// const pgCon = require('../config/pgConfig');
const request = require('request');
let isValid = '';
const authService = require('../service/authService');
const checking = require('../controllers/check');
const Cryptr = require('cryptr');
const check = require('../controllers/check');

module.exports.loginAccount = async function loginAccount(req, res) {
    var cont = req.swagger.params['continue'].value;
    var flowEntry = req.swagger.params['flowEntry'].value;
    var appSignature = req.swagger.params['appSignature'].value;
    var body = req.swagger.params['body'].value;
    var credential = {};

    credential.continue = cont;
    credential.flowEntry = flowEntry;
    credential.appSignature = appSignature;
    body.continue = cont;
    body.flowEntry = flowEntry;
    body.appSignature = appSignature;
    var log={}
    log.accAddress = req.headers.userIp + '_' + req.headers['user-agent'];
    log.link = req.url;
    log.method = req.method;
    body.log = log
    console.log('body 2 =>',body)

    let response = await authService.loginAccount(body);
    console.log('RESPONSE LOGIN ACCOUNT ===> ', response)
    utils.writeJson(res, response);
}

module.exports.getAccount = async function getAccount(req, res) {
    var appSignature = req.swagger.params['appSignature'].value;
    var param = req.swagger.params['param'].value;
    var body = {};
    body.appSignature = appSignature;
    body.param = JSON.parse(param);
    console.log('body=>',body)
    let response = await authService.getAccount(body);
    console.log('RESPONSE LOGIN ACCOUNT ===> ', response)
    utils.writeJson(res, response);
}
module.exports.logoutAccount = async function logoutAccount(req, res) {
    var token = req.swagger.params['token'].value;
    let body = {};
    body.token = token;

    // let response = await authService.logoutAccount(body);
    let response = {
        "responseCode": process.env.SUCCESS_RESPONSE,
        "responseMessage": "Success"
    }
    console.log('RESPONSE LOGOUT ACCOUNT ===> ', response)
    utils.writeJson(res, response);
}

module.exports.registerAccount = async function registerAccount(req, res) {
    var appId = req.swagger.params['appId'].value;
    var body = req.swagger.params['body'].value;
    body.appId = appId;

    let response = await authService.registerAccount(body);    
    console.log('RESPONSE REGISTER ACCOUNT ===> ', response)

    utils.writeJson(res, response);
}

module.exports.checkToken = async function checkToken(req, res, next) {
    let token = req.swagger.params['token'].value;
    try {
        let ct = await authService.checkToken(token);
        utils.writeJson(res, ct);
    } catch (err) {
        console.log('Error for checking token in controller => ', err)
        let b = {
            responseCode: process.env.ERRORINTERNAL_RESPONSE,
            error: err
        }
        utils.writeJson(res, b);
    }
};