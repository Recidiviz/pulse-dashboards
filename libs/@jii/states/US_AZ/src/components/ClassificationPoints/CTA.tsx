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

import { CallToActionCard, HomepageSectionHeading } from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsAzTranslations } from "~@jii/translation";
import { palette } from "~design-system";

import illustrationSrc from "./ctaIllustration.svg";

export function ClassificationPointsCTA() {
  const {
    residentFlags: { usAzClassification },
  } = useSingleResidentContext();
  const { t } = useUsAzTranslations();

  if (!usAzClassification) return null;

  const { heading, card } = t(($) => $.classificationPoints.cta, {
    returnObjects: true,
  });

  return (
    <section>
      <HomepageSectionHeading>{heading}</HomepageSectionHeading>
      <CallToActionCard
        illustrationSrc={illustrationSrc}
        {...card}
        linkTo={State.Resident.$.UsAzClassificationPoints.buildRelativePath({})}
        illustrationBackground={palette.pine1}
      />
    </section>
  );
}
