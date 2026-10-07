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

import { usePageTitle } from "~@jii/common-ui";
import { useUsMaTranslations } from "~@jii/translation";

import { SuspenseQueryBoundary } from "../SuspenseQueryBoundary";
import { ChecklistContent } from "./ChecklistContent/ChecklistContent";
import { Heading, Intro, PageHeader, Wrapper } from "./ReentryChecklist.styles";

export const ReentryChecklist = () => {
  const { t } = useUsMaTranslations();

  usePageTitle(t(($) => $.reentry.checklist.pageTitle));

  return (
    <Wrapper>
      <PageHeader>
        <Heading>{t(($) => $.reentry.checklist.heading)}</Heading>
        <Intro>{t(($) => $.reentry.checklist.intro)}</Intro>
      </PageHeader>
      <SuspenseQueryBoundary>
        <ChecklistContent />
      </SuspenseQueryBoundary>
    </Wrapper>
  );
};
