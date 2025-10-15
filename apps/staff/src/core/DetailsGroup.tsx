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

import "./DetailsGroup.scss";

import React from "react";

import { Dropdown, DropdownMenu, DropdownToggle, Icon, IconSVG } from "~design-system";

type Props = {
  expand?: boolean;
  children?: React.ReactNode;
};

const DetailsGroup: React.FC<Props> = ({ expand, children }) => {
  if (expand) {
    return <div className="DetailsGroup">{children}</div>;
  }

  return (
    <Dropdown className="DetailsGroup">
      <DropdownToggle
        kind="link"
        className="DetailsGroup__control"
        aria-label="More options"
        tabIndex={-1}
      >
        <Icon
          kind={IconSVG.TripleDot}
          width={16}
          height={16}
          aria-hidden={true}

        />
      </DropdownToggle>
      <DropdownMenu className="DetailsGroup__menu" ariaLabel="More options menu" alignment="right">
        {children}
      </DropdownMenu>
    </Dropdown>
  );
};

export default DetailsGroup;
