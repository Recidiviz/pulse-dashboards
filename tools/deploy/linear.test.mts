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

import type { LinearClient } from "@linear/sdk";
import { describe, expect, it, vi } from "vitest";

import {
  linearProductionDeployLabelId,
  linearRequiresManualProductionTestingLabelId,
  linearStagingDeployLabelId,
} from "./config.mts";
import {
  commentOnManualTestingTickets,
  extractLinearTicketIds,
  setDeployStatusLabel,
} from "./linear.mts";

/** Fake LinearClient exposing just the surface `setDeployStatusLabel` calls. */
function fakeLinearClient(currentLabelIds: string[]): LinearClient {
  const updateIssue = vi.fn().mockResolvedValue(undefined);
  return {
    issue: vi.fn().mockResolvedValue({
      id: "issue-uuid",
      labels: vi.fn().mockResolvedValue({
        nodes: currentLabelIds.map((id) => ({ id })),
      }),
    }),
    updateIssue,
  } as unknown as LinearClient;
}

/** Fake LinearClient exposing just the surface `commentOnManualTestingTickets` calls. */
function fakeLinearClientForComments(options: {
  flagged: boolean;
  assignee: { displayName: string } | null;
}): LinearClient {
  const createComment = vi.fn().mockResolvedValue(undefined);
  return {
    issue: vi.fn().mockResolvedValue({
      id: "issue-uuid",
      url: "https://linear.app/recidiviz/issue/OBT-1",
      labels: vi.fn().mockResolvedValue({
        nodes: options.flagged
          ? [{ id: linearRequiresManualProductionTestingLabelId }]
          : [],
      }),
      assignee: options.assignee ?? undefined,
    }),
    createComment,
  } as unknown as LinearClient;
}

describe("extractLinearTicketIds", () => {
  it("extracts a ticket ID after Closes", () => {
    expect(
      extractLinearTicketIds([
        "[US_NY] Add download route\n\nCloses OBT-37527",
      ]),
    ).toEqual(["OBT-37527"]);
  });

  it("extracts ticket IDs after Fixes and Resolves, case-insensitively", () => {
    expect(
      extractLinearTicketIds(["fixes obt-1\nsome other line\nResolves OBT-2"]),
    ).toEqual(["OBT-1", "OBT-2"]);
  });

  it("matches the '#' and ':' variants the PR template allows", () => {
    expect(
      extractLinearTicketIds(["Closes #OBT-42", "Closes: OBT-43"]),
    ).toEqual(["OBT-42", "OBT-43"]);
  });

  it("does not match the unfilled 'Closes #XXXX' placeholder", () => {
    expect(extractLinearTicketIds(["Closes #XXXX"])).toEqual([]);
  });

  it("dedupes a ticket referenced by multiple commits", () => {
    expect(
      extractLinearTicketIds(["Closes OBT-1", "some fixup\nCloses OBT-1"]),
    ).toEqual(["OBT-1"]);
  });

  it("returns an empty list when nothing references a ticket", () => {
    expect(
      extractLinearTicketIds(["Bump some-package from 1.0 to 1.1"]),
    ).toEqual([]);
  });
});

describe("setDeployStatusLabel", () => {
  it("adds the Staging Deploy label to an unlabeled ticket", async () => {
    const linear = fakeLinearClient([]);

    await setDeployStatusLabel(linear, "OBT-1", "staging");

    expect(linear.updateIssue).toHaveBeenCalledWith("issue-uuid", {
      labelIds: [linearStagingDeployLabelId],
    });
  });

  it("swaps Staging Deploy for Production Deploy on a normal production release", async () => {
    const linear = fakeLinearClient([
      linearStagingDeployLabelId,
      "other-label",
    ]);

    await setDeployStatusLabel(linear, "OBT-1", "production");

    expect(linear.updateIssue).toHaveBeenCalledWith("issue-uuid", {
      labelIds: ["other-label", linearProductionDeployLabelId],
    });
  });

  it("does not downgrade a ticket already marked Production Deploy back to staging", async () => {
    // Regression case: a hotfix ships to production via cherry-pick, then gets
    // backmerged into main. The backmerge re-surfaces the ticket in a later
    // staging deploy's commit range, but it must not flip back to Staging Deploy.
    const linear = fakeLinearClient([linearProductionDeployLabelId]);

    await setDeployStatusLabel(linear, "OBT-1", "staging");

    expect(linear.updateIssue).not.toHaveBeenCalled();
  });
});

describe("commentOnManualTestingTickets", () => {
  it("comments and @-mentions the assignee on a flagged ticket", async () => {
    const linear = fakeLinearClientForComments({
      flagged: true,
      assignee: { displayName: "jdoe" },
    });

    await commentOnManualTestingTickets(linear, ["OBT-1"]);

    expect(linear.createComment).toHaveBeenCalledWith({
      issueId: "issue-uuid",
      body: expect.stringContaining("@jdoe"),
    });
  });

  it("does not comment on a ticket that isn't flagged", async () => {
    const linear = fakeLinearClientForComments({
      flagged: false,
      assignee: { displayName: "jdoe" },
    });

    await commentOnManualTestingTickets(linear, ["OBT-1"]);

    expect(linear.createComment).not.toHaveBeenCalled();
  });

  it("skips a flagged ticket with no assignee rather than commenting with no mention", async () => {
    const linear = fakeLinearClientForComments({
      flagged: true,
      assignee: null,
    });

    await commentOnManualTestingTickets(linear, ["OBT-1"]);

    expect(linear.createComment).not.toHaveBeenCalled();
  });
});
