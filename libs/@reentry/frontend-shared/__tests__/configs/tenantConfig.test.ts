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

import {
  DEFAULT_INTAKE_CONFIG,
  getInitialStep,
  getIntakeTenantConfig,
} from "../../src/configs/tenantConfig";
import { isPreIntakeStep } from "../../src/configs/types";

describe("getIntakeTenantConfig", () => {
  it("returns default config for null", () => {
    expect(getIntakeTenantConfig(null)).toEqual(DEFAULT_INTAKE_CONFIG);
  });

  it("returns default config for undefined", () => {
    expect(getIntakeTenantConfig(undefined)).toEqual(DEFAULT_INTAKE_CONFIG);
  });

  it("returns default config for empty string", () => {
    expect(getIntakeTenantConfig("")).toEqual(DEFAULT_INTAKE_CONFIG);
  });

  it("returns default config for unknown state", () => {
    expect(getIntakeTenantConfig("US_XX")).toEqual(DEFAULT_INTAKE_CONFIG);
  });

  it("default config uses text flow with no video property", () => {
    expect(DEFAULT_INTAKE_CONFIG.preIntakeFlow).toBe("text");
    expect("video" in DEFAULT_INTAKE_CONFIG).toBe(false);
  });

  it("default config has noteOneCopy with title and paragraphs", () => {
    expect(DEFAULT_INTAKE_CONFIG.noteOneCopy.title).toBe(
      "Your Community Intake",
    );
    expect(DEFAULT_INTAKE_CONFIG.noteOneCopy.paragraphs).toHaveLength(2);
  });

  it("default config has noteTwoCopy with faqItems and importantItems", () => {
    expect(DEFAULT_INTAKE_CONFIG.noteTwoCopy.title).toBe("Before You Start");
    expect(DEFAULT_INTAKE_CONFIG.noteTwoCopy.faqItems).toHaveLength(3);
    expect(DEFAULT_INTAKE_CONFIG.noteTwoCopy.importantItems).toHaveLength(4);
  });

  describe("US_UT overrides", () => {
    it("returns video flow", () => {
      const config = getIntakeTenantConfig("US_UT");
      expect(config.preIntakeFlow).toBe("video");
    });

    it("returns custom DOC ID label", () => {
      const config = getIntakeTenantConfig("US_UT");
      expect(config.docId.label).toBe("DOC ID / Offender Number");
      expect(config.docId.placeholder).toBe("Enter DOC ID / Offender Number");
    });

    it("uses default video src when no video override provided", () => {
      const config = getIntakeTenantConfig("US_UT");
      if (config.preIntakeFlow !== "video") {
        throw new Error("Expected video config for US_UT");
      }
      expect(config.video).toEqual({
        src: "/videos/us-ut-intake-video.mp4",
        subtitlesSrc: "/videos/us-ut-intake-subtitles.vtt",
      });
    });

    it("keeps default preIntakeCopy (no override)", () => {
      const config = getIntakeTenantConfig("US_UT");
      expect(config.preIntakeCopy).toBe(DEFAULT_INTAKE_CONFIG.preIntakeCopy);
    });

    it("keeps default noteOneCopy and noteTwoCopy (no override)", () => {
      const config = getIntakeTenantConfig("US_UT");
      expect(config.noteOneCopy).toEqual(DEFAULT_INTAKE_CONFIG.noteOneCopy);
      expect(config.noteTwoCopy).toEqual(DEFAULT_INTAKE_CONFIG.noteTwoCopy);
    });
  });

  describe("US_NE overrides", () => {
    it("returns text+video flow", () => {
      const config = getIntakeTenantConfig("US_NE");
      expect(config.preIntakeFlow).toBe("text+video");
    });

    it("returns custom video src", () => {
      const config = getIntakeTenantConfig("US_NE");
      if (config.preIntakeFlow !== "text+video") {
        throw new Error("Expected text+video config for US_NE");
      }
      expect(config.video.src).toBe("/videos/us-ne-intake-video.mp4");
      expect(config.video.subtitlesSrc).toBe(
        "/videos/us-ne-intake-subtitles.vtt",
      );
    });

    it("returns custom preIntakeCopy", () => {
      const config = getIntakeTenantConfig("US_NE");
      expect(config.preIntakeCopy).toContain("institutional parole officer");
    });

    it("keeps default DOC ID label (no override)", () => {
      const config = getIntakeTenantConfig("US_NE");
      expect(config.docId).toEqual(DEFAULT_INTAKE_CONFIG.docId);
    });

    it("returns custom noteOneCopy with NE-specific title and paragraphs", () => {
      const config = getIntakeTenantConfig("US_NE");
      expect(config.noteOneCopy.title).toBe("Your 120-Day Reentry Prep");
      expect(config.noteOneCopy.paragraphs[0]).toContain("reentry specialist");
      expect(config.noteOneCopy.paragraphs[1]).toContain("reentry specialist");
    });

    it("returns custom noteTwoCopy with NE-specific FAQ and important items", () => {
      const config = getIntakeTenantConfig("US_NE");
      expect(config.noteTwoCopy.title).toBe("Before You Start");
      expect(config.noteTwoCopy.faqItems[1].answer).toContain(
        "not to create misconduct reports",
      );
      expect(config.noteTwoCopy.faqItems[2].answer).toContain(
        "reentry specialist",
      );
      expect(config.noteTwoCopy.importantItems[3].text).toContain(
        "120 day reentry meeting",
      );
    });
  });
});

describe("isPreIntakeStep", () => {
  it('returns true for "one"', () => {
    expect(isPreIntakeStep("one")).toBe(true);
  });

  it('returns true for "two"', () => {
    expect(isPreIntakeStep("two")).toBe(true);
  });

  it('returns true for "video"', () => {
    expect(isPreIntakeStep("video")).toBe(true);
  });

  it("returns false for null", () => {
    expect(isPreIntakeStep(null)).toBe(false);
  });

  it("returns false for an invalid string", () => {
    expect(isPreIntakeStep("three")).toBe(false);
  });
});

describe("getInitialStep", () => {
  it('returns "one" for text flow', () => {
    expect(getInitialStep(DEFAULT_INTAKE_CONFIG)).toBe("one");
  });

  it('returns "video" for video flow', () => {
    const config = getIntakeTenantConfig("US_UT");
    expect(getInitialStep(config)).toBe("video");
  });

  it('returns "one" for text+video flow', () => {
    const config = getIntakeTenantConfig("US_NE");
    expect(getInitialStep(config)).toBe("one");
  });
});
