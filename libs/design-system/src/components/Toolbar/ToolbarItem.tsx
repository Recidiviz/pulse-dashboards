// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import * as React from "react";
import styled from "styled-components/macro";

export const ToolbarItemElement = styled.div``;

export interface ToolbarItemProps {
  className?: string;
  children?: React.ReactNode;
}

export const ToolbarItem = ({
  className,
  children,
}: ToolbarItemProps): JSX.Element => {
  return (
    <ToolbarItemElement
      className={`ToolbarItem ${className}`}
      onMouseDown={(e) =>
        // prevents a blur from clobbering click event in Safari
        // https://stackoverflow.com/questions/17769005/onclick-and-onblur-ordering-issue/57630197#57630197
        e.preventDefault()
      }
      tabIndex={-1}
    >
      {children}
    </ToolbarItemElement>
  );
};
