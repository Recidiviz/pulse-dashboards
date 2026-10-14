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

import { QuestionDisplay, QuestionnaireQuestion } from "../types";
import {
  applyExclusiveOptions,
  buildQuestionDisplay,
  buildQuestionnaireDisplay,
  formatAnswerText,
  getEditQuestionIds,
  getInitialAnswers,
  getInitialStep,
  getVisibleQuestions,
  isAnswered,
  isFollowUpOf,
  isQuestionVisible,
  pruneHiddenAnswers,
} from "../utils";

const needsCare: QuestionDisplay = {
  id: "needsCare",
  format: "RADIO",
  heading: "Need care?",
  options: [
    { value: "YES", label: "Yes" },
    { value: "NO", label: "No" },
  ],
};

const careDetails: QuestionDisplay = {
  id: "careDetails",
  format: "CHECKBOX",
  heading: "What care?",
  options: [
    { value: "MEDS", label: "Medicine" },
    { value: "THERAPY", label: "Therapy" },
    { value: "UNSURE", label: "I'm not sure", exclusive: true },
  ],
  showIf: { questionId: "needsCare", operator: "equals", value: "YES" },
};

const questions: QuestionnaireQuestion[] = [
  { ...needsCare, sectionDomain: "health" },
  { ...careDetails, sectionDomain: "health" },
];

describe("isFollowUpOf", () => {
  test("is false without a showIf", () => {
    expect(isFollowUpOf(needsCare, new Set(["needsCare"]))).toBe(false);
  });

  test("is true when its showIf depends on one of the ids", () => {
    expect(isFollowUpOf(careDetails, new Set(["needsCare"]))).toBe(true);
    expect(isFollowUpOf(careDetails, new Set(["other"]))).toBe(false);
  });

  test("checks every condition in an `any` list", () => {
    const question: QuestionDisplay = {
      ...needsCare,
      showIf: {
        any: [
          { questionId: "a", operator: "equals", value: "YES" },
          { questionId: "b", operator: "equals", value: "YES" },
        ],
      },
    };
    expect(isFollowUpOf(question, new Set(["b"]))).toBe(true);
  });
});

describe("getEditQuestionIds", () => {
  const parent: QuestionDisplay = {
    id: "parent",
    format: "RADIO",
    heading: "Parent question",
    options: [],
  };
  const otherParent: QuestionDisplay = {
    id: "otherParent",
    format: "RADIO",
    heading: "Other parent question",
    options: [],
  };
  const followUp: QuestionDisplay = {
    id: "followUp",
    format: "RADIO",
    heading: "Follow-up of the parent",
    options: [],
    showIf: { questionId: "parent", operator: "equals", value: "YES" },
  };
  const followUpOfFollowUp: QuestionDisplay = {
    id: "followUpOfFollowUp",
    format: "RADIO",
    heading: "Follow-up of the follow-up",
    options: [],
    showIf: { questionId: "followUp", operator: "equals", value: "YES" },
  };
  const sharedFollowUp: QuestionDisplay = {
    id: "sharedFollowUp",
    format: "RADIO",
    heading: "Follow-up of either parent",
    options: [],
    showIf: {
      any: [
        { questionId: "otherParent", operator: "equals", value: "YES" },
        { questionId: "parent", operator: "equals", value: "YES" },
      ],
    },
  };

  test("includes the edited question and its follow-ups, but not unrelated questions", () => {
    expect(
      getEditQuestionIds([parent, otherParent, followUp], "parent"),
    ).toEqual(new Set(["parent", "followUp"]));
  });

  test("includes follow-ups of follow-ups", () => {
    expect(
      getEditQuestionIds([parent, followUp, followUpOfFollowUp], "parent"),
    ).toEqual(new Set(["parent", "followUp", "followUpOfFollowUp"]));
  });

  test("includes a follow-up with several parents from whichever parent is edited", () => {
    expect(
      getEditQuestionIds([parent, otherParent, sharedFollowUp], "parent"),
    ).toEqual(new Set(["parent", "sharedFollowUp"]));
    expect(
      getEditQuestionIds([parent, otherParent, sharedFollowUp], "otherParent"),
    ).toEqual(new Set(["otherParent", "sharedFollowUp"]));
  });
});

describe("isQuestionVisible", () => {
  test("is always visible without a showIf", () => {
    expect(isQuestionVisible(needsCare, {})).toBe(true);
  });

  test("equals: visible only when the answer matches", () => {
    expect(isQuestionVisible(careDetails, { needsCare: ["YES"] })).toBe(true);
    expect(isQuestionVisible(careDetails, { needsCare: ["NO"] })).toBe(false);
    expect(isQuestionVisible(careDetails, {})).toBe(false);
  });

  test("notEquals: visible only when answered with something else", () => {
    const question: QuestionDisplay = {
      ...careDetails,
      showIf: { questionId: "needsCare", operator: "notEquals", value: "YES" },
    };
    expect(isQuestionVisible(question, { needsCare: ["NO"] })).toBe(true);
    expect(isQuestionVisible(question, { needsCare: ["YES"] })).toBe(false);
  });

  test("hidden while the question it depends on is unanswered", () => {
    const notEquals: QuestionDisplay = {
      ...careDetails,
      showIf: { questionId: "needsCare", operator: "notEquals", value: "YES" },
    };
    for (const question of [careDetails, notEquals]) {
      expect(isQuestionVisible(question, {})).toBe(false);
      expect(isQuestionVisible(question, { needsCare: [] })).toBe(false);
    }
  });

  test("matches against a CHECKBOX answer's selected values", () => {
    const question: QuestionDisplay = {
      ...needsCare,
      showIf: { questionId: "careDetails", operator: "equals", value: "MEDS" },
    };
    expect(isQuestionVisible(question, { careDetails: ["MEDS"] })).toBe(true);
    expect(
      isQuestionVisible(question, { careDetails: ["MEDS", "THERAPY"] }),
    ).toBe(true);
    expect(isQuestionVisible(question, { careDetails: ["THERAPY"] })).toBe(
      false,
    );
  });

  test("any: visible when at least one condition matches", () => {
    const question: QuestionDisplay = {
      ...needsCare,
      showIf: {
        any: [
          { questionId: "a", operator: "equals", value: "YES" },
          { questionId: "b", operator: "equals", value: "YES" },
        ],
      },
    };
    expect(isQuestionVisible(question, { b: ["YES"] })).toBe(true);
    expect(isQuestionVisible(question, { a: ["YES"], b: ["NO"] })).toBe(true);
    expect(isQuestionVisible(question, { a: ["NO"], b: ["NO"] })).toBe(false);
  });
});

describe("getVisibleQuestions", () => {
  test("drops questions whose showIf isn't met", () => {
    expect(getVisibleQuestions(questions, {}).map((q) => q.id)).toEqual([
      "needsCare",
    ]);
    expect(
      getVisibleQuestions(questions, { needsCare: ["YES"] }).map((q) => q.id),
    ).toEqual(["needsCare", "careDetails"]);
  });
});

describe("pruneHiddenAnswers", () => {
  test("keeps answers to visible questions", () => {
    const answers = { needsCare: ["YES"], careDetails: ["MEDS"] };
    expect(pruneHiddenAnswers(questions, answers)).toEqual(answers);
  });

  test("clears a follow-up's answer once its question hides it", () => {
    expect(
      pruneHiddenAnswers(questions, {
        needsCare: ["NO"],
        careDetails: ["MEDS"],
      }),
    ).toEqual({ needsCare: ["NO"] });
  });

  test("clears follow-ups of a cleared follow-up", () => {
    const careFrequency: QuestionDisplay = {
      id: "careFrequency",
      format: "RADIO",
      heading: "How often?",
      options: [{ value: "WEEKLY", label: "Weekly" }],
      showIf: { questionId: "careDetails", operator: "equals", value: "MEDS" },
    };
    expect(
      pruneHiddenAnswers([...questions, careFrequency], {
        needsCare: ["NO"],
        careDetails: ["MEDS"],
        careFrequency: ["WEEKLY"],
      }),
    ).toEqual({ needsCare: ["NO"] });
  });
});

describe("isAnswered", () => {
  test.each([
    [undefined, false],
    [[], false],
    [["YES"], true],
  ])("%j -> %s", (value, expected) => {
    expect(isAnswered(value)).toBe(expected);
  });
});

describe("applyExclusiveOptions", () => {
  test("checking an exclusive option clears everything else", () => {
    expect(
      applyExclusiveOptions(
        careDetails,
        ["MEDS", "THERAPY"],
        ["MEDS", "THERAPY", "UNSURE"],
      ),
    ).toEqual(["UNSURE"]);
  });

  test("checking a regular option clears a checked exclusive one", () => {
    expect(
      applyExclusiveOptions(careDetails, ["UNSURE"], ["UNSURE", "MEDS"]),
    ).toEqual(["MEDS"]);
  });

  test("checking a regular option keeps other regular ones", () => {
    expect(
      applyExclusiveOptions(careDetails, ["MEDS"], ["MEDS", "THERAPY"]),
    ).toEqual(["MEDS", "THERAPY"]);
  });

  test("switching a RADIO answer replaces it", () => {
    expect(applyExclusiveOptions(needsCare, ["NO"], ["YES"])).toEqual(["YES"]);
  });

  test("treats a missing previous answer as no selections", () => {
    expect(applyExclusiveOptions(careDetails, undefined, ["UNSURE"])).toEqual([
      "UNSURE",
    ]);
  });

  test("unchecking passes through unchanged", () => {
    expect(
      applyExclusiveOptions(careDetails, ["MEDS", "THERAPY"], ["MEDS"]),
    ).toEqual(["MEDS"]);
  });
});

describe("formatAnswerText", () => {
  test("returns an empty string when unanswered", () => {
    expect(formatAnswerText(needsCare, undefined)).toBe("");
  });

  test("uses the option label for a RADIO answer", () => {
    expect(formatAnswerText(needsCare, ["YES"])).toBe("Yes");
  });

  test("joins labels for a CHECKBOX answer", () => {
    expect(formatAnswerText(careDetails, ["MEDS", "THERAPY"])).toBe(
      "Medicine, Therapy",
    );
  });

  test("falls back to the raw value for an unknown option", () => {
    expect(formatAnswerText(needsCare, ["MAYBE"])).toBe("MAYBE");
  });
});

describe("getInitialAnswers", () => {
  test("wraps stored RADIO strings in a list", () => {
    expect(getInitialAnswers(questions, { needsCare: "YES" })).toEqual({
      needsCare: ["YES"],
    });
  });

  test("keeps stored lists, drops anything else", () => {
    const stored: Record<string, unknown> = {
      needsCare: 42,
      careDetails: ["MEDS"],
    };
    expect(getInitialAnswers(questions, stored)).toEqual({
      careDetails: ["MEDS"],
    });
  });
});

describe("getInitialStep", () => {
  test("NOT_STARTED starts on the intro", () => {
    expect(getInitialStep("NOT_STARTED", questions, {})).toEqual({
      kind: "intro",
    });
  });

  test("COMPLETED lands on review", () => {
    expect(
      getInitialStep("COMPLETED", questions, { needsCare: ["NO"] }),
    ).toEqual({ kind: "review" });
  });

  test("IN_PROGRESS resumes at the first unanswered visible question", () => {
    expect(
      getInitialStep("IN_PROGRESS", questions, { needsCare: ["YES"] }),
    ).toEqual({ kind: "question", questionId: "careDetails" });
  });

  test("IN_PROGRESS skips questions hidden by a showIf", () => {
    expect(
      getInitialStep("IN_PROGRESS", questions, { needsCare: ["NO"] }),
    ).toEqual({ kind: "review" });
  });
});

describe("buildQuestionDisplay", () => {
  test("combines config with copy lookups", () => {
    expect(
      buildQuestionDisplay(
        "needsCare",
        {
          domain: "HEALTH",
          format: "CHECKBOX",
          options: ["YES", "UNSURE"],
          exclusiveOptions: ["UNSURE"],
        },
        (questionId) => ({
          question: `${questionId} heading`,
          whyWeAsk: `${questionId} why we ask`,
        }),
        (questionId, optionId) => `${questionId}.${optionId}`,
      ),
    ).toEqual({
      id: "needsCare",
      format: "CHECKBOX",
      heading: "needsCare heading",
      whyWeAsk: "needsCare why we ask",
      options: [
        { value: "YES", label: "needsCare.YES", exclusive: false },
        { value: "UNSURE", label: "needsCare.UNSURE", exclusive: true },
      ],
      showIf: undefined,
    });
  });
});

describe("buildQuestionnaireDisplay", () => {
  const display = buildQuestionnaireDisplay({
    questionIds: ["needsCare", "housing", "careDetails"],
    config: {
      needsCare: { domain: "HEALTH", format: "RADIO", options: ["YES"] },
      housing: { domain: "HOUSING", format: "RADIO", options: ["YES"] },
      careDetails: {
        domain: "HEALTH",
        format: "CHECKBOX",
        options: ["MEDS"],
        exclusiveOptions: [],
      },
    },
    getSectionLabel: (domain) => `${domain} label`,
    getQuestionCopy: (questionId) => ({ question: `${questionId} heading` }),
    getOptionCopy: (questionId, optionId) => `${questionId}.${optionId}`,
  });

  test("builds one section per domain, in the order of its first question", () => {
    expect(display.sections).toEqual([
      { domain: "HEALTH", label: "HEALTH label" },
      { domain: "HOUSING", label: "HOUSING label" },
    ]);
  });

  test("builds the questions in config order, each tagged with its section", () => {
    expect(
      display.questions.map(({ id, heading, sectionDomain }) => ({
        id,
        heading,
        sectionDomain,
      })),
    ).toEqual([
      {
        id: "needsCare",
        heading: "needsCare heading",
        sectionDomain: "HEALTH",
      },
      { id: "housing", heading: "housing heading", sectionDomain: "HOUSING" },
      {
        id: "careDetails",
        heading: "careDetails heading",
        sectionDomain: "HEALTH",
      },
    ]);
  });
});
