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
    var signature = req.swagger.params['signature'].value;
    var body = req.swagger.params['body'].value;
    // var credential = {};
    // credential.continue = cont;
    // credential.flowEntry = flowEntry;
    // credential.signature = signature;
    // body.continue = cont;
    // body.flowEntry = flowEntry;

    body.signature = signature;
    console.log('body 2 =>',body)

    let response = await authService.loginAccount(body);
    console.log('RESPONSE LOGIN ACCOUNT ===> ', response)
    utils.writeJson(res, response);
}

module.exports.logoutAccount = async function logoutAccount(req, res) {
    var token = req.swagger.params['token'].value;
    let body = {};
    body.token = token;

    let response = await authService.logoutAccount(body);
    utils.writeJson(res, response);
}

module.exports.registerAccount = async function registerAccount(req, res) {
    var signature = req.swagger.params['signature'].value;
    var body = req.swagger.params['body'].value;
    body.signature = signature;

    let response = await authService.registerAccount(body);    
    console.log('RESPONSE REGISTER ACCOUNT ===> ', response)
    if(response.responseCode == process.env.SUCCESS_RESPONSE) {
        response = await authService.loginAccount(body); //auto login
    }

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