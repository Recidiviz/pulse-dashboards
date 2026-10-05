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

import assertNever from "assert-never";

import { useCheckInData } from "./hooks/useCheckInData";
import { useCheckInFlow } from "./hooks/useCheckInFlow";
import { UsNeCheckInCompletion } from "./UsNeCheckInCompletion";
import { UsNeCheckInContextProvider } from "./UsNeCheckInContext";
import { UsNeCheckInQuestion } from "./UsNeCheckInQuestion";
import { UsNeCheckInSectionIntro } from "./UsNeCheckInSectionIntro";
import { UsNeCheckInWelcome } from "./UsNeCheckInWelcome";

export const UsNeCheckInPage = () => {
  return (
    <UsNeCheckInContextProvider>
      {/* TODO(OBT-47843) add header and full-page layout override */}
      <UsNeCheckInPageContent />
    </UsNeCheckInContextProvider>
  );
};

const UsNeCheckInPageContent = () => {
  const { data, updateMutation } = useCheckInData();
  const screen = useCheckInFlow(data);

  switch (screen.screenKind) {
    case "completion":
      return <UsNeCheckInCompletion />;
    case "welcome":
      return <UsNeCheckInWelcome />;
    case "sectionIntro":
      return <UsNeCheckInSectionIntro sectionId={screen.sectionId} />;
    case "question":
      return (
        <UsNeCheckInQuestion
          questionId={screen.questionId}
          sectionId={screen.sectionId}
          data={data}
          updateMutation={updateMutation}
        />
      );
    default:
      return assertNever(screen);
  }
};
