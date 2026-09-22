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

import { usePageTitle } from "~@jii/common-ui";
import { useUsAzTranslations } from "~@jii/translation";

import { useInfoPageFooterLinks } from "../../hooks/useInfoPageFooterLinks";
import { DefinitionView } from "../DefinitionView";
import image1Url from "./image1.png";
import image2Url from "./image2.png";
import image3Url from "./image3.png";
import { IONInfoPageCopyWrapper } from "./IONInfoPageCopyWrapper";

export function IONInfoPage() {
  const { t } = useUsAzTranslations();
  const { heading, body } = t(($) => $.ion.infoPage, { returnObjects: true });
  usePageTitle(heading);

  // these images are checked in because we don't have infra for storing and displaying content assets
  const bodyWithImages = body
    // magic placeholder strings are hardcoded into the copy, see en.ts resource file
    .replace(/image-placeholder-1/, image1Url)
    .replace(/image-placeholder-2/, image2Url)
    .replace(/image-placeholder-3/, image3Url);

  return (
    <DefinitionView
      heading={heading}
      body={bodyWithImages}
      CopyWrapperOverride={IONInfoPageCopyWrapper}
      moreInfoPageLinks={useInfoPageFooterLinks()}
    />
  );
}
