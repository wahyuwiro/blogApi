'use strict';
const pg = require('pg');
const credential = require('../config/pgConfig');

exports.query = function (data) {
  // console.log('QUERY ON POSTGRE ==>', data);
  return new Promise(async function (resolve, reject) {
    try {
      const client = new pg.Client(credential);
      client.connect(async function (err, client, release) {
        if (err) {
          console.log('Error connect client postgre => ', err)
          resolve(process.env.ERRORINTERNAL_RESPONSE);
          client.release();
        } else {
          if (data.param) {
            client.query(data.query, data.param, (err, res) => {
              if (err) {
                console.log("err::", err);
                resolve(process.env.ERRORINTERNAL_RESPONSE);
                client.end();
                return
              }
              // console.log("res::", res);
              if (res.rowCount > 0) {
                resolve(res.rows);
                client.end();
              } else {
                resolve(process.env.NOTFOUND_RESPONSE);
                client.end();
              }
            });
          } else {
            client.query(data.query, (err, res) => {
              if (err) {
                console.log("err::", err);
                resolve(process.env.ERRORINTERNAL_RESPONSE);
                client.end();
                return
              }
              if (res.rowCount > 0) {
                resolve(res.rows)
                client.end();
              } else {
                resolve(process.env.NOTFOUND_RESPONSE);
                client.end();
              }
            });
          }

        }
      });
    } catch (err) {
      console.log("error execution query => ", err);
      resolve(process.env.ERRORINTERNAL_RESPONSE);
    }
  });
}