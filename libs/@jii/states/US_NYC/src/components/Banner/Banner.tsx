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

import { observer } from "mobx-react-lite";

import { useResidentsContext } from "~@jii/data";

import coverImage from "./assets/connections-cover.png";
import {
  BannerContainer,
  BannerCopy,
  BannerCoverImage,
  BannerRow,
  BannerText,
  BannerTitle,
  DismissButton,
} from "./Banner.styles";

const GUIDE_YEAR = 2026;

const COPY = {
  title: `${GUIDE_YEAR} Connections guide, digitized!`,
  body: `The community organizations, addresses, and contact information from the ${GUIDE_YEAR} Connections guide at your fingertips.`,
  dismiss: "Close",
};

export const Banner = observer(function Banner() {
  const { userProperties, residentsStore } = useResidentsContext();

  if (userProperties?.hasSeenResourcesOnboarding) return null;

  return (
    <BannerContainer $bgImage={coverImage}>
      <BannerCoverImage src={coverImage} alt="" />
      <BannerRow>
        <BannerCopy>
          <BannerTitle>{COPY.title}</BannerTitle>
          <BannerText>{COPY.body}</BannerText>
        </BannerCopy>
      </BannerRow>
      <DismissButton
        onClick={() => residentsStore.setUserResourcesOnboardingSeen()}
      >
        {COPY.dismiss}
      </DismissButton>
    </BannerContainer>
  );
});
