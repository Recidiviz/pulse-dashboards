// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import Base64 from "crypto-js/enc-base64";
import SHA256 from "crypto-js/sha256";
import escape from "escape-html";
import { validationResult } from "express-validator";
import fs from "fs";
import { GoogleAuth } from "google-auth-library";
import snakeCase from "lodash/snakeCase";
import path from "path";
import sanitizeFilename from "sanitize-filename";
import { fileURLToPath } from "url";
import { v4 as uuidV4 } from "uuid";

import {
  cacheResponse,
  fetchAndFilterNewRevocationFile,
  fetchMetrics,
  fetchOfflineUser,
  refreshRedisCache,
} from "../core";
import {
  createSubsetFilters,
  createUserRestrictionsFilters,
  getNewRevocationsFiltersByMetricName,
} from "../filters";
import { formatKeysToSnakeCase } from "../utils";
import { getCacheKey } from "../utils/cacheKeys";
import { getAppMetadata } from "../utils/getAppMetadata";
import { isOfflineMode } from "../utils/isOfflineMode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let serviceAccount;

if (!isOfflineMode()) {
  serviceAccount = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        `../../configs/${process.env.GOOGLE_APPLICATION_CREDENTIALS}`,
      ),
    ),
  );
}

const BAD_REQUEST = 400;
const FORBIDDEN = 403;
export const SERVER_ERROR = 500;
/**
 * A callback which returns either an error payload or a data payload.
 *
 * Structure of error responses from GCS
 * https://cloud.google.com/storage/docs/json_api/v1/status-codes#404-not-found
 */
export function responder(res) {
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
      res.set("X-Content-Type-Options", "nosniff");
      res.send(data);
    }
  };
}

// TODO: Generalize this API to take in the metric type and file as request parameters in all calls
export function offlineUser(req, res) {
  const options = req.query;
  const user = fetchOfflineUser(options);
  responder(res)(null, user);
}

export function refreshCache(req, res) {
  const { stateCode, metricType } = req.params;
  refreshRedisCache(
    () => fetchMetrics(stateCode, metricType, null, isOfflineMode()),
    stateCode,
    metricType,
    responder(res),
  );
}

export function respondWithForbidden(res) {
  responder(res)(
    {
      status: FORBIDDEN,
      errors: ["User does not have permission to access this resource"],
    },
    null,
  );
}

export function respondWithBadRequest(res, errors) {
  responder(res)(
    {
      status: BAD_REQUEST,
      errors,
    },
    null,
  );
}

export function workflowsTemplates(req, res, next) {
  const { stateCode } = req.params;
  const { filename } = req.query;
  const sanitizedFileName = sanitizeFilename(filename);
  const filepath = path.resolve(
    __dirname,
    `../assets/workflowsTemplates/${stateCode}/${sanitizedFileName}`,
  );
  res.sendFile(filepath, {}, (err) => {
    if (err) {
      const error = {
        message: `Failed to send file ${sanitizedFileName} for stateCode ${stateCode}. ${err}`,
      };
      next(error);
    }
  });
}

export function newRevocations(req, res) {
  const { stateCode } = req.params;
  const metricType = "newRevocation";
  const cacheKey = getCacheKey({ stateCode, metricType });
  cacheResponse(
    cacheKey,
    () => fetchMetrics(stateCode, metricType, null, isOfflineMode()),
    responder(res),
  );
}

export function newRevocationFile(req, res) {
  const metricType = "newRevocation";
  const validations = validationResult(req);
  const hasErrors = !validations.isEmpty();
  if (hasErrors) {
    respondWithBadRequest(res, validations.array());
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
          isOfflineMode: isOfflineMode(),
        }),
      responder(res),
    );
  }
}

export function populationProjectionsMethodology(req, res) {
  const { stateCode } = req.params;
  const file = `${path.resolve(
    "./",
  )}/server/assets/populationProjections/${stateCode.toLowerCase()}_methodology.pdf`;
  res.download(file);
}

export function vitals(req, res) {
  const appMetadata = getAppMetadata(req);
  const allowed =
    appMetadata.state_code === "recidiviz" ||
    isOfflineMode() ||
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
    () => fetchMetrics(stateCode, metricType, null, isOfflineMode()),
    responder(res),
  );
}

export function pathways(req, res) {
  const { stateCode, file: metricName } = req.params;
  const metricType = "pathways";
  const appMetadata = getAppMetadata(req);

  const allowed =
    appMetadata.state_code === "recidiviz" ||
    isOfflineMode() ||
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
    });

  if (!allowed) {
    respondWithForbidden(res);
    return;
  }

  const cacheKey = getCacheKey({ stateCode, metricType, metricName });
  cacheResponse(
    cacheKey,
    () => fetchMetrics(stateCode, metricType, metricName, isOfflineMode()),
    responder(res),
  );
}

export function generateFileLink(req, res, next) {
  const { file } = req;
  const fileName = `${uuidV4()}-${sanitizeFilename(file.originalname)}`;
  const protocol = process.env.AUTH_ENV === "development" ? `http` : `https`;

  const reqHeadersHost = escape(req.headers.host);

  fs.writeFile(`/tmp/${fileName}`, file.buffer, function (err) {
    if (err) {
      const error = {
        message: `Failed to write file for download: ${fileName}. ${err.message}`,
      };
      next(error);
    }
  });
  res.send(`${protocol}://${reqHeadersHost}/file/${fileName}`);
}

export function upload(req, res, next) {
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
      const error = {
        message: `Failed to send file for download: ${fileName}. ${sendErr.message}`,
      };
      next(error);
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
          const error = {
            message: `Failed to delete file: ${fileName}. ${delErr.message}`,
          };
          next(error);
        }
      });
    }
  });
}

export function sanitizeUserHash(userHash) {
  if (userHash.startsWith("/")) {
    return userHash.replace("/", "_");
  }
  return userHash;
}

export async function getImpersonatedUserRestrictions(req, res) {
  if (isOfflineMode()) {
    responder(res)(
      new Error("Impersonate user is not available in offline mode"),
    );
    return;
  }

  const { impersonatedEmail: email } = req.query;
  const userHash = sanitizeUserHash(Base64.stringify(SHA256(email)));
  const url = `${process.env.RECIDIVIZ_DATA_API_URL}/auth/users/${userHash}`;
  try {
    const auth = new GoogleAuth({ credentials: serviceAccount });
    const client = await auth.getIdTokenClient(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_TARGET_AUDIENCE,
    );
    const response = await client.request({ url });
    responder(res)(null, response.data);
  } catch (error) {
    console.error(error);
    responder(res)(error);
  }
}
