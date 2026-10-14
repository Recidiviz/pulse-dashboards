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

import { GoLink } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";
import { Icon } from "~design-system";

import { Callout } from "../../Callout/Callout";

type PersonalizationBannerProps = {
  isProfileCompleted: boolean;
  personalizedItemCount: number;
};

/**
 * Tells the resident whether their checklist is personalized, which happens
 * once they complete their Reentry profile. Until then, links them to the
 * questionnaire to complete it.
 */
export const PersonalizationBanner = ({
  isProfileCompleted,
  personalizedItemCount,
}: PersonalizationBannerProps) => {
  const { t } = useUsMaTranslations();
  const routeParams = useTypedParams(State.Resident);

  if (isProfileCompleted) {
    return (
      <Callout
        tone="info"
        heading={t(($) => $.reentry.checklist.personalized.heading)}
        description={
          personalizedItemCount > 0
            ? t(($) => $.reentry.checklist.personalized.recommendedTaskCount, {
                count: personalizedItemCount,
              })
            : undefined
        }
      />
    );
  }

  return (
    <Callout
      tone="neutral"
      icon={<Icon kind="Info" size={24} />}
      heading={t(($) => $.reentry.checklist.notPersonalized.heading)}
      description={t(($) => $.reentry.checklist.notPersonalized.description)}
      action={
        <GoLink
          to={State.Resident.UsMaReentry.Questionnaire.buildPath(routeParams)}
        >
          {t(($) => $.reentry.checklist.notPersonalized.cta)}
        </GoLink>
      }
    />
  );
};
