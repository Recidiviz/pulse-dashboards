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

import { useTranslation } from "react-i18next";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { CallToActionCard, HomepageSectionHeading } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { palette } from "~design-system";

import { StateCodeWithProgramCatalog } from "../../types";
import illustrationSrc from "./illustration.svg";

export function ProgramsCtaCard({
  stateCode,
}: {
  stateCode: StateCodeWithProgramCatalog;
}) {
  const { t } = useTranslation([stateCode, "common"]);
  const pathParams = useTypedParams(State.Resident);

  const linkTo = State.Resident.ProgramCatalog.buildPath(pathParams);

  return (
    <CallToActionCard
      linkTo={linkTo}
      linkText={t(($) => $.programs.homepageCta.link)}
      heading={t(($) => $.programs.homepageCta.heading)}
      description={t(($) => $.programs.homepageCta.description)}
      illustrationSrc={illustrationSrc}
      illustrationBackground={palette.pine1}
      illustrationPlacement="bottom"
    />
  );
}

export function ProgramsCtaSection({
  stateCode,
}: {
  stateCode: StateCodeWithProgramCatalog;
}) {
  const { t } = useTranslation([stateCode, "common"]);

  return (
    <section>
      <HomepageSectionHeading>
        {t(($) => $.programs.homepageCta.sectionHeader)}
      </HomepageSectionHeading>
      <ProgramsCtaCard stateCode={stateCode} />
    </section>
  );
}
