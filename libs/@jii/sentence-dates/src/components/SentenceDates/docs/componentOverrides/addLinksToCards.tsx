// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { GoLink } from "~@jii/common-ui";

import { defaultComponents } from "../../../defaultComponents";
import { SentenceDates, SentenceDatesProps } from "../../SentenceDates";
import { SentenceDatesComponents } from "../../types";

const CustomBodyWrapper: SentenceDatesComponents["DateCardBodyWrapper"] = ({
  children,
  className,
  datePresenter,
}) => {
  // here you could import the relevant translation hook and retrieve some text from that,
  // using datePresenter.id to match the correct value
  const linkText = `Learn more about ${datePresenter.cardLabelText}`;

  return (
    // import the default component to avoid reimplementing it
    <defaultComponents.DateCardBodyWrapper
      // passing through required props
      className={className}
      datePresenter={datePresenter}
    >
      {children}
      {/* to extend the contents, just add children */}
      <GoLink
        // this would be a real React Router path, not this placeholder
        to={`#${datePresenter.id}`}
      >
        {linkText}
      </GoLink>
    </defaultComponents.DateCardBodyWrapper>
  );
};

const render = ({ data, stateCode }: SentenceDatesProps) => {
  return (
    <SentenceDates
      data={data}
      componentOverrides={{
        DateCardBodyWrapper: CustomBodyWrapper,
      }}
      stateCode={stateCode}
    />
  );
};

export default render;
