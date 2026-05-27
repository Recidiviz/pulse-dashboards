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

import { rem, rgba } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { useUsNdTranslations } from "~@jii/translation";
import { palette } from "~design-system";

import { Banner, BannerCopy } from "./Banner";

const Wrapper = styled(Banner)`
  border-left: ${rem(4)} solid ${palette.signal.important};
  background: ${rgba(palette.signal.important, 0.1)};
`;

export const DataValidationBanner: FC = () => {
  const { t } = useUsNdTranslations();

  return (
    <Wrapper>
      <BannerCopy>{t(($) => $.dataValidationBanner.message)}</BannerCopy>
    </Wrapper>
  );
};
