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

import { describe, expect, it } from "vitest";

import { polarisChannelId, polarisEngChannelId } from "./config.mts";
import { buildSlackNotification } from "./slack.mts";
import type { PublishedRelease, ReleasePlan } from "./types.mts";

describe("buildSlackNotification", () => {
  it("returns null for demo deploys", () => {
    const plan: ReleasePlan = {
      env: "demo",
      currentRevision: "abc123def456",
      nextVersion: "deploy-candidate",
    };
    expect(
      buildSlackNotification(plan, ["Staff Backend"], null, {
        deployer: "me",
        deployDurationMinutes: 1,
      }),
    ).toBeNull();
  });

  it("builds a staging message on the eng channel", () => {
    const plan: ReleasePlan = {
      env: "staging",
      currentRevision: "abc123def456",
      nextVersion: "deploy-candidate",
      deployingLatestMain: true,
    };
    const note = buildSlackNotification(plan, ["Staff Backend"], null, {
      deployer: "me@x",
      deployDurationMinutes: 3,
    });
    expect(note?.channel).toBe(polarisEngChannelId);
    expect(note?.text).toContain(
      "me@x deployed `abc123def456` to staging in 3 minutes!",
    );
    expect(note?.text).toContain("\nWhat was deployed: Staff Backend");
    expect(note?.text).not.toContain("not the tip of main");
    expect(note?.text).not.toContain("view on GitHub");
  });

  it("flags non-tip deploys and includes a github link when present", () => {
    const plan: ReleasePlan = {
      env: "staging",
      currentRevision: "abc123def456",
      nextVersion: "deploy-candidate",
      deployingLatestMain: false,
    };
    const note = buildSlackNotification(plan, ["Staff Backend"], null, {
      deployer: "me",
      deployDurationMinutes: 2,
      stagingGithubLink:
        "https://github.com/Recidiviz/pulse-dashboards/commit/abc",
    });
    expect(note?.text).toContain("(not the tip of main)");
    expect(note?.text).toContain(
      "(<https://github.com/Recidiviz/pulse-dashboards/commit/abc|view on GitHub>)",
    );
  });

  it("builds a production message on the polaris channel with trimmed release notes", () => {
    const plan: ReleasePlan = {
      env: "production",
      isRedeploy: false,
      currentRevision: "abc123def456",
      isCpDeploy: false,
      nextVersion: "v5.296.0",
      releaseNotes: "placeholder",
      latestReleaseVersion: "v5.295.0",
    };
    const published: PublishedRelease = {
      nextVersion: "v5.296.0",
      releaseUrl: "https://example/release",
      releaseNotes:
        "## header\n- change one\n- change two\n**Full Changelog** footer",
    };
    const note = buildSlackNotification(plan, ["Staff Frontend"], published, {
      deployer: "me",
      deployDurationMinutes: 7,
    });
    expect(note?.channel).toBe(polarisChannelId);
    expect(note?.text).toContain(
      "me deployed v5.296.0 to production in 7 minutes!",
    );
    expect(note?.text).toContain("releases/tag/v5.296.0|view on GitHub");
    // header + footer lines removed, the middle kept inside a code block
    expect(note?.text).toContain("```- change one\n- change two```");
    expect(note?.text).toContain("\nWhat was deployed: Staff Frontend");
  });

  it("builds a re-deploy message pointing at the existing release (no published notes)", () => {
    const plan: ReleasePlan = {
      env: "production",
      isRedeploy: true,
      currentRevision: "abc123def456",
      nextVersion: "v5.300.0",
    };
    const note = buildSlackNotification(plan, ["Meetings Backend"], null, {
      deployer: "me",
      deployDurationMinutes: 3,
    });
    expect(note?.channel).toBe(polarisChannelId);
    expect(note?.text).toContain(
      "me re-deployed the existing v5.300.0 release in 3 minutes",
    );
    expect(note?.text).toContain("releases/tag/v5.300.0|view on GitHub");
    expect(note?.text).toContain("\nWhat was deployed: Meetings Backend");
  });
});
