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

import {
  DEFAULT_PATHWAYS_SECTION_BY_PAGE,
  PATHWAYS_PAGES,
  PATHWAYS_SECTIONS,
  PathwaysSection,
} from "~shared-pathways";

import { EVENT_TYPES } from "../eventTypes";
import { RootStore } from "../RootStore";

vi.mock("@sentry/react");

// AUTH_ENABLED is evaluated from the build mode at module load, so each case
// stubs import.meta.env.MODE and re-imports the module to re-evaluate it.
async function loadAuthEnabled(mode: string): Promise<boolean> {
  vi.stubEnv("MODE", mode);
  vi.resetModules();
  const { AUTH_ENABLED } = await import("../RootStore");
  return AUTH_ENABLED;
}

describe("AUTH_ENABLED", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("disables auth in production, where the dashboard is public", async () => {
    expect(await loadAuthEnabled("production")).toBe(false);
  });

  it("keeps auth on in staging", async () => {
    expect(await loadAuthEnabled("staging")).toBe(true);
  });

  it("keeps auth on in local development", async () => {
    expect(await loadAuthEnabled("development")).toBe(true);
  });
});

describe("setEventType", () => {
  function newRootStore() {
    return new RootStore();
  }

  it("stores the chosen event type", () => {
    const rootStore = newRootStore();

    rootStore.setEventType(EVENT_TYPES.RELEASES);

    expect(rootStore.eventType).toBe(EVENT_TYPES.RELEASES);
  });

  it("leaves a section alone when the new event type still covers it", () => {
    const rootStore = newRootStore();
    rootStore.setSection(
      PATHWAYS_SECTIONS["countByReleaseType"] as PathwaysSection,
    );

    rootStore.setEventType(EVENT_TYPES.RELEASES);

    expect(rootStore.section).toBe(PATHWAYS_SECTIONS["countByReleaseType"]);
  });

  it("falls back to the default section when the new event type drops it", () => {
    const rootStore = newRootStore();
    rootStore.setPage(PATHWAYS_PAGES.admissionsAndReleases);
    rootStore.setSection(
      PATHWAYS_SECTIONS["countByReleaseType"] as PathwaysSection,
    );

    rootStore.setEventType(EVENT_TYPES.ADMISSIONS);

    expect(rootStore.section).toBe(
      DEFAULT_PATHWAYS_SECTION_BY_PAGE[PATHWAYS_PAGES.admissionsAndReleases],
    );
  });
});
