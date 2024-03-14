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

import "./Error.scss";

import React from "react";

import warningIcon from "../assets/static/images/warning.svg";

function ErrorMessage({
  error = new Error("Something went wrong while loading this chart."),
}: {
  error: Error;
}) {
  return (
    <div className="Error">
      <img src={warningIcon} alt="Error icon" className="Error__icon" />
      <p className="Error__text">{error.toString()}</p>
      <p className="Error__text">
        Check back later or contact{" "}
        <a href="mailto:feedback@recidiviz.org">feedback@recidiviz.org</a> if
        the issue continues.
      </p>
    </div>
  );
}

export default ErrorMessage;
