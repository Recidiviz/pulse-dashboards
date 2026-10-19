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

import { observable } from "mobx";
import { ReactNode, useState } from "react";

import { RootStore, StoreContext } from "~@jii/data";

/**
 * Provides the parts of RootStore that SentenceDates reads, so stories and tests
 * can render it without a real store. Toggling updates the saved setting in memory.
 */
export function FakeStoreProvider({
  children,
  hideSentenceDates = false,
}: {
  children: ReactNode;
  hideSentenceDates?: boolean;
}) {
  const [store] = useState(() => {
    const residentsStore = observable({
      userProperties: { hideSentenceDates },
      setHideSentenceDates(hidden: boolean) {
        residentsStore.userProperties.hideSentenceDates = hidden;
      },
    });
    return {
      residentsStore,
      userStore: {
        segmentClient: { trackSentenceDatesToggled: () => undefined },
      },
    } as unknown as RootStore;
  });

  return (
    <StoreContext.Provider value={{ store }}>{children}</StoreContext.Provider>
  );
}
