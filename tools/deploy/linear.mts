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

import {
  linearProductionDeployLabelId,
  linearRequiresManualProductionTestingLabelId,
  linearStagingDeployLabelId,
  linearTicketReferencePattern,
} from "./config.mts";

/**
 * Pulls every Linear ticket identifier (e.g. "OBT-12345") referenced via the
 * `Closes`/`Fixes`/`Resolves` convention baked into the PR template, across a set of
 * commit bodies. Pure so it can be unit-tested independently of git/Octokit.
 */
export function extractLinearTicketIds(commitMessages: string[]): string[] {
  const ticketIds = new Set<string>();
  for (const message of commitMessages) {
    for (const match of message.matchAll(linearTicketReferencePattern)) {
      ticketIds.add(match[1].toUpperCase());
    }
  }
  return [...ticketIds];
}

/**
 * Sets a ticket's "Deploy Status" label to reflect the given environment, removing
 * the other environment's label if present (the two are mutually exclusive).
 *
 * "Production Deploy" is sticky against downgrades to staging: a hotfix can reach
 * production via a cherry-pick before its change is backmerged into main, and that
 * backmerge later re-surfaces the same ticket in a staging deploy's commit range.
 * Without this guard, that staging deploy would incorrectly flip the ticket back
 * from Production to Staging even though the change already shipped to prod.
 */
export async function setDeployStatusLabel(
  linear: LinearClient,
  ticketId: string,
  env: "staging" | "production",
): Promise<void> {
  const issue = await linear.issue(ticketId);
  const currentLabelIds = (await issue.labels()).nodes.map((label) => label.id);

  if (
    env === "staging" &&
    currentLabelIds.includes(linearProductionDeployLabelId)
  ) {
    return;
  }

  const targetLabelId =
    env === "staging"
      ? linearStagingDeployLabelId
      : linearProductionDeployLabelId;
  const otherLabelId =
    env === "staging"
      ? linearProductionDeployLabelId
      : linearStagingDeployLabelId;

  const nextLabelIds = currentLabelIds.filter((id) => id !== otherLabelId);
  if (!nextLabelIds.includes(targetLabelId)) {
    nextLabelIds.push(targetLabelId);
  }

  await linear.updateIssue(issue.id, { labelIds: nextLabelIds });
}

/**
 * Comments on every ticket in this deploy that's flagged "Requires Manual Testing
 * on Production", @-mentioning the ticket's Linear assignee. Stays entirely inside
 * Linear rather than going through Slack: resolving a Linear assignee's email to a
 * Slack user requires the `users:read.email` scope, which this workspace's Slack
 * plan doesn't support — and Linear already has the assignee info needed to tag
 * them directly, so there's no Linear->Slack mapping to bypass in the first place.
 */
export async function commentOnManualTestingTickets(
  linear: LinearClient,
  ticketIds: string[],
): Promise<void> {
  // Independent per ticket, so these run concurrently rather than one at a time.
  await Promise.all(
    ticketIds.map(async (ticketId) => {
      const issue = await linear.issue(ticketId);
      const labelIds = (await issue.labels()).nodes.map((label) => label.id);
      if (!labelIds.includes(linearRequiresManualProductionTestingLabelId)) {
        return;
      }

      const assignee = await issue.assignee;
      if (!assignee) {
        console.log(
          `[${ticketId}] flagged for manual testing but has no assignee; skipping comment.`,
        );
        return;
      }

      await linear.createComment({
        issueId: issue.id,
        body: `@${assignee.displayName} this just shipped to production and is flagged as requiring manual testing there — could you verify it?`,
      });
    }),
  );
}
