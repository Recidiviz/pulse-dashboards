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

import { useResidentMetadata } from "~@jii/data";
import {
  defaultComponents,
  SentenceDatesComponents,
} from "~@jii/sentence-dates";
import { useUsCoTranslations } from "~@jii/translation";

/**
 * For life-sentence residents, the Parole Eligibility Date (PED) card should
 * show a sentence-status message instead of a date. Returns that message for
 * the current resident's cohort, or `undefined` when the date should display
 * normally.
 */
function useLifeSentenceMessage(dateId: string): string | undefined {
  const { t } = useUsCoTranslations();
  const { cohortLabel } = useResidentMetadata("US_CO");

  if (dateId !== "pedTent") return undefined;

  switch (cohortLabel) {
    case "LIFE_WITHOUT_PAROLE":
      return t(($) => $.homepage.sentenceDates.lifeSentence.withoutParole);
    case "LIFE_WITH_PAROLE":
    case "INDETERMINATE_LIFE_WITH_PAROLE":
      return t(($) => $.homepage.sentenceDates.lifeSentence.withParole);
    default:
      return undefined;
  }
}

/**
 * Replaces the PED card's primary value with a life-sentence message when the
 * resident is serving a life sentence; otherwise renders the default value.
 */
export const SentenceDatesPedValueOverride: SentenceDatesComponents["DateValue"] =
  (props) => {
    const lifeSentenceMessage = useLifeSentenceMessage(props.datePresenter.id);

    return (
      <defaultComponents.DateValue
        {...props}
        children={lifeSentenceMessage ?? props.children}
      />
    );
  };

/**
 * Suppresses the PED card's relative-time supplemental line when the
 * life-sentence message is being shown; otherwise renders the default.
 */
export const SentenceDatesPedSupplementalOverride: SentenceDatesComponents["DateValueSupplemental"] =
  (props) => {
    if (useLifeSentenceMessage(props.datePresenter.id)) {
      return null;
    }

    return <defaultComponents.DateValueSupplemental {...props} />;
  };
