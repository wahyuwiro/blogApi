'use strict';

var utils = require('../utils/writer.js');
// const pgCon = require('../config/pgConfig');
var isValid = '';
const master = require('../service/masterService');
const auth = require('../service/authService');
var log={}

module.exports.getProfile = async function getProfile(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;
    // check token 
    let ct = await auth.checkToken(token);
    if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
        var data = JSON.stringify(ct.data);
        let response = await master.getProfile(data);
        utils.writeJson(res, response);
    } else {
        utils.writeJson(res, ct);
    }    
}
module.exports.updateProfile = async function updateProfile(req, res) {
    var token = req.swagger.params['token'].value;
    var signature = req.swagger.params['signature'].value;

    var body = req.swagger.params['body'].value;
    if (req.swagger.params['deviceId'].value) {
        body.deviceId = req.swagger.params['deviceId'].value;
    }
    let response = await master.updateProfile(body);
    utils.writeJson(res, response);

}

module.exports.insertBlog = async function insertBlog(req, res) {
    var token = req.swagger.params['token'].value;
    var body = req.swagger.params['body'].value;
    // check token 
    let ct = await auth.checkToken(token);
    if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
        // var data = JSON.stringify(ct.data);
        body.profile = ct.data;
        let response = await master.insertBlog(body);
        utils.writeJson(res, response);
    } else {
        utils.writeJson(res, ct);
    }    
}

module.exports.updateBlog = async function updateBlog(req, res) {
    var token = req.swagger.params['token'].value;
    var body = req.swagger.params['body'].value;
    // check token 
    let ct = await auth.checkToken(token);
    if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
        // var data = JSON.stringify(ct.data);
        body.profile = ct.data;
        let response = await master.updateBlog(body);
        utils.writeJson(res, response);
    } else {
        utils.writeJson(res, ct);
    }    
}

module.exports.deleteBlog = async function deleteBlog(req, res) {
    var token = req.swagger.params['token'].value;
    var param = req.swagger.params['param'].value;
    var body = req.swagger.params['body'].value;
    if(param) body = JSON.parse(param)
    // check token 
    let ct = await auth.checkToken(token);
    if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
        // var data = JSON.stringify(ct.data);
        body.profile = ct.data;
        let response = await master.deleteBlog(body);
        utils.writeJson(res, response);
    } else {
        utils.writeJson(res, ct);
    }    
}
module.exports.getBlog = async function getBlog(req, res) {
    var token = req.swagger.params['token'].value;
    var param = req.swagger.params['param'].value;
    if(!param) { param = {}
    }else{ param = JSON.parse(param)
    }
    // check token 
    let ct = await auth.checkToken(token);
    if (ct.responseCode == process.env.SUCCESS_RESPONSE) {
        // var data = JSON.stringify(ct.data);
        param.profile = ct.data;
        let response = await master.getBlog(param);
        utils.writeJson(res, response);
    } else {
        utils.writeJson(res, ct);
    }    
}
module.exports.getArticle = async function getArticle(req, res) {
    var signature = req.swagger.params['signature'].value;
    var param = req.swagger.params['param'].value;
    if(!param) { param = {}
    }else{ param = JSON.parse(param)
    }
    // check signature 
    let response = await master.getArticle(param);
    utils.writeJson(res, response);

}