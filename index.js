"use strict";
require('dotenv').config();
var fs = require("fs"),
  path = require("path"),
  mongoose = require('mongoose').set('debug', true),
  mongoConf = require('./config/mongo.js'),
  bodyParser = require('body-parser');
// http = require("http");

var app = require("restana")();
var helmet = require("helmet");
var swaggerTools = require("swagger-tools");
var jsyaml = require("js-yaml");
var serverPort = process.env.APP_PORT;
// swaggerRouter configuration
var options = {
  swaggerUi: path.join(__dirname, "/swagger.json"),
  controllers: path.join(__dirname, "./controllers"),
  useStubs: process.env.NODE_ENV === "development", // Conditionally turn on stubs (mock mode)
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync(path.join(__dirname, "api/swagger.yaml"), "utf8");
var swaggerDoc = jsyaml.safeLoad(spec);

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, async function (middleware) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi());

  app.use(
    bodyParser.json({
      limit: "5MB",
    })
  );
  app.use(helmet());

  app.use(
    bodyParser.urlencoded({
      limit: "5MB",
      extended: true,
      parameterLimit: 50000,
    })
  );

  app.start(serverPort, "0.0.0.0").then((server) => {
    console.log('Server running on port', serverPort)
        console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });

  mongoose.connect(mongoConf.mongoDb.url, {
    useUnifiedTopology: true
  }).then(function (e) {
    console.log("MONGO CONNECTED");
  });  
});
