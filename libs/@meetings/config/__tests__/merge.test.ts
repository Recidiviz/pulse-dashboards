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

import { describe, expect, test } from "vitest";

import { mergeWithBase } from "~@meetings/config/merge";
import { AgencyConfigSchema } from "~@meetings/config/types";

describe("mergeWithBase", () => {
  const BASE = {
    version: 1 as const,
    glossary: { UA: "Urinalysis drug test", PO: "Probation Officer" },
    rules: ["Base policy"],
    keywords: ["BASE_KW"],
    outputs: [
      {
        id: "case_note",
        label: "Case Note",
        promptGuidance: "Base guidance",
      },
    ],
    labels: {
      supervisionStaff: "Supervision Staff",
      facilitiesStaff: "Facilities Staff",
      client: "Client",
      resident: "Resident",
    },
  };

  const AGENCY = {
    name: "Test Agency",
    stateCode: "US_XX",
    version: 1 as const,
  };

  test("inherits base fields when agency specifies nothing", () => {
    const result = mergeWithBase(BASE, AGENCY);
    expect(result["glossary"]).toEqual(BASE.glossary);
    expect(result["rules"]).toEqual(BASE.rules);
    expect(result["keywords"]).toEqual(BASE.keywords);
    expect(result["outputs"]).toEqual(BASE.outputs);
  });

  test("preserves base version as baseVersion independent of agency version", () => {
    const result = mergeWithBase(
      { ...BASE, version: 2 },
      { ...AGENCY, version: 5 },
    );
    expect(result["baseVersion"]).toBe(2);
    expect(result["version"]).toBe(5);
  });

  test("additionalGlossary merges on top of base glossary", () => {
    const result = mergeWithBase(BASE, {
      ...AGENCY,
      additionalGlossary: { ISP: "Intensive Supervision Program" },
    });
    expect(result["glossary"]).toEqual({
      UA: "Urinalysis drug test",
      PO: "Probation Officer",
      ISP: "Intensive Supervision Program",
    });
  });

  test("agency additionalGlossary overrides base glossary key", () => {
    const result = mergeWithBase(BASE, {
      ...AGENCY,
      additionalGlossary: { PO: "Parole Officer" },
    });
    expect((result["glossary"] as Record<string, string>)["PO"]).toBe(
      "Parole Officer",
    );
  });

  test("glossary replaces base glossary entirely", () => {
    const result = mergeWithBase(BASE, {
      ...AGENCY,
      glossary: { CM: "Case Manager" },
    });
    expect(result["glossary"]).toEqual({ CM: "Case Manager" });
  });

  test("additionalRules appends to base rules", () => {
    const result = mergeWithBase(BASE, {
      ...AGENCY,
      additionalRules: ["Agency policy"],
    });
    expect(result["rules"]).toEqual(["Base policy", "Agency policy"]);
  });

  test("rules replaces base rules entirely", () => {
    const result = mergeWithBase(BASE, {
      ...AGENCY,
      rules: ["Only this"],
    });
    expect(result["rules"]).toEqual(["Only this"]);
  });

  test("additionalKeywords appends to base keywords", () => {
    const result = mergeWithBase(BASE, {
      ...AGENCY,
      additionalKeywords: ["AGENCY_KW"],
    });
    expect(result["keywords"]).toEqual(["BASE_KW", "AGENCY_KW"]);
  });

  test("keywords replaces base keywords entirely", () => {
    const result = mergeWithBase(BASE, {
      ...AGENCY,
      keywords: ["ONLY_THIS"],
    });
    expect(result["keywords"]).toEqual(["ONLY_THIS"]);
  });

  test("additionalOutputs appends to base outputs", () => {
    const result = mergeWithBase(BASE, {
      ...AGENCY,
      additionalOutputs: [
        {
          id: "custom",
          label: "Custom",
          promptGuidance: "Custom guidance",
        },
      ],
    });
    expect((result["outputs"] as { id: string }[]).map((o) => o.id)).toEqual([
      "case_note",
      "custom",
    ]);
  });

  test("outputs replaces base outputs entirely", () => {
    const result = mergeWithBase(BASE, {
      ...AGENCY,
      outputs: [{ id: "only", label: "Only", promptGuidance: "Only" }],
    });
    expect(result["outputs"]).toHaveLength(1);
    expect((result["outputs"] as { id: string }[])[0].id).toBe("only");
  });

  test("resolved result has no additional* fields", () => {
    const result = mergeWithBase(BASE, {
      ...AGENCY,
      additionalGlossary: { CM: "Case Manager" },
      additionalRules: ["Extra"],
      additionalKeywords: ["KW"],
      additionalOutputs: [{ id: "x", label: "X", promptGuidance: "X" }],
    });
    expect(result["additionalGlossary"]).toBeUndefined();
    expect(result["additionalRules"]).toBeUndefined();
    expect(result["additionalKeywords"]).toBeUndefined();
    expect(result["additionalOutputs"]).toBeUndefined();
  });

  describe("outputPatches", () => {
    test("merges patch fields onto matched output without replacing other fields", () => {
      const result = mergeWithBase(BASE, {
        ...AGENCY,
        outputPatches: {
          case_note: { subheaders: ["Housing", "Employment"] },
        },
      });
      const outputs = result["outputs"] as {
        id: string;
        promptGuidance: string;
        subheaders?: string[];
      }[];
      expect(outputs).toHaveLength(1);
      expect(outputs[0].promptGuidance).toBe("Base guidance");
      expect(outputs[0].subheaders).toEqual(["Housing", "Employment"]);
    });

    test("leaves unpatched outputs unchanged", () => {
      const baseWithTwo = {
        ...BASE,
        outputs: [
          ...BASE.outputs,
          {
            id: "minutes",
            label: "Minutes",
            promptGuidance: "Minutes guidance",
          },
        ],
      };
      const result = mergeWithBase(baseWithTwo, {
        ...AGENCY,
        outputPatches: { case_note: { subheaders: ["Housing"] } },
      });
      const outputs = result["outputs"] as {
        id: string;
        subheaders?: string[];
      }[];
      const minutes = outputs.find((o) => o.id === "minutes");
      expect(minutes?.subheaders).toBeUndefined();
    });

    test("outputPatches is stripped from resolved result", () => {
      const result = mergeWithBase(BASE, {
        ...AGENCY,
        outputPatches: { case_note: { subheaders: ["Housing"] } },
      });
      expect(result["outputPatches"]).toBeUndefined();
    });

    test("patch for unknown output id is silently ignored", () => {
      const result = mergeWithBase(BASE, {
        ...AGENCY,
        outputPatches: { nonexistent: { subheaders: ["Housing"] } },
      });
      expect(result["outputs"]).toEqual(BASE.outputs);
    });
  });

  test("agency infrastructure fields override base", () => {
    const result = mergeWithBase(
      { ...BASE, showTranscriptions: true, audioTTLDays: 30 },
      { ...AGENCY, showTranscriptions: false, audioTTLDays: null },
    );
    expect(result["showTranscriptions"]).toBe(false);
    expect(result["audioTTLDays"]).toBeNull();
  });

  test("staffFeedbackEnabled defaults to false when the agency omits it", () => {
    const merged = mergeWithBase(
      { version: 1 },
      { name: "Test Agency", stateCode: "US_XX", version: 1 },
    );
    expect(AgencyConfigSchema.parse(merged).staffFeedbackEnabled).toBe(false);
  });

  test("staffFeedbackEnabled passes through when the agency sets it", () => {
    const merged = mergeWithBase(
      { version: 1 },
      {
        name: "Test Agency",
        stateCode: "US_XX",
        version: 1,
        staffFeedbackEnabled: true,
      },
    );
    expect(AgencyConfigSchema.parse(merged).staffFeedbackEnabled).toBe(true);
  });

  test("staffFeedbackEnabled set on the agency overrides the base value", () => {
    const merged = mergeWithBase(
      { version: 1, staffFeedbackEnabled: true },
      {
        name: "Test Agency",
        stateCode: "US_XX",
        version: 1,
        staffFeedbackEnabled: false,
      },
    );
    expect(AgencyConfigSchema.parse(merged).staffFeedbackEnabled).toBe(false);
  });
});
