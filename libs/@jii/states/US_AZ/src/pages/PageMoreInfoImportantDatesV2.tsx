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

import {
  BackLink,
  CopyWrapper,
  PageLinksFooter,
  usePageTitle,
} from "~@jii/common-ui";
import { ScreenFillingWrapper } from "~@jii/layout";
import { useScrollToHash } from "~@jii/layout";
import { State } from "~@jii/paths";
import { useCommonTranslations, useUsAzTranslations } from "~@jii/translation";

import { UsAzImportantDatesFAQ } from "../components/ImportantDatesInfoPageV2/ImportantDatesFAQ";
import { useInfoPageFooterLinks } from "../hooks/useInfoPageFooterLinks";

export function PageMoreInfoImportantDatesV2() {
  const { t } = useUsAzTranslations();
  const common = useCommonTranslations().t;
  const footerLinks = useInfoPageFooterLinks();
  const params = useTypedParams(State.Resident.UsAzMoreInformation);

  const heading = t(($) => $.importantDates.moreInfo.heading);
  usePageTitle(heading);

  useScrollToHash();

  return (
    <ScreenFillingWrapper
      top={
        <article>
          <BackLink to={State.Resident.buildPath(params)}>
            {common(($) => $.backLinks.home)}
          </BackLink>
          <CopyWrapper>{`# ${heading}`}</CopyWrapper>
          <UsAzImportantDatesFAQ />
        </article>
      }
      bottom={
        <PageLinksFooter
          contents={{
            pageLinksHeading: t(($) => $.moreInfoPageLinksHeading),
            pageLinks: footerLinks,
            topLinkText: t(($) => $.backToTopLinkText),
          }}
        />
      }
    />
  );
}
