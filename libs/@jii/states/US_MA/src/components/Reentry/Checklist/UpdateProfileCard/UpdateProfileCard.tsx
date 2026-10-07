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

import { ButtonLink } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { Callout } from "../Callout/Callout";

/**
 * Prompts a resident with a personalized checklist to update their Reentry
 * profile if their plans have changed.
 */
export const UpdateProfileCard = () => {
  const { t } = useUsMaTranslations();
  const routeParams = useTypedParams(State.Resident);

  return (
    <Callout
      tone="neutral"
      variant="card"
      heading={t(($) => $.reentry.checklist.updateProfile.heading)}
      description={t(($) => $.reentry.checklist.updateProfile.description)}
      action={
        <ButtonLink
          kind="secondary"
          to={State.Resident.UsMaReentry.Questionnaire.buildPath(routeParams)}
        >
          {t(($) => $.reentry.checklist.updateProfile.cta)}
        </ButtonLink>
      }
    />
  );
};
