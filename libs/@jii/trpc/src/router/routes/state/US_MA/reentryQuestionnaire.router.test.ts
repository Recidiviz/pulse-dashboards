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
  caller,
  mockCtx,
  testPseudonymizedId,
} from "../../../../test/mockStateProcedure";
import { testPrismaClient } from "../../../../test/prisma";

const testReentryQuestionnaireId = "test-reentry-questionnaire-id";

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.setSystemTime("2022-02-02");
  mockCtx.stateCode = "US_MA";
});

describe("getReentryQuestionnaire", () => {
  it("returns null if no reentry questionnaire exists", async () => {
    await expect(
      caller.usMa.getReentryQuestionnaire({
        pseudonymizedId: testPseudonymizedId,
      }),
    ).resolves.toBeNull();
  });

  it("returns the reentry questionnaire", async () => {
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        answers: {},
      },
    });

    await expect(
      caller.usMa.getReentryQuestionnaire({
        pseudonymizedId: testPseudonymizedId,
      }),
    ).resolves.toMatchObject({ id: testReentryQuestionnaireId });
  });

  it("returns the most recently updated reentry questionnaire", async () => {
    vi.setSystemTime(new Date("2020-01-01"));

    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: "another-reentry-questionnaire-id",
        pseudonymizedId: testPseudonymizedId,
        answers: {},
      },
    });

    vi.setSystemTime(new Date("2025-05-05"));

    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        answers: {},
      },
    });

    await expect(
      caller.usMa.getReentryQuestionnaire({
        pseudonymizedId: testPseudonymizedId,
      }),
    ).resolves.toMatchObject({ id: testReentryQuestionnaireId });
  });
});

describe("getOrCreateReentryQuestionnaire", () => {
  it("creates a new blank reentry questionnaire if none exists", async () => {
    const result = await caller.usMa.getOrCreateReentryQuestionnaire({
      pseudonymizedId: testPseudonymizedId,
    });

    expect(result).toMatchObject({
      pseudonymizedId: testPseudonymizedId,
      answers: {},
    });

    await expect(
      testPrismaClient.usMaReentryQuestionnaire.findMany({
        where: { pseudonymizedId: testPseudonymizedId },
      }),
    ).resolves.toHaveLength(1);
  });

  it("returns the existing reentry questionnaire if one already exists", async () => {
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        answers: { housing: "OWN_PLACE" },
      },
    });

    await expect(
      caller.usMa.getOrCreateReentryQuestionnaire({
        pseudonymizedId: testPseudonymizedId,
      }),
    ).resolves.toMatchObject({
      id: testReentryQuestionnaireId,
      answers: { housing: "OWN_PLACE" },
    });

    await expect(
      testPrismaClient.usMaReentryQuestionnaire.findMany({
        where: { pseudonymizedId: testPseudonymizedId },
      }),
    ).resolves.toHaveLength(1);
  });
});

describe("updateReentryQuestionnaire", () => {
  it("throws error if reentry questionnaire doesn't exist", async () => {
    await expect(
      caller.usMa.overwriteReentryQuestionnaireAnswers({
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        answers: {},
        isCompleted: false,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCError: Reentry Questionnaire with ID test-reentry-questionnaire-id not found]`,
    );
  });

  it("updates all answers of the reentry questionnaire", async () => {
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        answers: { HOUSING: "OWN_PLACE", HEALTHCARE_NEEDED: "YES" },
      },
    });

    await caller.usMa.overwriteReentryQuestionnaireAnswers({
      id: testReentryQuestionnaireId,
      pseudonymizedId: testPseudonymizedId,
      answers: { HOUSING: "FAMILY" },
      isCompleted: false,
    });

    await expect(
      caller.usMa.getReentryQuestionnaire({
        pseudonymizedId: testPseudonymizedId,
      }),
    ).resolves.toEqual({
      answers: { HOUSING: "FAMILY" },
      completedAt: null,
      createdAt: new Date("2022-02-02T00:00:00.000Z"),
      id: "test-reentry-questionnaire-id",
      pseudonymizedId: "test-resident-id",
      updatedAt: new Date("2022-02-02T00:00:00.000Z"),
    });
  });

  it("rejects answers for an unknown question id", async () => {
    // a question id is never deleted/reused once shown to a resident (it's
    // deprecated instead — see ReentryQuestionnaireQuestionConfig), so an
    // unrecognized key here is a genuine bug, not a normal "retired question"
    // case; the whole update should fail rather than silently drop it
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        answers: {},
      },
    });

    await expect(
      caller.usMa.overwriteReentryQuestionnaireAnswers({
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answers: { notARealQuestion: "YES" } as any,
        isCompleted: false,
      }),
    ).rejects.toThrow();
  });

  it("rejects a non-array value for a checkbox question", async () => {
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        answers: {},
      },
    });

    await expect(
      caller.usMa.overwriteReentryQuestionnaireAnswers({
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        // TRANSPORTATION is a CHECKBOX question and expects an array of
        // selected option ids, not a bare string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answers: { TRANSPORTATION: "BIKE" } as any,
        isCompleted: false,
      }),
    ).rejects.toThrow();
  });

  it("rejects an array value for a radio question", async () => {
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        answers: {},
      },
    });

    await expect(
      caller.usMa.overwriteReentryQuestionnaireAnswers({
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        // HOUSING is a RADIO question and expects a single string, not an
        // array of selected option ids
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answers: { HOUSING: ["FAMILY"] } as any,
        isCompleted: false,
      }),
    ).rejects.toThrow();
  });

  it("stores multiple selected option ids for a checkbox question", async () => {
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        answers: {},
      },
    });

    await caller.usMa.overwriteReentryQuestionnaireAnswers({
      id: testReentryQuestionnaireId,
      pseudonymizedId: testPseudonymizedId,
      answers: { TRANSPORTATION: ["BIKE", "OWN_CAR"] },
      isCompleted: false,
    });

    await expect(
      caller.usMa.getReentryQuestionnaire({
        pseudonymizedId: testPseudonymizedId,
      }),
    ).resolves.toEqual({
      answers: { TRANSPORTATION: ["BIKE", "OWN_CAR"] },
      completedAt: null,
      createdAt: new Date("2022-02-02T00:00:00.000Z"),
      id: "test-reentry-questionnaire-id",
      pseudonymizedId: "test-resident-id",
      updatedAt: new Date("2022-02-02T00:00:00.000Z"),
    });
  });

  it("does not set completedAt when isCompleted is false", async () => {
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        answers: {},
      },
    });

    const result = await caller.usMa.overwriteReentryQuestionnaireAnswers({
      id: testReentryQuestionnaireId,
      pseudonymizedId: testPseudonymizedId,
      answers: {},
      isCompleted: false,
    });

    expect(result.completedAt).toBeNull();
  });

  it("sets completedAt to the current time when isCompleted is true", async () => {
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: testReentryQuestionnaireId,
        pseudonymizedId: testPseudonymizedId,
        answers: {},
      },
    });

    const result = await caller.usMa.overwriteReentryQuestionnaireAnswers({
      id: testReentryQuestionnaireId,
      pseudonymizedId: testPseudonymizedId,
      answers: {},
      isCompleted: true,
    });

    expect(result.completedAt).toEqual(new Date("2022-02-02"));
  });
});
