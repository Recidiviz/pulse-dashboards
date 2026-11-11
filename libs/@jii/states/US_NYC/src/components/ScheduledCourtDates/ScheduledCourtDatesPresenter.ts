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

import { makeAutoObservable } from "mobx";

import type { UsNycResidentJiiData } from "~@jii/schemas";
import type { DateLabels, SentenceDatesData } from "~@jii/sentence-dates";
import type { UsNycTFunction } from "~@jii/translation";

type Docket = UsNycResidentJiiData["preSentenceDockets"][number];

/**
 * Returns the i18next context that selects which nextCourtDateDescription
 * variant describes this docket, or undefined when the docket has a date but
 * no location or borough, in which case the card shows no description.
 */
// TODO(OBT-56202) Add time once we have this ingested
// TODO(OBT-56217) Replace with court address
function descriptionContext({
  nextCourtDate,
  nextCourtLocation,
  nextCourtBorough,
}: Docket) {
  if (!nextCourtDate) return "noDate";
  if (nextCourtLocation && nextCourtBorough) return "locationAndBorough";
  if (nextCourtLocation) return "location";
  if (nextCourtBorough) return "borough";
  return undefined;
}

/**
 * Returns the SentenceDates id for a docket's court date card: its docket
 * number, or "unknown-docket-" plus its index for a docket without one. Ids
 * must stay unique, since SentenceDates matches each card to its label by id
 * and uses the id as the card's React key.
 */
export function docketDateId(docket: Docket, index: number): string {
  return docket.docketNumber ?? `unknown-docket-${index}`;
}

export class ScheduledCourtDatesPresenter {
  constructor(
    private readonly stateSpecificData: UsNycResidentJiiData,
    private readonly t: UsNycTFunction,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get scheduledCourtDatesData(): SentenceDatesData {
    return {
      dates: this.stateSpecificData.preSentenceDockets.map((docket, i) => ({
        id: docketDateId(docket, i),
        date: docket.nextCourtDate ?? undefined,
      })),
    };
  }

  // The court dates have no entries in the translation resource, so SentenceDates takes each
  // card's id and label from here instead.
  get dateIdOverride(): DateLabels {
    return this.stateSpecificData.preSentenceDockets.map((docket, i) => {
      const context = descriptionContext(docket);
      const boroughCode = docket.nextCourtBorough;
      return {
        id: docketDateId(docket, i),
        label: this.t(($) => $.scheduledCourtDates.nextCourtDateLabel, {
          docketNumber:
            docket.docketNumber ??
            this.t(($) => $.scheduledCourtDates.unknownDocketNumber),
        }),
        description: context
          ? this.t(($) => $.scheduledCourtDates.nextCourtDateDescription, {
              context,
              location: docket.nextCourtLocation,
              borough: boroughCode
                ? this.t(($) => $.scheduledCourtDates.borough[boroughCode])
                : undefined,
            })
          : undefined,
      };
    });
  }

  // Without dockets SentenceDates would render an empty section, so callers
  // should not render it for a resident with no dockets.
  get hasDockets(): boolean {
    return this.stateSpecificData.preSentenceDockets.length > 0;
  }
}
