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

import type {
  IntakeConfigBase,
  IntakeTenantConfig,
  IntakeTenantOverride,
  TextIntakeConfig,
} from "./types";

const BASE_DEFAULTS: IntakeConfigBase = {
  preIntakeCopy: `This intake is designed to help your case manager and parole officer learn more about your reentry goals, plans, and needs. This helps them understand the best ways to support you as you transition back into the community.`,
  docId: {
    label: "DOC ID",
    placeholder: "Enter DOC ID",
  },
  navigation: { type: "redirect", url: "/assessment" },
  noteOneCopy: {
    title: "Your Community Intake",
    paragraphs: [
      "This intake is designed to help your case manager and parole officer learn more about your reentry goals, plans, and needs. This helps them understand the best ways to support you as you transition back into the community.",
      "Please provide honest and complete answers to make this process as effective as possible. This program will then draft a personalized reentry action plan for you. If you'd prefer to skip this digital intake and answer questions with your case manager directly, stop here and let your case manager know.",
    ],
  },
  noteTwoCopy: {
    title: "Before You Start",
    faqItems: [
      {
        question: "Who will I be chatting with?",
        answer:
          "In this intake, you will be interacting with a chatbot, not a live person.",
      },
      {
        question: "What will this intake cover?",
        answer:
          "This intake will cover topics related to education, employment, criminal history, finances, family and marital details, housing, leisure and recreation, and alcohol and drugs.",
      },
      {
        question: "Who will see my responses?",
        answer:
          "Your responses to this intake will be visible to your case manager and to your supervision officer after release.",
      },
    ],
    importantItems: [
      {
        label: "Time:",
        text: "This intake will take approximately 45 minutes to complete.",
      },
      {
        label: "Pace:",
        text: "Some questions might require careful thought. Feel free to pause and reflect as much as you need.",
      },
      {
        label: "Pausing and continuing:",
        text: "Your progress is automatically saved, so you can leave the intake chat and return later if you need to pause and resume later.",
      },
      {
        label: "Deadline:",
        text: "This intake should be completed before your re-entry to help develop a plan. The sooner you can finish it, the better.",
      },
    ],
  },
};

export const DEFAULT_INTAKE_CONFIG: TextIntakeConfig = {
  ...BASE_DEFAULTS,
  preIntakeFlow: "text",
};

const INTAKE_TENANT_OVERRIDES: Record<string, IntakeTenantOverride> = {
  US_UT: {
    preIntakeFlow: "video",
    video: {
      src: "/videos/intake-video.mp4",
      subtitlesSrc: "/videos/intake-subtitles.vtt",
    },
    docId: {
      label: "DOC ID / Offender Number",
      placeholder: "Enter DOC ID / Offender Number",
    },
  },
  US_NE: {
    preIntakeFlow: "video",
    video: {
      src: "/videos/nebraska-intake-video.mp4",
      subtitlesSrc: "/videos/nebraska-intake-subtitles.vtt",
    },
    preIntakeCopy: `This intake is designed to help your institutional parole officer learn more about your reentry goals, plans, and needs before you meet to discuss your personalized reentry plan.`,
    navigation: { type: "history-back" },
  },
};

/**
 * Returns the intake tenant config for a given state code.
 */
export function getIntakeTenantConfig(
  stateCode: string | null | undefined,
): IntakeTenantConfig {
  if (!stateCode) return DEFAULT_INTAKE_CONFIG;
  const overrides = INTAKE_TENANT_OVERRIDES[stateCode];
  if (!overrides) return DEFAULT_INTAKE_CONFIG;

  if ("preIntakeFlow" in overrides && overrides.preIntakeFlow === "video") {
    return {
      ...BASE_DEFAULTS,
      ...overrides,
      preIntakeFlow: "video",
      video: overrides.video,
    };
  }

  return {
    ...BASE_DEFAULTS,
    ...overrides,
    preIntakeFlow: "text",
  };
}

/** Navigate based on the configured navigation action (redirect or history-back). */
export function navigateAfterIntake(config: IntakeTenantConfig): void {
  if (config.navigation.type === "history-back") {
    window.history.back();
  } else {
    window.location.href = config.navigation.url;
  }
}
