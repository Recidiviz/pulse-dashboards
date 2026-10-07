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

import type { WebClient as SlackClient } from "@slack/web-api";
import { $ } from "zx";

import {
  owner,
  polarisChannelId,
  polarisEngChannelId,
  repo,
} from "./config.mts";
import type { PublishedRelease, ReleasePlan } from "./types.mts";

/** I/O-derived values the (pure) message builder needs. */
export interface SlackMessageInputs {
  deployer: string;
  deployDurationMinutes: number;
  // A stable GitHub commit link, set only when the staging commit exists on origin/main.
  stagingGithubLink?: string;
}

export interface SlackNotification {
  channel: string;
  text: string;
  // Posted as a reply in the thread under text, so the channel shows only the summary line.
  threadReply?: string;
}

/**
 * Assemble the Slack notification for a staging or production deploy. Pure: all I/O-derived
 * values arrive via {@link SlackMessageInputs}. Returns `null` when there's nothing to post
 * (e.g. demo deploys, or nothing deployed successfully).
 */
export function buildSlackNotification(
  plan: ReleasePlan,
  successfullyDeployedServices: string[],
  published: PublishedRelease | null,
  inputs: SlackMessageInputs,
): SlackNotification | null {
  const { deployer, deployDurationMinutes, stagingGithubLink } = inputs;

  let channel: string | null = null;
  let message: string | null = null;
  let threadReply: string | undefined;

  if (plan.env === "staging") {
    channel = polarisEngChannelId;

    let revisionText = "`" + plan.currentRevision + "`";
    if (!plan.deployingLatestMain) revisionText += " (not the tip of main)";

    message = `${deployer} deployed ${revisionText} to staging in ${deployDurationMinutes} minutes!`;

    if (stagingGithubLink) {
      message += ` (<${stagingGithubLink}|view on GitHub>)`;
    }
  } else if (plan.env === "production" && plan.isRedeploy) {
    const githubLink = `https://github.com/${owner}/${repo}/releases/tag/${plan.nextVersion}`;
    message = `${deployer} re-deployed the existing ${plan.nextVersion} release in ${deployDurationMinutes} minutes (<${githubLink}|view on GitHub>)!`;

    channel = polarisChannelId;
  } else if (plan.env === "production" && published) {
    message = `${deployer} deployed ${published.nextVersion} to production in ${deployDurationMinutes} minutes!`;

    const releaseNotesMessage = published.releaseNotes
      .split("\n")
      .slice(1, -1)
      .join("\n")
      .trim(); // remove header and footer lines

    const githubLink = `https://github.com/${owner}/${repo}/releases/tag/${published.nextVersion}`;
    message += ` (<${githubLink}|view on GitHub>)`;
    if (releaseNotesMessage) {
      threadReply = `\`\`\`${releaseNotesMessage}\`\`\``;
    }

    channel = polarisChannelId;
  }

  if (channel === null || message === null) return null;

  message += `\nWhat was deployed: ${successfullyDeployedServices.join(", ")}`;
  return { channel, text: message, threadReply };
}

/**
 * Post the deploy notification to Slack through the Deployment Bot account. Gathers the
 * deployer account and (for staging) the GitHub link, builds the message, and posts it.
 * The captured-output commands run `.quiet()` so they don't pollute the deploy log.
 */
export async function postDeployNotification(
  slack: SlackClient,
  plan: ReleasePlan,
  successfullyDeployedServices: string[],
  published: PublishedRelease | null,
  durationSeconds: number,
): Promise<void> {
  console.log("Posting the deploy notification to Slack...");

  const deployer = (
    await $`gcloud config get-value account`.quiet()
  ).stdout.trim();
  const deployDurationMinutes = Math.floor(durationSeconds / 60);

  let stagingGithubLink: string | undefined;
  if (plan.env === "staging") {
    // Add a github link when a stable one exists, i.e. when the commit just deployed
    // exists on origin/main, even if it is not the tip
    const mostRecentAncestor = (
      await $`git fetch origin main --negotiate-only --negotiation-tip=${plan.currentRevision}`.quiet()
    ).stdout.trim();
    const shortenedAncestor = (
      await $`git rev-parse --short=12 ${mostRecentAncestor}`.quiet()
    ).stdout.trim();
    if (shortenedAncestor === plan.currentRevision) {
      stagingGithubLink = `https://github.com/${owner}/${repo}/commit/${mostRecentAncestor}`;
    }
  }

  const note = buildSlackNotification(
    plan,
    successfullyDeployedServices,
    published,
    {
      deployer,
      deployDurationMinutes,
      stagingGithubLink,
    },
  );
  if (!note) return;

  let parentTs: string | undefined;
  try {
    const slackMessageResponse = await slack.chat.postMessage({
      channel: note.channel,
      text: note.text,
      // Don't show previews for Github links
      unfurl_links: false,
      unfurl_media: false,
    });
    if (slackMessageResponse.ok) {
      console.log(`Successfully posted to Slack channel ${note.channel}`);
      parentTs = slackMessageResponse.ts;
    } else {
      throw slackMessageResponse;
    }
  } catch (error) {
    console.log(
      "There was a problem posting to Slack, please post the message manually:",
    );
    console.log(note.text);
    if (note.threadReply) {
      console.log("Then reply in its thread with:");
      console.log(note.threadReply);
    }
    console.error(error);
    return;
  }

  if (!note.threadReply) return;

  try {
    const threadReplyResponse = await slack.chat.postMessage({
      channel: note.channel,
      thread_ts: parentTs,
      text: note.threadReply,
      unfurl_links: false,
      unfurl_media: false,
    });
    if (!threadReplyResponse.ok) throw threadReplyResponse;
  } catch (error) {
    console.log(
      "There was a problem posting the thread reply to Slack, please post it manually:",
    );
    console.log(note.threadReply);
    console.error(error);
  }
}
