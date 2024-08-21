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

import PropTypes from "prop-types";
import React from "react";
import { AnchorSection } from "react-anchor-navigation";

import ModelInfrastructureBlock from "./ModelInfrastructureBlock";

function MethodologyBlock({ contentBlock, target }) {
  return (
    <AnchorSection id={target}>
      <div>
        <h3 className="Methodology__block--title ">{contentBlock.label}</h3>
        <hr />
        {contentBlock.includeTable ? (
          <ModelInfrastructureBlock />
        ) : (
          <>
            {contentBlock.list === undefined ? (
              <p className="Methodology__block--content">{contentBlock.text}</p>
            ) : (
              <>
                <p className="Methodology__block--content">
                  {contentBlock.text}
                </p>
                <ul className="Methodology__block--content">
                  {contentBlock.list.map((liText) => (
                    <li key={liText}>{liText}</li>
                  ))}
                </ul>
              </>
            )}
            <div className="row" />
          </>
        )}
      </div>
    </AnchorSection>
  );
}
MethodologyBlock.propTypes = {
  target: PropTypes.string.isRequired,
  contentBlock: PropTypes.shape({
    label: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    list: PropTypes.arrayOf(PropTypes.string),
    includeTable: PropTypes.bool,
  }).isRequired,
};
export default MethodologyBlock;
