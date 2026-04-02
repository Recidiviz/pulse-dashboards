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

import type { IntakeTenantOverride } from "../types";

export const US_IX_OVERRIDES: IntakeTenantOverride = {
  preIntakeFlow: "text+video",
  video: {
    src: "/videos/us-id-intake-video.mp4",
    subtitlesSrc: "/videos/us-id-intake-subtitles.vtt",
  },
  noteOneCopy: {
    title: "Your Reentry Prep",
    paragraphs: [
      "This conversation is designed to help your case manager learn more about your reentry goals, plans, and needs. This helps them understand the best ways to support you as you prepare to go back to the community.",
      "Please provide honest and complete answers to make this process as effective as possible. This application will then draft a personalized reentry guide for you that goes to your case manager. If you'd prefer to skip this digital conversation and answer questions with your case manager directly, stop here and let your case manager know.",
    ],
  },
  noteTwoCopy: {
    title: "Before You Start",
    faqItems: [
      {
        question: "Who will I be chatting with?",
        answer: "You will be interacting with a chatbot, not a live person.",
      },
      {
        question: "What will this intake cover?",
        answer:
          "This will cover topics related to education, employment, criminal history, finances, health, family, housing, hobbies, and alcohol and drugs. Be as open as you are comfortable being!",
      },
      {
        question: "Who will see my responses?",
        answer:
          "Your responses will be visible to IDOC staff including your case manager and Probation & Parole Officer after release.",
      },
    ],
    importantItems: [
      {
        label: "Time:",
        text: "This survey will take approximately 45 minutes to complete.",
      },
      {
        label: "Pace:",
        text: "Some questions might require careful thought. Feel free to pause and reflect as much as you need.",
      },
      {
        label: "Pausing and continuing:",
        text: "Your progress is automatically saved, so you can leave the chat and return later if you need to pause.",
      },
      {
        label: "Deadline:",
        text: "This should be completed before your next meeting with your case manager. The sooner you can finish it, the better.",
      },
    ],
  },
};
