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

import { useUsMaTranslations } from "~@jii/translation";

import { DocumentTabs } from "../DocumentTabs/DocumentTabs";
import { GuideCopy } from "../Guide.styles";
import { GuideAccordion } from "../GuideAccordion/GuideAccordion";
import { GuideCallout } from "../GuideCallout/GuideCallout";
import { GuideSection } from "../GuideSection/GuideSection";
import infoIcon from "../icons/info.svg";
import { StepList } from "../StepList/StepList";
import { TipCallout } from "../TipCallout/TipCallout";

export const IdDocumentsGuide = () => {
  const { t } = useUsMaTranslations();

  const whyImportantCallout = t(
    ($) => $.reentry.guide.idDocuments.whyImportant.callout,
    { returnObjects: true },
  );

  return (
    <>
      <GuideSection
        heading={t(($) => $.reentry.guide.idDocuments.whyImportant.heading)}
      >
        <GuideCallout {...whyImportantCallout} />
        <GuideCopy>
          {t(($) => $.reentry.guide.idDocuments.whyImportant.body)}
        </GuideCopy>
        <TipCallout iconSrc={infoIcon}>
          {t(($) => $.reentry.guide.idDocuments.whyImportant.tip)}
        </TipCallout>
      </GuideSection>

      <GuideSection
        heading={t(($) => $.reentry.guide.idDocuments.steps.heading)}
      >
        <StepList
          steps={t(($) => $.reentry.guide.idDocuments.steps.items, {
            returnObjects: true,
          })}
        />
      </GuideSection>

      <GuideSection
        heading={t(($) => $.reentry.guide.idDocuments.documents.heading)}
      >
        <DocumentTabs
          documents={t(($) => $.reentry.guide.idDocuments.documents.items, {
            returnObjects: true,
          })}
        />
      </GuideSection>

      <GuideSection heading={t(($) => $.reentry.guide.faqHeading)}>
        <GuideAccordion
          id="id-documents-faq"
          copy={t(($) => $.reentry.guide.idDocuments.faq, {
            returnObjects: true,
          })}
        />
      </GuideSection>
    </>
  );
};
