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

import * as React from "react";

import { InfoBannerText, InfoBannerWrapper } from "./InfoBanner.styles";

export interface InfoBannerProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * A one-off inline callout for surfacing a short informational note within a
 * modal (e.g. that a dataset is unfiltered). There's no shared banner/callout
 * primitive in the design system yet, so this is local to the download flow.
 * Callers compose a leading `<Icon kind="Info" />` into `children` themselves.
 */
export const InfoBanner: React.FC<InfoBannerProps> = ({
  className,
  children,
}) => (
  <InfoBannerWrapper className={className} role="note">
    <InfoBannerText>{children}</InfoBannerText>
  </InfoBannerWrapper>
);
