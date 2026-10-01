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
  QuestionnaireQuestion,
  QuestionnaireSectionDisplay,
} from "../../types";
import { EditSession } from "../types";
import { getQuestionPosition } from "../utils";

const needsCare: QuestionnaireQuestion = {
  id: "needsCare",
  format: "RADIO",
  heading: "Need care?",
  options: [
    { value: "YES", label: "Yes" },
    { value: "NO", label: "No" },
  ],
  sectionDomain: "health",
};

const careDetails: QuestionnaireQuestion = {
  id: "careDetails",
  format: "CHECKBOX",
  heading: "What care?",
  options: [{ value: "MEDS", label: "Medicine" }],
  showIf: { questionId: "needsCare", operator: "equals", value: "YES" },
  sectionDomain: "health",
};

const benefits: QuestionnaireQuestion = {
  id: "benefits",
  format: "RADIO",
  heading: "Benefits?",
  options: [
    { value: "YES", label: "Yes" },
    { value: "NO", label: "No" },
  ],
  sectionDomain: "money",
};

const sections: QuestionnaireSectionDisplay[] = [
  { domain: "health", label: "Health" },
  { domain: "money", label: "Money" },
];

const editingNeedsCare: EditSession = {
  startQuestionId: "needsCare",
  questionIds: new Set(["needsCare"]),
  answersBeforeEdit: {},
};

describe("getQuestionPosition", () => {
  test("the first question has no previous question and leads to the next", () => {
    const position = getQuestionPosition({
      visibleQuestions: [needsCare, benefits],
      questionId: "needsCare",
      answers: { needsCare: ["NO"] },
      sections,
      editSession: null,
    });
    expect(position).toEqual({
      question: needsCare,
      answer: ["NO"],
      previousQuestion: undefined,
      upcomingQuestion: benefits,
      isLastQuestionBeforeReview: false,
      sectionIndex: 0,
    });
  });

  test("the last visible question leads to Review", () => {
    const position = getQuestionPosition({
      visibleQuestions: [needsCare, benefits],
      questionId: "benefits",
      answers: {},
      sections,
      editSession: null,
    });
    expect(position.previousQuestion).toBe(needsCare);
    expect(position.upcomingQuestion).toBeUndefined();
    expect(position.isLastQuestionBeforeReview).toBe(true);
    expect(position.sectionIndex).toBe(1);
  });

  test("during an edit, Next continues into a follow-up of the edited question", () => {
    const position = getQuestionPosition({
      visibleQuestions: [needsCare, careDetails, benefits],
      questionId: "needsCare",
      answers: { needsCare: ["YES"] },
      sections,
      editSession: editingNeedsCare,
    });
    expect(position.upcomingQuestion).toBe(careDetails);
    expect(position.isLastQuestionBeforeReview).toBe(false);
  });

  test("during an edit, Next returns to Review before a question outside the edit", () => {
    const position = getQuestionPosition({
      visibleQuestions: [needsCare, benefits],
      questionId: "needsCare",
      answers: { needsCare: ["NO"] },
      sections,
      editSession: editingNeedsCare,
    });
    expect(position.upcomingQuestion).toBeUndefined();
    expect(position.isLastQuestionBeforeReview).toBe(true);
  });

  test("during an edit, Next skips questions outside the edit to reach a later follow-up", () => {
    const position = getQuestionPosition({
      visibleQuestions: [needsCare, benefits, careDetails],
      questionId: "needsCare",
      answers: { needsCare: ["YES"] },
      sections,
      editSession: editingNeedsCare,
    });
    expect(position.upcomingQuestion).toBe(careDetails);
    expect(position.isLastQuestionBeforeReview).toBe(false);
  });

  test("during an edit, Back skips questions outside the edit", () => {
    const position = getQuestionPosition({
      visibleQuestions: [needsCare, benefits, careDetails],
      questionId: "careDetails",
      answers: { needsCare: ["YES"] },
      sections,
      editSession: {
        ...editingNeedsCare,
        questionIds: new Set(["needsCare", "careDetails"]),
      },
    });
    expect(position.previousQuestion).toBe(needsCare);
  });
});
