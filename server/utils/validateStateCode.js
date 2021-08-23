/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

const { pathToRegexp } = require("path-to-regexp");

const { getAppMetadata } = require("./getAppMetadata");
const { lanternStateCodes } = require("../constants/stateCodes");

const validateStateCode = (exemptRoutes) => {
  return (req, res, next) => {
    const matchingRoutes = exemptRoutes.filter(
      (route) => pathToRegexp(route).exec(req.originalUrl) !== null
    );

    if (matchingRoutes.length > 0) {
      next();
      return;
    }

    const reqStateCode = req.params.stateCode.toLowerCase();
    // only filter on state codes (us_xx)
    if (/us_[a-z][a-z]/.exec(reqStateCode) === null) {
      res
        .status(400)
        .send(`Invalid stateCode value: ${reqStateCode.toUpperCase()}`);
      return;
    }
    const metadata = getAppMetadata(req);
    let userStateCode = metadata.state_code || "";
    userStateCode = userStateCode.toLowerCase();
    if (
      userStateCode === "recidiviz" ||
      userStateCode === reqStateCode ||
      (userStateCode === "lantern" &&
        lanternStateCodes.map((c) => c.toLowerCase()).includes(reqStateCode))
    ) {
      next();
    } else {
      // User is requesting data from a different state
      // Return 401 - Unauthorized
      res
        .status(401)
        .send(
          `User is not authorized for stateCode: ${reqStateCode.toUpperCase()}`
        );
    }
  };
};
module.exports = { validateStateCode };
