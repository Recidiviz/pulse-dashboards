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
  getQuestionnaireStatus,
  toChecklistItems,
  toStoredAnswers,
} from "../utils";

describe("toChecklistItems", () => {
  test("orders items as the config lists them, not as the server returns them", () => {
    const items = toChecklistItems(
      [
        { itemId: "HOUSING_PLAN_AGREEMENT", checked: false },
        { itemId: "BACKUP_HOUSING", checked: false },
        { itemId: "FINALIZED_HOUSING", checked: false },
      ],
      [],
    );
    expect(items.map((item) => item.id)).toEqual([
      "BACKUP_HOUSING",
      "FINALIZED_HOUSING",
      "HOUSING_PLAN_AGREEMENT",
    ]);
  });

  test("keeps each item's checked value", () => {
    const items = toChecklistItems(
      [
        { itemId: "BACKUP_HOUSING", checked: true },
        { itemId: "FINALIZED_HOUSING", checked: false },
      ],
      [],
    );
    expect(items.map((item) => item.checked)).toEqual([true, false]);
  });

  test("marks items with a showIf as personalized", () => {
    const items = toChecklistItems(
      [
        { itemId: "BACKUP_HOUSING", checked: false },
        { itemId: "HOUSING_PLAN_AGREEMENT", checked: false }, // has a showIf condition in config
      ],
      [],
    );
    expect(items).toEqual([
      { id: "BACKUP_HOUSING", checked: false, isPersonalized: false },
      { id: "HOUSING_PLAN_AGREEMENT", checked: false, isPersonalized: true },
    ]);
  });

  test("shows pending changes over saved values, the latest one winning", () => {
    const items = toChecklistItems(
      [
        { itemId: "BACKUP_HOUSING", checked: false },
        { itemId: "FINALIZED_HOUSING", checked: false },
      ],
      [
        { itemId: "BACKUP_HOUSING", checked: true },
        { itemId: "BACKUP_HOUSING", checked: false },
        { itemId: "FINALIZED_HOUSING", checked: true },
      ],
    );
    expect(items.map((item) => item.checked)).toEqual([false, true]);
  });

  test("leaves out items the config doesn't have", () => {
    const items = toChecklistItems(
      [
        { itemId: "REMOVED_ITEM", checked: true },
        { itemId: "BACKUP_HOUSING", checked: false },
      ],
      [],
    );
    expect(items.map((item) => item.id)).toEqual(["BACKUP_HOUSING"]);
  });
});

describe("getQuestionnaireStatus", () => {
  test("returns NOT_STARTED when there is no record", () => {
    expect(getQuestionnaireStatus(null)).toBe("NOT_STARTED");
  });

  test("returns NOT_STARTED when the record has no answers yet", () => {
    expect(getQuestionnaireStatus({ completedAt: null, answers: {} })).toBe(
      "NOT_STARTED",
    );
  });

  test("returns IN_PROGRESS when there are answers but no completedAt", () => {
    expect(
      getQuestionnaireStatus({
        completedAt: null,
        answers: { housing: "OWN_PLACE" },
      }),
    ).toBe("IN_PROGRESS");
  });

  test("returns COMPLETED when completedAt is set", () => {
    expect(
      getQuestionnaireStatus({
        completedAt: new Date(),
        answers: { housing: "OWN_PLACE" },
      }),
    ).toBe("COMPLETED");
  });
});

describe("toStoredAnswers", () => {
  const questions = [
    { id: "housing", format: "RADIO" as const },
    { id: "transportation", format: "CHECKBOX" as const },
  ];

  test("stores a RADIO answer as a string and a CHECKBOX answer as a list", () => {
    expect(
      toStoredAnswers(questions, {
        housing: ["OWN_PLACE"],
        transportation: ["BIKE", "PUBLIC_TRANSIT"],
      }),
    ).toEqual({
      housing: "OWN_PLACE",
      transportation: ["BIKE", "PUBLIC_TRANSIT"],
    });
  });

  test("leaves out unanswered questions", () => {
    expect(toStoredAnswers(questions, { housing: [] })).toEqual({});
  });

  test("leaves out answers to questions it isn't given", () => {
    expect(
      toStoredAnswers(questions, {
        housing: ["OWN_PLACE"],
        removedQuestion: ["YES"],
      }),
    ).toEqual({ housing: "OWN_PLACE" });
  });
});
