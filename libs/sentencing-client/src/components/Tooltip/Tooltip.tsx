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

import { TooltipTrigger } from "@recidiviz/design-system";
import React, { PropsWithChildren } from "react";

import InfoIcon from "../assets/info-icon.svg?react";
import {
  TooltipBody,
  TooltipContentContainer,
  TooltipHeader,
} from "./Tooltip.styles";

export const TooltipContent: React.FC<{
  headerText?: string;
  content: string | React.ReactNode;
}> = ({ headerText, content }) => {
  return (
    <TooltipContentContainer>
      {headerText && <TooltipHeader>{headerText}</TooltipHeader>}
      <TooltipBody>{content}</TooltipBody>
    </TooltipContentContainer>
  );
};

export const Tooltip: React.FC<
  PropsWithChildren & {
    headerText?: string;
    content: string | React.ReactNode;
    disabled?: boolean;
    width?: number;
  }
> = ({ headerText, content, disabled, width, children }) => {
  if (disabled) {
    return children;
  }
  return (
    <TooltipTrigger
      backgroundColor="rgba(0, 31, 31, 1)"
      contents={<TooltipContent headerText={headerText} content={content} />}
      maxWidth={width ?? 318}
    >
      <span>{children}</span>
    </TooltipTrigger>
  );
};

export const InfoIconWithTooltip: React.FC<{
  headerText: string;
  content: string | React.ReactNode;
}> = ({ headerText, content }) => {
  return (
    <Tooltip headerText={headerText} content={content}>
      <InfoIcon style={{ marginBottom: "2px" }} />
    </Tooltip>
  );
};
