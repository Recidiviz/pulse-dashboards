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

import {
  useTypedParams,
  useTypedSearchParams,
} from "react-router-typesafe-routes/dom";

import { ImportantDatesCopyWrapper } from "~@jii/common-ui";
import { useResidentMetadata, useSingleResidentContext } from "~@jii/data";
import { DefinitionPage } from "~@jii/layout";
import { State } from "~@jii/paths";
import { useUsArTranslations } from "~@jii/translation";

import { isPaaResident } from "../isPaaResident";

export function PageMoreInformationImportantDates() {
  const { t } = useUsArTranslations();
  const metadata = useResidentMetadata("US_AR");
  const { residentFlags } = useSingleResidentContext();
  const params = useTypedParams(State.Resident.UsArMoreInformation);
  const [{ backTarget }] = useTypedSearchParams(
    State.Resident.UsArMoreInformation.ImportantDates,
  );

  const backLinkProps =
    backTarget === "programs"
      ? {
          to: State.Resident.ProgramCatalog.buildPath(params),
          children: t(($) => $.moreInformation.backLink.programs),
        }
      : {
          to: State.Resident.buildPath(params),
        };

  const { heading, body } = isPaaResident(metadata)
    ? {
        heading: t(($) => $.protectAct.moreInfo.heading),
        // TODO(JII2-128): use edovoBody as the body once usArEdovoCredits is retired
        body: residentFlags.usArEdovoCredits
          ? t(($) => $.protectAct.moreInfo.edovoBody)
          : t(($) => $.protectAct.moreInfo.body),
      }
    : t(($) => $.importantDates.moreInfo, { returnObjects: true });

  return (
    <DefinitionPage
      backLinkProps={backLinkProps}
      heading={heading}
      body={body}
      CopyWrapperOverride={ImportantDatesCopyWrapper}
    />
  );
}
