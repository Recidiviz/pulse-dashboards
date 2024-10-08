// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  WORKFLOWS_PATHS,
  WorkflowsPage,
  WorkflowsPageIdList,
  workflowsUrl,
} from "../views";

test("URL with no params", () => {
  WorkflowsPageIdList.forEach((pageId) => {
    expect(workflowsUrl(pageId)).toBe(WORKFLOWS_PATHS[pageId]);
  });
});

test("URL with opportunityType", () => {
  const OPPORTUNITY_PAGES = [
    "opportunityClients",
    "opportunityAction",
  ] as WorkflowsPage[];
  OPPORTUNITY_PAGES.forEach((pageId) => {
    expect(workflowsUrl(pageId, { urlSection: "compliantReporting" })).toBe(
      WORKFLOWS_PATHS[pageId].replace(
        ":opportunityTypeUrl",
        "compliantReporting",
      ),
    );
  });
});

test("URL with opportunityType with custom URL", () => {
  const OPPORTUNITY_PAGES = [
    "opportunityClients",
    "opportunityAction",
  ] as WorkflowsPage[];
  OPPORTUNITY_PAGES.forEach((pageId) => {
    expect(workflowsUrl(pageId, { urlSection: "expiration" })).toBe(
      WORKFLOWS_PATHS[pageId].replace(":opportunityTypeUrl", "expiration"),
    );
  });
});

test("URL with person ID", () => {
  const CLIENT_PAGES = [
    "opportunityAction",
    "clientProfile",
  ] as WorkflowsPage[];
  CLIENT_PAGES.forEach((pageId) => {
    expect(workflowsUrl(pageId, { justiceInvolvedPersonId: "test123" })).toBe(
      WORKFLOWS_PATHS[pageId].replace(":justiceInvolvedPersonId", "test123"),
    );
  });
});
