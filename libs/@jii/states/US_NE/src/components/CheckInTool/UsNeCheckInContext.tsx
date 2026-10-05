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

import { createContext, ReactNode, useState } from "react";

import { CheckInSectionId } from "~@jii/configs";
import { useRequiredContext } from "~utils";

import { SectionIntroScreen, WelcomeScreen } from "./types";

export type SeenPage =
  | { screenKind: "welcome" }
  | { screenKind: "sectionIntro"; sectionId: CheckInSectionId };

// Provides FE state relevant to the check-in form pages
export type UsNeCheckInContextValue = {
  markSeen: (screen: WelcomeScreen | SectionIntroScreen) => void;
  hasSeenScreen: (screen: WelcomeScreen | SectionIntroScreen) => boolean;
};

const UsNeCheckInContext = createContext<UsNeCheckInContextValue | undefined>(
  undefined,
);

export function UsNeCheckInContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [seenPages, setSeenPages] = useState<SeenPage[]>([]);

  // Helper functions for dealing with the list of seen pages.
  const hasSeenScreen = (screen: WelcomeScreen | SectionIntroScreen) => {
    if (screen.screenKind === "welcome") {
      return seenPages.some((seenPage) => seenPage.screenKind === "welcome");
    }

    return seenPages.some(
      (seenPage) =>
        seenPage.screenKind === "sectionIntro" &&
        seenPage.sectionId === screen.sectionId,
    );
  };

  const markSeen = (screen: WelcomeScreen | SectionIntroScreen) => {
    setSeenPages([...seenPages, screen]);
  };

  return (
    <UsNeCheckInContext.Provider value={{ hasSeenScreen, markSeen }}>
      {children}
    </UsNeCheckInContext.Provider>
  );
}

export function useUsNeCheckInContext(): UsNeCheckInContextValue {
  return useRequiredContext(
    UsNeCheckInContext,
    "useUsNeCheckInContext must be used within a UsNeCheckInContextProvider",
  );
}
