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

import { Chip, GoLink } from "~@jii/common-ui";
import type { ReentryChecklistItemId } from "~@jii/configs";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { PersonalizationReason } from "../../../../hooks/types";
import { useReentryAnalytics } from "../../../../hooks/useReentryAnalytics";
import { Popover } from "../../Popover/Popover";
import {
  Field,
  FieldLabel,
  Fields,
  FieldValue,
  Reason,
  ReasonList,
} from "./PersonalizedBadge.styles";

type PersonalizedBadgeProps = {
  itemId: ReentryChecklistItemId;
  reasons: PersonalizationReason[];
};

/**
 * The "Based on your profile" badge on a personalized checklist item. Tapping
 * it opens a popover listing the answers that put the item on the list, each
 * with a link to that answer on the questionnaire's Review page.
 */
export const PersonalizedBadge = ({
  itemId,
  reasons,
}: PersonalizedBadgeProps) => {
  const { t } = useUsMaTranslations();
  const routeParams = useTypedParams(State.Resident);
  const trackEvent = useReentryAnalytics();

  const reasonsCopy = t(($) => $.reentry.checklist.personalizationReasons, {
    returnObjects: true,
  });

  const badge = (
    <Chip color="blue">{t(($) => $.reentry.checklist.personalizedBadge)}</Chip>
  );

  if (reasons.length === 0) return badge;

  return (
    <Popover
      trigger={badge}
      heading={reasonsCopy.heading}
      closeLabel={reasonsCopy.close}
      onOpen={() =>
        trackEvent("frontend_reentry_checklist_why_opened", { itemId })
      }
    >
      <ReasonList>
        {reasons.map((reason) => (
          <Reason key={reason.questionId}>
            <Fields>
              <Field>
                <FieldLabel>{reasonsCopy.question}</FieldLabel>
                <FieldValue>{reason.heading}</FieldValue>
              </Field>
              <Field>
                <FieldLabel>{reasonsCopy.yourAnswer}</FieldLabel>
                <FieldValue>{reason.answerText}</FieldValue>
              </Field>
            </Fields>
            <GoLink
              to={State.Resident.UsMaReentry.Questionnaire.buildPath(
                routeParams,
                undefined,
                reason.questionId,
              )}
              onClick={() =>
                trackEvent("frontend_reentry_profile_edit_started", {
                  entryPoint: "checklist_popover",
                })
              }
            >
              {reasonsCopy.changeAnswer}
            </GoLink>
          </Reason>
        ))}
      </ReasonList>
    </Popover>
  );
};
