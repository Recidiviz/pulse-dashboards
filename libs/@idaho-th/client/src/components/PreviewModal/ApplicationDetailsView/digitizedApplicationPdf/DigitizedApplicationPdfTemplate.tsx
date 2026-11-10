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

import React from "react";

import type { HousingApplicationForm } from "../../../../components/HousingApplicationForm/types";
import { DigitizedApplicationPdfPage1 } from "./DigitizedApplicationPdfPage1";
import { DigitizedApplicationPdfPage2 } from "./DigitizedApplicationPdfPage2";
import { DigitizedApplicationPdfPage3 } from "./DigitizedApplicationPdfPage3";
import * as Styled from "./DigitizedApplicationPdfTemplate.styles";

const TOTAL_PAGES = 3;

export type DigitizedApplicationPdfTemplateProps = {
  formData: Partial<HousingApplicationForm> | null;
  /** Resolved provider names for formData.preferredProviders (which holds ids). */
  preferredProviderNames?: string[];
};

const Header: React.FC = () => (
  <Styled.TopBar>
    <Styled.BrandCluster>
      <Styled.BrandIcon>
        <Styled.BrandSquare />
        <Styled.BrandCircle />
      </Styled.BrandIcon>
      <Styled.Wordmark>Recidiviz</Styled.Wordmark>
    </Styled.BrandCluster>
    <Styled.DigitizedBy>Digitized by Recidiviz</Styled.DigitizedBy>
  </Styled.TopBar>
);

const PageChrome: React.FC<{ page: number }> = ({ page }) => (
  <Styled.PageFooter>
    <Styled.PageFooterLine>
      Page {page} of {TOTAL_PAGES}
    </Styled.PageFooterLine>
    <Styled.PageFooterLine>
      IDOC Data Sensitivity Classification - L3 Restricted
    </Styled.PageFooterLine>
  </Styled.PageFooter>
);

export const DigitizedApplicationPdfTemplate: React.FC<
  DigitizedApplicationPdfTemplateProps
> = ({ formData, preferredProviderNames = [] }) => {
  const values = formData ?? {};
  return (
    <div>
      <Styled.Page className="digitized-pdf-page">
        <Header />
        <DigitizedApplicationPdfPage1 formData={values} />
        <PageChrome page={1} />
      </Styled.Page>

      <Styled.Page className="digitized-pdf-page">
        <Header />
        <DigitizedApplicationPdfPage2
          formData={values}
          preferredProviderNames={preferredProviderNames}
        />
        <PageChrome page={2} />
      </Styled.Page>

      <Styled.Page className="digitized-pdf-page">
        <Header />
        <DigitizedApplicationPdfPage3 formData={values} />
        <PageChrome page={3} />
      </Styled.Page>
    </div>
  );
};
