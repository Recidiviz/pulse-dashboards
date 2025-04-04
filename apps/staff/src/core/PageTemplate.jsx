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

import "../assets/styles/index.scss";
import "./PageTemplate.scss";

import PropTypes from "prop-types";
import React from "react";

// Newer versions of Typescript infer the argument types too narrowly for this function;
// previously they all were just typed as any
/**
 * @param {Object} props
 * @param {any} [props.filters]
 * @param {any} [props.leftPanel]
 * @param {any} [props.mobileNavigation]
 */
function PageTemplate({
  children,
  filters = null,
  leftPanel = null,
  mobileNavigation = null,
}) {
  return (
    <div className="PageTemplate">
      {mobileNavigation}
      {leftPanel && <div className="PageTemplate__left-panel">{leftPanel}</div>}
      <div className="PageTemplate__body">
        {filters}
        <div className="row gap-20 pos-r">
          <div className="PageTemplate__content">{children}</div>
        </div>
      </div>
    </div>
  );
}

PageTemplate.defaultProps = {
  filters: null,
  leftPanel: null,
  mobileNavigation: null,
};

PageTemplate.propTypes = {
  children: PropTypes.node.isRequired,
  filters: PropTypes.node,
  leftPanel: PropTypes.node,
  mobileNavigation: PropTypes.node,
};

export default PageTemplate;
