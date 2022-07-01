// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { addDays, differenceInDays, parseISO } from "date-fns";
import { Timestamp, Unsubscribe } from "firebase/firestore";
import { fromResource, IResource } from "mobx-utils";

type Subscriber<Result> = (
  handleRecords: (results: Result) => void
) => Unsubscribe | undefined;

export type SubscriptionValue<Result> = IResource<Result | undefined>;

export function observableSubscription<ObservableType>(
  subscriber: Subscriber<ObservableType>
): SubscriptionValue<ObservableType> {
  let unsubscribe: Unsubscribe | undefined;

  return fromResource<ObservableType>(
    (setCurrent) => {
      unsubscribe = subscriber(setCurrent);
    },
    () => {
      if (unsubscribe) unsubscribe();
    }
  );
}

export function dateToTimestamp(isodate: string): Timestamp {
  return new Timestamp(new Date(isodate).getTime() / 1000, 0);
}

// dates in demo fixtures will be shifted relative to this date
const DEMO_TIMESTAMP = parseISO("2021-12-16");

/**
 * Shifts a given date forward by the difference between the current date
 * and the static "demo date" used for fixture data, bringing the dates
 * in demo fixtures up to date relative to today.
 */
export function shiftDemoDate(storedDate: Date): Date {
  const offsetDays = differenceInDays(new Date(), DEMO_TIMESTAMP);
  return addDays(storedDate, offsetDays);
}
