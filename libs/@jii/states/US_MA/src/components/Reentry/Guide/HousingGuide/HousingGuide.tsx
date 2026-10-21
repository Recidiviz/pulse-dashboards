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

import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { GuideCopy } from "../Guide.styles";
import { GuideAccordion } from "../GuideAccordion/GuideAccordion";
import { GuideCallout } from "../GuideCallout/GuideCallout";
import { GuideSection } from "../GuideSection/GuideSection";
import accountGroupIcon from "../icons/accountGroup.svg";
import { StepList } from "../StepList/StepList";
import { TipCallout } from "../TipCallout/TipCallout";

const HOUSING_OPTIONS_SECTION_ID = "housing-options";

export const HousingGuide = () => {
  const { t } = useUsMaTranslations();
  const routeParams = useTypedParams(State.Resident);

  const steps = t(($) => $.reentry.guide.housing.steps.items, {
    returnObjects: true,
    housingOptionsUrl: `#${HOUSING_OPTIONS_SECTION_ID}`,
    resourceExplorerUrl:
      State.Resident.UsMaReentry.Resources.CategoryResults.buildPath({
        ...routeParams,
        category: "housing",
      }),
  });

  const timingCallout = t(($) => $.reentry.guide.housing.timing.callout, {
    returnObjects: true,
  });

  return (
    <>
      <GuideSection
        id={HOUSING_OPTIONS_SECTION_ID}
        heading={t(($) => $.reentry.guide.housing.options.heading)}
      >
        <GuideAccordion
          id="housing-option-types"
          copy={t(($) => $.reentry.guide.housing.options.items, {
            returnObjects: true,
          })}
        />
      </GuideSection>

      <GuideSection heading={t(($) => $.reentry.guide.housing.timing.heading)}>
        <GuideCopy>{t(($) => $.reentry.guide.housing.timing.body)}</GuideCopy>
        <GuideCallout {...timingCallout} />
      </GuideSection>

      <GuideSection heading={t(($) => $.reentry.guide.housing.steps.heading)}>
        <GuideCopy>{t(($) => $.reentry.guide.housing.steps.intro)}</GuideCopy>
        <StepList steps={steps} />
        <TipCallout iconSrc={accountGroupIcon}>
          {t(($) => $.reentry.guide.housing.supportSystemTip)}
        </TipCallout>
      </GuideSection>

      <GuideSection heading={t(($) => $.reentry.guide.faqHeading)}>
        <GuideAccordion
          id="housing-faq"
          copy={t(($) => $.reentry.guide.housing.faq, { returnObjects: true })}
        />
      </GuideSection>
    </>
  );
};
