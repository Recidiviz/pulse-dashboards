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

import { BackLink, CopyWrapper, PageLinksFooter } from "~@jii/common-ui";
import { ScreenFillingWrapper } from "~@jii/layout";
import { State } from "~@jii/paths";
import { useUsAzTranslations } from "~@jii/translation";

import { useUsAzInfoPageFooterContents } from "../../../hooks/useUsAzInfoPageFooterContents";
import { AccordionSection } from "../../AccordionSection/AccordionSection";
import { linkToDateSection } from "../../utils/utils";

export function ClassificationFAQ() {
  const { t } = useUsAzTranslations();

  const { heading, backLink, questions } = t(
    ($) => $.classificationPoints.faq,
    {
      replace: {
        stpLinkUrl: `../../${linkToDateSection("tprDate")}`,
        dtpLinkUrl: `../../${linkToDateSection("dtpDate")}`,
        datesFAQUrl: `../../${State.Resident.$.UsAzMoreInformation.ImportantDates.buildRelativePath({})}`,
      },
      returnObjects: true,
    },
  );

  return (
    <ScreenFillingWrapper
      top={
        <article>
          <BackLink to={"../"}>{backLink}</BackLink>
          <CopyWrapper>{`# ${heading}`}</CopyWrapper>
          <AccordionSection
            accordionCopy={questions}
            id="classification-points-faq"
            sectionCopy={{
              openAllCopy: t(($) => $.openAll),
              closeAllCopy: t(($) => $.closeAll),
            }}
          />
        </article>
      }
      bottom={<PageLinksFooter contents={useUsAzInfoPageFooterContents()} />}
    />
  );
}
