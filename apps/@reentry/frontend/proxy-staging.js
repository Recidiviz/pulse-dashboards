// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

/**
 * A simple Express server to proxy requests to the staging backend API with CORS enabled.
 * Useful for local frontend development against the staging backend which has CORS restrictions.
 * To use this, ensure that you've copied over all of the staging env vars into your dev env file (`.env`),
 * and that `NEXT_PUBLIC_API_URL` is pointed to http://localhost:3001 + the `PROXY_TARGET` is set to the staging API URL.
 *
 * You can launch the proxy server along with the frontend via this command: `nx dev:with-staging-proxy @reentry/frontend`
 */

require("dotenv").config();

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();

const PROXY_TARGET = process.env.PROXY_TARGET;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use(
  "/",
  createProxyMiddleware({
    target: PROXY_TARGET,
    changeOrigin: true,
    secure: true,
  }),
);

app.listen(3001, () =>
  console.log("Dev proxy listening on http://localhost:3001"),
);
