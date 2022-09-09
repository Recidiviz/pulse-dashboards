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
const http = require("http");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const devAuthConfig = require("./src/auth_config_dev.json");
const productionAuthConfig = require("./src/auth_config_production.json");
const api = require("./server/routes/api");

const app = express();

app.use(cors());

const port = process.env.PORT || 3001;
app.set("port", port);

const isDemoMode = process.env.IS_DEMO === "true";

const authEnv = process.env.AUTH_ENV;
let authConfig = null;
if (authEnv === "production") {
  authConfig = productionAuthConfig;
} else {
  authConfig = devAuthConfig;
}

if (!authConfig.domain || !authConfig.audience) {
  throw new Error(
    "Please make sure that auth_config.json is in place and populated"
  );
}

app.use(morgan("dev"));
app.use(helmet());

if (app.get("env") === "production") {
  // This is required to avoid "Unable to verify authorization request state" with Auth0
  app.set("trust proxy", true);
}

let checkJwt = jwt({
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

if (isDemoMode) {
  checkJwt = (req, res, next) => {
    next();
  };
}

app.get("/api/:stateCode/newRevocations", checkJwt, api.newRevocations);
app.get(
  "/api/:stateCode/newRevocations/:file",
  checkJwt,
  api.newRevocationFile
);
app.get("/api/:stateCode/community/goals", checkJwt, api.communityGoals);
app.get("/api/:stateCode/community/explore", checkJwt, api.communityExplore);
app.get("/api/:stateCode/facilities/goals", checkJwt, api.facilitiesGoals);
app.get("/api/:stateCode/facilities/explore", checkJwt, api.facilitiesExplore);
app.get(
  "/api/:stateCode/programming/explore",
  checkJwt,
  api.programmingExplore
);

// An App Engine-specific API for handling warmup requests on new instance initialization
app.get("/_ah/warmup", () => {
  // The server automatically launches initialization of the metric cache, so nothing is needed here
  // eslint-disable-next-line no-console
  console.log("Responding to warmup request...");
});

const server = http.createServer(app);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  // eslint-disable-next-line no-console
  console.log(`Listening on ${bind}`);
}

// eslint-disable-next-line no-console
server.listen(port, () => console.log(`Server listening on port ${port}`));
server.on("error", onError);
server.on("listening", onListening);
