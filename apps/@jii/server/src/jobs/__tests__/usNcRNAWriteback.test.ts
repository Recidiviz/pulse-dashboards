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

import * as Sentry from "@sentry/node";
import tk from "timekeeper";

import { allRNAQuestions, rnaQuestionConfig } from "~@jii/configs";
import { getPrismaClientForStateCode, Prisma } from "~@jii/prisma";

import {
  CompletedUsNcRNA,
  getCompletedUsNcRNA,
  getFilePath,
  processRNARecord,
} from "../usNcRNAWriteback";

vi.mock("@sentry/node");

describe("processRNARecord", () => {
  // Fake data for testing
  const mockRecord: CompletedUsNcRNA = {
    pseudonymizedId: "pseudonymizedId",
    answers: {},
    completedAt: new Date(2025, 1, 2),
    admitDate: new Date(2025, 0, 1),
    seqNumber: "003",
    opusId: "opusId",
  };
  const defaultAnswers = Object.fromEntries(
    allRNAQuestions.map((id) => {
      const { format } = rnaQuestionConfig[id];
      switch (format) {
        case "DAYS_PER_WEEK_RADIO":
          return [id, "SIX_TO_SEVEN"];
        case "FREQUENCY":
          return [id, "ALWAYS"];
        case "RATIO":
          return [id, "SOME"];
        case "YES_NO":
          return [id, "YES"];
        case "DAYS_PER_WEEK_ENTRY":
          return [id, "0"];
        case "SOBRIETY":
          return [id, { JUST_DRUGS: true }];
      }

      if (id === "lifeAreaCustom") {
        return [
          id,
          {
            customLifeArea: "Custom life area",
            improvementText: `First paragraph\nSecond paragraph\rThird paragraph`,
            interestRating: "10",
          },
        ];
      } else if (id === "lifeAreaHousing") {
        // a life area the user didn't express interest in
        return [id, { interest: false }];
      }
      return [
        id,
        {
          improvementText: `First paragraph\nSecond paragraph\rThird paragraph`,
          interest: true,
          interestRating: "1",
        },
      ];
    }),
  );

  const mockRecordWithAnswers = {
    ...mockRecord,
    answers: defaultAnswers,
  };

  it("parses all answer types", () => {
    const result = processRNARecord(mockRecordWithAnswers);
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(result).toMatchInlineSnapshot(`
      {
        "Admit Date": "2025-01-01",
        "Alcohol&OtherDrugs_Ideas": "First paragraph Second paragraph Third paragraph",
        "Alcohol&OtherDrugs_Interest": "1",
        "Alcohol&OtherDrugs_Problem": "Y",
        "Behavior_Ideas": "First paragraph Second paragraph Third paragraph",
        "Behavior_Interest": "1",
        "Behavior_Problem": "Y",
        "Education_Ideas": "First paragraph Second paragraph Third paragraph",
        "Education_Interest": "1",
        "Education_Problem": "Y",
        "Employability_Ideas": "First paragraph Second paragraph Third paragraph",
        "Employability_Interest": "1",
        "Employability_Problem": "Y",
        "Employment_Ideas": "First paragraph Second paragraph Third paragraph",
        "Employment_Interest": "1",
        "Employment_Problem": "Y",
        "Family/Friends_Ideas": "First paragraph Second paragraph Third paragraph",
        "Family/Friends_Interest": "1",
        "Family/Friends_Problem": "Y",
        "Financial_Ideas": "First paragraph Second paragraph Third paragraph",
        "Financial_Interest": "1",
        "Financial_Problem": "Y",
        "Housing_Ideas": "",
        "Housing_Interest": "",
        "Housing_Problem": "N",
        "LegalStatus_Ideas": "First paragraph Second paragraph Third paragraph",
        "LegalStatus_Interest": "1",
        "LegalStatus_Problem": "Y",
        "LifeSkills_Ideas": "First paragraph Second paragraph Third paragraph",
        "LifeSkills_Interest": "1",
        "LifeSkills_Problem": "Y",
        "MentalHealth_Ideas": "First paragraph Second paragraph Third paragraph",
        "MentalHealth_Interest": "1",
        "MentalHealth_Problem": "Y",
        "Opus#": "opusId",
        "Other_Ideas": "Custom life area First paragraph Second paragraph Third paragraph",
        "Other_Interest": "10",
        "Other_Problem": "Y",
        "Physical/Medical_Ideas": "First paragraph Second paragraph Third paragraph",
        "Physical/Medical_Interest": "1",
        "Physical/Medical_Problem": "Y",
        "Q1": "4",
        "Q10": "4",
        "Q11": "4",
        "Q12": "3",
        "Q13": "0",
        "Q14": "2",
        "Q15": "4",
        "Q16": "4",
        "Q17": "4",
        "Q18": "4",
        "Q19": "Y",
        "Q2": "4",
        "Q20": "Y",
        "Q21": "Y",
        "Q22": "Y",
        "Q23": "Y",
        "Q24": "Y",
        "Q25": "Y",
        "Q26": "Y",
        "Q27": "Y",
        "Q28": "Y",
        "Q29": "4",
        "Q3": "4",
        "Q30": "4",
        "Q31": "4",
        "Q32": "4",
        "Q33": "4",
        "Q34": "4",
        "Q35": "4",
        "Q36": "4",
        "Q37": "4",
        "Q38": "4",
        "Q39": "4",
        "Q4": "4",
        "Q40": "4",
        "Q41": "4",
        "Q42": "4",
        "Q43": "4",
        "Q44": "4",
        "Q45": "4",
        "Q46": "4",
        "Q47": "4",
        "Q48": "4",
        "Q49": "4",
        "Q5": "4",
        "Q50": "4",
        "Q51": "4",
        "Q52": "4",
        "Q53": "1",
        "Q54": "1",
        "Q55": "1",
        "Q56": "1",
        "Q57": "1",
        "Q58": "1",
        "Q6": "4",
        "Q7": "4",
        "Q8": "4",
        "Q9": "4",
        "Seq#": "003",
        "Transportation_Ideas": "First paragraph Second paragraph Third paragraph",
        "Transportation_Interest": "1",
        "Transportation_Problem": "Y",
        "dateAssessmentCompleted": "2025-02-02",
      }
    `);
  });

  it("sends error to Sentry on missing answers", () => {
    expect(() => processRNARecord(mockRecord)).not.toThrow();
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});

describe("getFilePath", () => {
  it("includes timestamp in filename", () => {
    tk.freeze("2021-02-03T16:17:18");
    expect(getFilePath()).toEqual("DOP_Self_Report_2021-02-03_16-17-18.csv");
    tk.reset();
  });
});

describe("getCompletedUsNcRNA", () => {
  const testPrismaClient = getPrismaClientForStateCode("US_NC");

  const tablesToReset: Prisma.ModelName[] = [
    "UsNcRNA",
    "UsNcRNAWritebackData",
  ] as const;

  async function resetDb() {
    await testPrismaClient.$transaction(
      tablesToReset.map((table) =>
        testPrismaClient.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
      ),
    );
  }

  // Adds a completed RNA object to the test database
  async function createCompletedRNAForResident({
    id,
    completedAt = new Date(2025, 1, 1),
    answers = {},
  }: {
    id: string;
    completedAt?: Date | null;
    answers?: Record<string, string>;
  }) {
    await testPrismaClient.usNcRNA.create({
      data: {
        pseudonymizedId: id,
        completedAt,
        answers,
      },
    });
  }

  // Adds RNA writeback data with reasonable defaults to the test database
  async function createRNAWritebackForResident(id: string) {
    await testPrismaClient.usNcRNAWritebackData.create({
      data: {
        pseudonymizedId: id,
        opusId: id,
        seqNumber: "001",
        admitDate: new Date(2025, 1, 1),
        importedAt: new Date(2025, 2, 2),
      },
    });
  }

  beforeEach(async () => {
    await resetDb();
  });

  describe("getCompletedUsNcRNA query", () => {
    it("returns nothing on empty db", async () => {
      const result = await getCompletedUsNcRNA(testPrismaClient);
      expect(result).toHaveLength(0);
    });

    it("excludes completed RNA with no corresponding writeback data", async () => {
      await createCompletedRNAForResident({ id: "test-id" });
      await createRNAWritebackForResident("another-id");
      const result = await getCompletedUsNcRNA(testPrismaClient);
      expect(result).toHaveLength(0);
    });

    it("excludes incomplete RNA", async () => {
      await createCompletedRNAForResident({
        id: "test-id",
        completedAt: null,
      });

      await createRNAWritebackForResident("test-id");

      const result = await getCompletedUsNcRNA(testPrismaClient);
      expect(result).toHaveLength(0);
    });

    it("excludes complete RNA with null admit date", async () => {
      await createCompletedRNAForResident({ id: "test-id" });

      await testPrismaClient.usNcRNAWritebackData.create({
        data: {
          pseudonymizedId: "test-id",
          opusId: "test-id",
          seqNumber: "001",
          admitDate: null,
          importedAt: new Date(2025, 2, 2),
        },
      });

      const result = await getCompletedUsNcRNA(testPrismaClient);
      expect(result).toHaveLength(0);
    });

    it("passes through null seq number", async () => {
      await createCompletedRNAForResident({ id: "test-id" });

      await testPrismaClient.usNcRNAWritebackData.create({
        data: {
          pseudonymizedId: "test-id",
          opusId: "test-id",
          seqNumber: null,
          admitDate: new Date(2025, 1, 1),
          importedAt: new Date(2025, 2, 2),
        },
      });

      const result = await getCompletedUsNcRNA(testPrismaClient);
      expect(result).toHaveLength(1);
      expect(result[0].seqNumber).toBe(null);
    });

    it("passes through non-null seq number", async () => {
      await createCompletedRNAForResident({ id: "test-id" });
      await createRNAWritebackForResident("test-id");

      const result = await getCompletedUsNcRNA(testPrismaClient);
      expect(result).toHaveLength(1);
      expect(result[0].seqNumber).toMatchInlineSnapshot(`"001"`);
    });

    it("picks the more recently completed RNA", async () => {
      await createCompletedRNAForResident({
        id: "test-id",
        completedAt: new Date(2024, 1, 1),
        answers: { foo: "bar" },
      });
      await createCompletedRNAForResident({
        id: "test-id",
        completedAt: new Date(2025, 1, 1),
        answers: { newFoo: "newBar" },
      });
      await createRNAWritebackForResident("test-id");

      const result = await getCompletedUsNcRNA(testPrismaClient);
      expect(result).toHaveLength(1);
      expect(result[0].completedAt).toEqual(new Date(2025, 1, 1));
      expect(result[0].answers).toMatchInlineSnapshot(`
      {
        "newFoo": "newBar",
      }
    `);
    });

    it("returns multiple records when there are multiple residents", async () => {
      await createCompletedRNAForResident({ id: "test-id" });
      await createCompletedRNAForResident({ id: "another-id" });
      await createRNAWritebackForResident("test-id");
      await createRNAWritebackForResident("another-id");

      const result = await getCompletedUsNcRNA(testPrismaClient);
      expect(result).toHaveLength(2);
    });
  });
});
