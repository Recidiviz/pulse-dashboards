// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const multer = require("multer");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const rateLimit = require("express-rate-limit");
const Sentry = require("@sentry/node");

const { pathToRegexp } = require("path-to-regexp");
const devAuthConfig = require("../src/auth_config_dev.json");
const productionAuthConfig = require("../src/auth_config_production.json");
const demoAuthConfig = require("../src/auth_config_demo.json");
const api = require("./routes/api");
const {
  newRevocationsParamValidations,
  workflowsTemplatesParamValidations,
} = require("./routes/paramsValidation");
const { validateStateCode } = require("./utils/validateStateCode");
const { getFirebaseToken } = require("./workflows/firebaseToken");

const app = express();

const upload = multer();

const limiter = rateLimit({
  windowMs: 1000, // 1 second = 1000ms
  max: 15, // each IP address gets 15 requests per 1 second
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // disabling the `X-RateLimit-*` headers
});

// apply rate limiter to all requests
app.use(limiter);

Sentry.init({
  environment: process.env.SENTRY_ENV,
  dsn: process.env.SENTRY_DNS,
});

// The Sentry request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

app.use(cors());

const port = process.env.NODE_ENV === "test" ? 3002 : process.env.PORT || 3001;

app.set("port", port);

const isOfflineMode = process.env.IS_OFFLINE === "true";

const authEnv = process.env.AUTH_ENV;

const stateApiBaseRoute = "/api/:stateCode(us_[a-z][a-z]|US_[A-Z][A-Z])/";

const routesExemptFromJwtValidation = [
  "/_ah/warmup",
  "/_ah/start",
  "/api/demoUser",
  "/file/:name",
  `${stateApiBaseRoute}:metricType/refreshCache`,
].map((p) => pathToRegexp(p));

const routesExemptFromStateCodeValidation = [
  `${stateApiBaseRoute}:metricType/refreshCache`,
].map((p) => pathToRegexp(p));

let authConfig = null;
if (authEnv === "production") {
  authConfig = productionAuthConfig;
} else if (authEnv === "demo") {
  authConfig = demoAuthConfig;
} else if (authEnv === "development") {
  authConfig = devAuthConfig;
} else {
  authConfig = { domain: "test", audience: "test" };
}

if (!authConfig.domain || !authConfig.audience) {
  throw new Error(
    "Please make sure that auth_config.json is in place and populated"
  );
}

app.use(morgan("dev"));
app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
  })
);
app.use(helmet.frameguard({ action: "DENY" }));

if (app.get("env") === "production") {
  // This is required to avoid "Unable to verify authorization request state" with Auth0
  app.set("trust proxy", true);
}

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"],
});

// See: https://cloud.google.com/appengine/docs/standard/nodejs/scheduling-jobs-with-cron-yaml#validating_cron_requests
function validateCronRequest(req, res, next) {
  if (req.get("X-Appengine-Cron") !== "true" && !isOfflineMode) {
    res.sendStatus(403);
  } else {
    next();
  }
}

function validateOfflineRequest(req, res, next) {
  if (!isOfflineMode) {
    res.sendStatus(403);
  } else {
    next();
  }
}

function errorHandler(err, _req, res, next) {
  if (err && err.message) {
    res
      .status(api.SERVER_ERROR)
      .send({ status: api.SERVER_ERROR, errors: [err.message] });
  } else {
    next(err);
  }
}
if (!isOfflineMode && authEnv !== "test") {
  app.use(checkJwt.unless({ path: routesExemptFromJwtValidation }));

  // Verify that the user has access to state-specific date
  // for all state-specific routes
  app.use(
    stateApiBaseRoute,
    validateStateCode().unless({ path: routesExemptFromStateCodeValidation })
  );
}

app.get("/api/offlineUser", validateOfflineRequest, api.offlineUser);
app.get(
  `${stateApiBaseRoute}:metricType/refreshCache`,
  validateCronRequest,
  api.refreshCache
);
app.get(`${stateApiBaseRoute}newRevocations`, api.newRevocations);
app.get(
  "/api/:stateCode/newRevocations/:file",
  newRevocationsParamValidations,
  api.newRevocationFile
);
app.get(`${stateApiBaseRoute}goals`, api.goals);
app.get(`${stateApiBaseRoute}community/explore`, api.communityExplore);
app.get(`${stateApiBaseRoute}facilities/explore`, api.facilitiesExplore);
app.get(`${stateApiBaseRoute}vitals`, api.vitals);
app.get(
  `${stateApiBaseRoute}projections/methodology.pdf`,
  api.populationProjectionsMethodology
);
app.get(`${stateApiBaseRoute}pathways/:file`, api.pathways);
app.post("/api/generateFileLink", upload.single("zip"), api.generateFileLink);
app.get("/file/:name", api.upload);
app.get(
  `${stateApiBaseRoute}workflows/templates`,
  workflowsTemplatesParamValidations,
  api.workflowsTemplates
);

// An App Engine-specific API for handling warmup requests on new instance initialization
app.get("/_ah/warmup", () => {
  // The server automatically launches initialization of the metric cache, so nothing is needed here
  // eslint-disable-next-line no-console
  console.log("Responding to warmup request...");
});

// authenticates the user to Firestore with Auth0 credential
app.get("/token", getFirebaseToken);

// The Sentry error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

app.use(errorHandler);

module.exports = { app, port };
