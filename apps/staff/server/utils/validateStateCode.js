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

const unless = require("express-unless");
const { getAppMetadata } = require("./getAppMetadata");
const { csgStateCodes } = require("../constants/stateCodes");

const lowerCaseStateCodes = csgStateCodes.map((c) => c.toLowerCase());

const hasAccess = (userStateCode, reqStateCode) => {
  return (
    userStateCode === "recidiviz" ||
    userStateCode === reqStateCode ||
    (userStateCode === "csg" && lowerCaseStateCodes.includes(reqStateCode))
  );
};

const validateStateCode = () => {
  const validator = (req, res, next) => {
    const reqStateCode = req.params.stateCode.toLowerCase();
    const metadata = getAppMetadata(req);
    const userStateCode = (metadata.state_code || "").toLowerCase();
    if (hasAccess(userStateCode, reqStateCode)) {
      next();
    } else {
      res
        .status(401)
        .send(
          `User is not authorized for stateCode: ${reqStateCode.toUpperCase()}`,
        );
    }
  };

  validator.unless = unless;
  return validator;
};

module.exports = { validateStateCode };
