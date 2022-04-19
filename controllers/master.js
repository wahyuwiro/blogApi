'use strict';

var utils = require('../utils/writer.js');
// const pgCon = require('../config/pgConfig');
var isValid = '';
const check = require('../controllers/check');
const masterService = require('../service/masterService');
const checking = require('../controllers/check');
const Cryptr = require('cryptr');
const fs = require('fs');
// let decode = require('im-decode');
const bufferImage = require("buffer-image");
var log={}

module.exports.getProfile = async function getProfile(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
    var param = req.swagger.params['param'].value;
    let body = {};
    // check token 
    let response = await masterService.getProfile(param);
    console.log('getProfile response =>',response)
    utils.writeJson(res, response);
}
module.exports.updateProfile = async function updateProfile(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;

    var body = req.swagger.params['body'].value;
    if (req.swagger.params['deviceId'].value) {
        body.deviceId = req.swagger.params['deviceId'].value;
    }
    let response = await masterService.updateProfile(body);
    utils.writeJson(res, response);

}
