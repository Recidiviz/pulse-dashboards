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

import { Timestamp } from "firebase/firestore";

import { OffenseInformationInput } from "~datatypes";

import { resolveSection, SectionConfig } from "../resolveSection";

// A stand-in for the Offense Information section's Atlas data, so the
// Section 1 scenarios in the PHI report design doc can be tested without the
// real profile types.
type AtlasOffense = {
  id: string;
  charge: string;
  sentencingDate?: string;
  fullTermDate?: string;
};
type AtlasOffenseInformation = { offenses: AtlasOffense[] };
type CaseDetailsFields = {
  psychologicalEvaluation: "NONE";
  victim: "YES" | "NO";
};
type OffenseFields = { sentencingDate: string; fullTermDate: string };

const config: SectionConfig<
  AtlasOffenseInformation,
  AtlasOffense,
  CaseDetailsFields,
  OffenseFields
> = {
  fields: { psychologicalEvaluation: {}, victim: {} },
  rows: {
    fromAtlas: (atlas) => atlas.offenses,
    id: (offense) => offense.id,
    label: (offense) => offense.charge,
    fields: {
      sentencingDate: { fromAtlas: (offense) => offense.sentencingDate },
      fullTermDate: { fromAtlas: (offense) => offense.fullTermDate },
    },
  },
};

// The schema's own type, so a schema change that no longer fits SectionInput
// fails the type check here.
type Input = OffenseInformationInput;

const EDITED_AT = new Date("2026-11-02T15:00:00Z");

const phiEdit = <T>(value: T | null) => ({
  value,
  updatedBy: "phi@us_id.gov",
  updatedAt: EDITED_AT,
});

const robbery: AtlasOffense = {
  id: "1001",
  charge: "Robbery",
  sentencingDate: "2025-08-12",
  fullTermDate: "2035-08-15",
};
const escape: AtlasOffense = {
  id: "1002",
  charge: "Escape",
  sentencingDate: "2025-12-03",
  fullTermDate: "2037-08-15",
};

const correctedRobbery: Input = {
  rows: {
    "1001": {
      source: "ATLAS",
      atlasLabel: "Robbery",
      fields: { sentencingDate: phiEdit("2025-08-15") },
    },
  },
};

const resolve = (offenses: AtlasOffense[], input?: Input) =>
  resolveSection(config, { offenses }, input);

/** Whether any value anywhere in value is undefined. */
function containsUndefined(value: unknown): boolean {
  if (value === undefined) return true;
  if (value === null || typeof value !== "object" || value instanceof Date) {
    return false;
  }
  return Object.values(value).some(containsUndefined);
}

describe("resolveSection", () => {
  describe("Section 1 scenarios", () => {
    it("shows the Atlas sentencing date for an offense the PHI hasn't touched", () => {
      const [row] = resolve([robbery]).rows;

      expect(row.status).toBe("IN_ATLAS");
      expect(row.label).toBe("Robbery");
      expect(row.fields.sentencingDate).toEqual({
        value: "2025-08-12",
        source: "ATLAS",
        atlasValue: "2025-08-12",
        editedBy: null,
        editedAt: null,
      });
    });

    it("shows the PHI's corrected sentencing date, with the Atlas date and the editor for the Edited tooltip", () => {
      const [row] = resolve([robbery], correctedRobbery).rows;

      expect(row.fields.sentencingDate).toEqual({
        value: "2025-08-15",
        source: "PHI",
        atlasValue: "2025-08-12",
        editedBy: "phi@us_id.gov",
        editedAt: EDITED_AT,
      });
    });

    it("shows the Atlas date again once the PHI reverts, which deletes their value", () => {
      const [row] = resolve([robbery], {
        rows: {
          "1001": { source: "ATLAS", atlasLabel: "Robbery", fields: {} },
        },
      }).rows;

      expect(row.fields.sentencingDate.value).toBe("2025-08-12");
      expect(row.fields.sentencingDate.source).toBe("ATLAS");
    });

    it("keeps the PHI's date when Atlas later changes it, and shows the new Atlas date in the tooltip", () => {
      const [row] = resolve(
        [{ ...robbery, sentencingDate: "2025-08-20" }],
        correctedRobbery,
      ).rows;

      expect(row.fields.sentencingDate.value).toBe("2025-08-15");
      expect(row.fields.sentencingDate.atlasValue).toBe("2025-08-20");
    });

    it("updates facts the PHI hasn't edited while keeping the PHI's date attached", () => {
      const [row] = resolve(
        [{ ...robbery, fullTermDate: "2036-01-01" }],
        correctedRobbery,
      ).rows;

      expect(row.fields.fullTermDate.value).toBe("2036-01-01");
      expect(row.fields.fullTermDate.source).toBe("ATLAS");
      expect(row.fields.sentencingDate.value).toBe("2025-08-15");
    });

    it("adds a row with Atlas values when Atlas adds a sentence, in Atlas's order", () => {
      const { rows } = resolve([escape, robbery], correctedRobbery);

      expect(rows.map((row) => row.id)).toEqual(["1002", "1001"]);
      expect(rows[0].fields.sentencingDate.value).toBe("2025-12-03");
      expect(rows[0].fields.sentencingDate.source).toBe("ATLAS");
    });

    it("keeps a sentence the PHI edited after it drops out of Atlas, with its saved label", () => {
      const [row] = resolve([], correctedRobbery).rows;

      expect(row).toEqual({
        id: "1001",
        status: "NO_LONGER_IN_ATLAS",
        label: "Robbery",
        fields: {
          sentencingDate: {
            value: "2025-08-15",
            source: "PHI",
            atlasValue: null,
            editedBy: "phi@us_id.gov",
            editedAt: EDITED_AT,
          },
          fullTermDate: {
            value: null,
            source: "ATLAS",
            atlasValue: null,
            editedBy: null,
            editedAt: null,
          },
        },
      });
    });

    it("drops a sentence that left Atlas once the PHI has no values left on it", () => {
      expect(
        resolve([], {
          rows: {
            "1001": { source: "ATLAS", atlasLabel: "Robbery", fields: {} },
          },
        }).rows,
      ).toEqual([]);
    });

    it("shows a sentence Atlas re-keyed after an untraceable correction as no longer in Atlas, after the new row", () => {
      const { rows } = resolve([{ ...robbery, id: "2002" }], correctedRobbery);

      expect(rows.map((row) => [row.id, row.status])).toEqual([
        ["2002", "IN_ATLAS"],
        ["1001", "NO_LONGER_IN_ATLAS"],
      ]);
    });

    it("leaves the sentencing date empty for an interstate compact sentence, which has no Atlas date", () => {
      const [row] = resolve([{ ...robbery, sentencingDate: undefined }]).rows;

      expect(row.fields.sentencingDate.value).toBeNull();
      expect(row.fields.sentencingDate.atlasValue).toBeNull();
    });

    it("shows the Psychological Evaluation and Victim the PHI set", () => {
      const { fields } = resolve([robbery], {
        fields: {
          psychologicalEvaluation: phiEdit("NONE"),
          victim: phiEdit("YES"),
        },
      });

      expect(fields.psychologicalEvaluation.value).toBe("NONE");
      expect(fields.victim.value).toBe("YES");
      expect(fields.victim.source).toBe("PHI");
    });
  });

  it("shows a field the PHI cleared as empty rather than as the Atlas value", () => {
    const [row] = resolve([robbery], {
      rows: {
        "1001": {
          source: "ATLAS",
          atlasLabel: "Robbery",
          fields: { sentencingDate: phiEdit(null) },
        },
      },
    }).rows;

    expect(row.fields.sentencingDate.value).toBeNull();
    expect(row.fields.sentencingDate.source).toBe("PHI");
    expect(row.fields.sentencingDate.atlasValue).toBe("2025-08-12");
  });

  it("keeps a row that left Atlas while its only PHI value is a cleared field", () => {
    const [row] = resolve([], {
      rows: {
        "1001": {
          source: "ATLAS",
          atlasLabel: "Robbery",
          fields: { sentencingDate: phiEdit(null) },
        },
      },
    }).rows;

    expect(row.status).toBe("NO_LONGER_IN_ATLAS");
    expect(row.fields.sentencingDate.value).toBeNull();
    expect(row.fields.sentencingDate.source).toBe("PHI");
  });

  it("keeps a row the PHI removed hidden after it leaves Atlas, even with PHI values on it", () => {
    const { rows } = resolve([escape], {
      rows: {
        "1001": {
          source: "ATLAS",
          atlasLabel: "Robbery",
          removed: { by: "phi@us_id.gov", at: EDITED_AT },
          fields: { sentencingDate: phiEdit("2025-08-15") },
        },
      },
    });

    expect(rows.map((row) => row.id)).toEqual(["1002"]);
  });

  it("leaves out a row the PHI removed, even while Atlas still sends it", () => {
    const { rows } = resolve([robbery, escape], {
      rows: {
        "1001": {
          source: "ATLAS",
          atlasLabel: "Robbery",
          removed: { by: "phi@us_id.gov", at: EDITED_AT },
        },
      },
    });

    expect(rows.map((row) => row.id)).toEqual(["1002"]);
  });

  it("shows rows the PHI added after the others, even before they have values", () => {
    const { rows } = resolve([escape], {
      rows: {
        ...correctedRobbery.rows,
        phi_b: { source: "PHI" },
        phi_a: {
          source: "PHI",
          fields: { sentencingDate: phiEdit("2024-01-01") },
        },
      },
    });

    expect(rows.map((row) => [row.id, row.status, row.label])).toEqual([
      ["1002", "IN_ATLAS", "Escape"],
      ["1001", "NO_LONGER_IN_ATLAS", "Robbery"],
      ["phi_a", "ADDED_BY_PHI", null],
      ["phi_b", "ADDED_BY_PHI", null],
    ]);
  });

  it("reads a Firestore Timestamp as a Date", () => {
    const [row] = resolve([robbery], {
      rows: {
        "1001": {
          source: "ATLAS",
          atlasLabel: "Robbery",
          fields: {
            sentencingDate: {
              ...phiEdit("2025-08-15"),
              updatedAt: Timestamp.fromDate(EDITED_AT),
            },
          },
        },
      },
    }).rows;

    expect(row.fields.sentencingDate.editedAt).toEqual(EDITED_AT);
  });

  it("returns no undefined values, since submitting writes the output to Firestore", () => {
    const resolved = resolve(
      [robbery, { ...escape, sentencingDate: undefined }],
      {
        rows: { ...correctedRobbery.rows, phi_a: { source: "PHI" } },
      },
    );

    expect(containsUndefined(resolved)).toBe(false);
  });

  it("returns no rows for a section without row config", () => {
    expect(
      resolveSection({ fields: { victim: {} } }, {}, undefined).rows,
    ).toEqual([]);
  });
});
