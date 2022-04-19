require('dotenv').config();
const request = require('request');
exports.addLog = function (data) {
    return new Promise(async function (resolve, reject) {
        try {
            resolve({});
        } catch (e) {
            console.log('Error bridging to log service ', e)
            let m = {
                responseCode: process.env.ERRORINTERNAL,
                responseMessage: 'Internal server error, please try again!'
            }
            resolve(m);
        }
    })
}