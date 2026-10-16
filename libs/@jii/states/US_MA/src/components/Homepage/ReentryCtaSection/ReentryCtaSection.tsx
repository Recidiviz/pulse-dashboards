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

import { CallToActionCard, HomepageSectionHeading } from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import backgroundSrc from "./reentryCtaBackground.png";
import illustrationSrc from "./reentryCtaIllustration.svg";

export const ReentryCtaSection = () => {
  const { t } = useUsMaTranslations();
  const { residentFlags } = useSingleResidentContext();
  const routeParams = useTypedParams(State.Resident);

  if (!residentFlags.usMaReentry) return null;

  return (
    <section>
      <HomepageSectionHeading>
        {t(($) => $.reentry.homepageCta.sectionHeader)}
      </HomepageSectionHeading>
      <CallToActionCard
        linkTo={State.Resident.UsMaReentry.buildPath(routeParams)}
        heading={t(($) => $.reentry.homepageCta.heading)}
        description={t(($) => $.reentry.homepageCta.description)}
        linkText={t(($) => $.reentry.homepageCta.link)}
        illustrationSrc={illustrationSrc}
        illustrationBackground={`url(${backgroundSrc}) center / cover no-repeat`}
      />
    </section>
  );
};
