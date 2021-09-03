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

import "./PageNavigation.scss";

import cx from "classnames";
import React from "react";
import { Link } from "react-router-dom";

type propTypes = {
  currentView: string;
  currentPage: string;
  pageOptions: string[];
};

const PageNavigation: React.FC<propTypes> = ({
  currentView,
  currentPage,
  pageOptions,
}) => {
  const capitalizeFirstLetter = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <ul className="PageNavigation">
      {pageOptions.map((page) => (
        <li key={page}>
          <Link
            to={`/${currentView}/${page}`}
            className={cx("PageNavigation--Option", {
              "PageNavigation--Option-Selected":
                (currentPage && currentPage.toLowerCase()) === page,
            })}
          >
            {capitalizeFirstLetter(page)}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default PageNavigation;
