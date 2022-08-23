// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
 * This file contains route handlers for calls to our Metrics API, to be mapped to app routes
 * in server.js.
 */
const { validationResult } = require("express-validator");
const uuid = require("uuid");
const fs = require("fs");
const path = require("path");
const escape = require("escape-html");
const sanitizeFilename = require("sanitize-filename");
const { snakeCase } = require("lodash");

const {
  refreshRedisCache,
  fetchMetrics,
  cacheResponse,
  fetchAndFilterNewRevocationFile,
  fetchOfflineUser,
} = require("../core");
const { isOfflineMode } = require("../utils/isOfflineMode");
const { getCacheKey } = require("../utils/cacheKeys");
const { getAppMetadata } = require("../utils/getAppMetadata");
const {
  createSubsetFilters,
  createUserRestrictionsFilters,
  getNewRevocationsFiltersByMetricName,
} = require("../filters");
const { formatKeysToSnakeCase } = require("../utils");

const BAD_REQUEST = 400;
const FORBIDDEN = 403;
const SERVER_ERROR = 500;
/**
 * A callback which returns either an error payload or a data payload.
 *
 * Structure of error responses from GCS
 * https://cloud.google.com/storage/docs/json_api/v1/status-codes#404-not-found
 */
function responder(res) {
  return (err, data) => {
    if (err) {
      const status = err.status || err.code || SERVER_ERROR;
      const errors = err.message || err.errors;
      res.status(status).send({
        status,
        errors: [].concat(errors),
      });
    } else {
      res.set("Cache-Control", "no-store, max-age=0");
      res.send(data);
    }
  };
}

// TODO: Generalize this API to take in the metric type and file as request parameters in all calls
function offlineUser(req, res) {
  const options = req.query;
  const user = fetchOfflineUser(options);
  responder(res)(null, user);
}

function refreshCache(req, res) {
  const { stateCode, metricType } = req.params;
  refreshRedisCache(
    () => fetchMetrics(stateCode, metricType, null, isOfflineMode),
    stateCode,
    metricType,
    responder(res)
  );
}

function respondWithForbidden(res) {
  responder(res)(
    {
      status: FORBIDDEN,
      errors: ["User does not have permission to access this resource"],
    },
    null
  );
}

function workflowsTemplates(req, res, next) {
  const { stateCode } = req.params;
  const { filename } = req.query;
  const filepath = path.resolve(
    __dirname,
    `../assets/workflowsTemplates/${stateCode}/${filename}`
  );
  res.sendFile(filepath, {}, (err) => {
    if (err) {
      const error = {
        message: `Failed to send file ${filename} for stateCode ${stateCode}. ${err}`,
      };
      next(error);
    }
  });
}

function newRevocations(req, res) {
  const { stateCode } = req.params;
  const metricType = "newRevocation";
  const cacheKey = getCacheKey({ stateCode, metricType });
  cacheResponse(
    cacheKey,
    () => fetchMetrics(stateCode, metricType, null, isOfflineMode),
    responder(res)
  );
}

function newRevocationFile(req, res) {
  const metricType = "newRevocation";
  const validations = validationResult(req);
  const hasErrors = !validations.isEmpty();
  if (hasErrors) {
    responder(res)({ status: BAD_REQUEST, errors: validations.array() }, null);
  } else {
    const { stateCode, file: metricName } = req.params;
    const appMetadata = getAppMetadata(req);

    const queryParams = formatKeysToSnakeCase(req.query || {});

    const userRestrictionsFilters = createUserRestrictionsFilters(appMetadata);

    const subsetFilters = createSubsetFilters({
      filters: queryParams,
    });

    const filters = getNewRevocationsFiltersByMetricName({
      metricName,
      subsetFilters,
      userRestrictionsFilters,
    });

    const cacheKey = getCacheKey({
      stateCode,
      metricType,
      metricName,
      cacheKeySubset: { ...queryParams, ...userRestrictionsFilters },
    });

    cacheResponse(
      cacheKey,
      () =>
        fetchAndFilterNewRevocationFile({
          stateCode,
          metricType,
          metricName,
          filters,
          isOfflineMode,
        }),
      responder(res)
    );
  }
}

function goals(req, res) {
  const { stateCode } = req.params;
  const metricType = "goals";
  const cacheKey = getCacheKey({ stateCode, metricType });
  cacheResponse(
    cacheKey,
    () => fetchMetrics(stateCode, metricType, null, isOfflineMode),
    responder(res)
  );
}

function communityExplore(req, res) {
  const { stateCode } = req.params;
  const metricType = "communityExplore";
  const cacheKey = getCacheKey({ stateCode, metricType });
  cacheResponse(
    cacheKey,
    () => fetchMetrics(stateCode, metricType, null, isOfflineMode),
    responder(res)
  );
}

function facilitiesExplore(req, res) {
  const { stateCode } = req.params;
  const metricType = "facilitiesExplore";
  const cacheKey = getCacheKey({ stateCode, metricType });
  cacheResponse(
    cacheKey,
    () => fetchMetrics(stateCode, metricType, null, isOfflineMode),
    responder(res)
  );
}

function populationProjectionsMethodology(req, res) {
  const { stateCode } = req.params;
  const file = `${path.resolve(
    "./"
  )}/server/assets/populationProjections/${stateCode.toLowerCase()}_methodology.pdf`;
  res.download(file);
}

function vitals(req, res) {
  const appMetadata = getAppMetadata(req);
  const allowed =
    appMetadata.state_code === "recidiviz" ||
    isOfflineMode ||
    appMetadata.routes?.operations ||
    appMetadata.routes?.community_practices;
  if (!allowed) {
    respondWithForbidden(res);
    return;
  }

  const { stateCode } = req.params;
  const metricType = "vitals";
  const cacheKey = getCacheKey({ stateCode, metricType });
  cacheResponse(
    cacheKey,
    () => fetchMetrics(stateCode, metricType, null, isOfflineMode),
    responder(res)
  );
}

function pathways(req, res) {
  const { stateCode, file: metricName } = req.params;
  const metricType = "pathways";
  const appMetadata = getAppMetadata(req);

  const allowed =
    appMetadata.state_code === "recidiviz" ||
    isOfflineMode ||
    (appMetadata.can_access_leadership_dashboard &&
      Object.entries(appMetadata.routes).some(([route, status]) => {
        // routes have the format `system_prisonToSupervision: true`
        // metric names have the format `prison_to_supervision_count_by_month`
        if (!status) {
          return false;
        }
        const routeParts = route.split("_");
        if (routeParts.length !== 2 || routeParts[0] !== "system") {
          return false;
        }

        return (
          metricName.startsWith(snakeCase(routeParts[1])) &&
          // Make sure we don't consider system_prison as eligible for prison_to_supervision_count_by_month
          !metricName.startsWith(`${snakeCase(routeParts[1])}_to_`)
        );
      }));

  if (!allowed) {
    respondWithForbidden(res);
    return;
  }

  const cacheKey = getCacheKey({ stateCode, metricType, metricName });
  cacheResponse(
    cacheKey,
    () => fetchMetrics(stateCode, metricType, metricName, isOfflineMode),
    responder(res)
  );
}

function generateFileLink(req, res) {
  const { file } = req;
  const fileName = `${uuid.v4()}-${sanitizeFilename(file.originalname)}`;
  const protocol = process.env.AUTH_ENV === "development" ? `http` : `https`;

  const reqHeadersHost = escape(req.headers.host);

  fs.writeFile(`/tmp/${fileName}`, file.buffer, function (err) {
    if (err) {
      throw new Error(
        `Failed to write file for download: ${fileName}. ${err.message}`
      );
    }
  });
  res.send(`${protocol}://${reqHeadersHost}/file/${fileName}`);
}

function upload(req, res) {
  const options = {
    root: "/tmp",
    headers: {
      "x-timestamp": Date.now(),
      "x-sent": true,
    },
  };

  const fileName = sanitizeFilename(req.params.name);

  res.sendFile(fileName, options, (sendErr) => {
    if (sendErr) {
      throw new Error(
        `Failed to send file for download: ${fileName}. ${sendErr.message}`
      );
    }
    /*
    Chrome iOS sends two requests when downloading content. The first request has
    this upgrade-insecure-requests header, which will open the download dialog on the browser.
    Once the user clicks on the download link in the dialog, Chrome iOS will send a second request
    to download the content. This second request does not include this header, so we wait for the
    second request before deleting the file.
    */
    if (!req.headers["upgrade-insecure-requests"]) {
      fs.unlink(path.join("/tmp", fileName), (delErr) => {
        /* Delete temp file after it's been sent */
        if (delErr) {
          throw new Error(
            `Failed to delete file: ${fileName}. ${delErr.message}`
          );
        }
      });
    }
  });
}

module.exports = {
  offlineUser,
  newRevocations,
  newRevocationFile,
  goals,
  communityExplore,
  facilitiesExplore,
  populationProjectionsMethodology,
  vitals,
  pathways,
  responder,
  refreshCache,
  generateFileLink,
  upload,
  workflowsTemplates,
  SERVER_ERROR,
};
