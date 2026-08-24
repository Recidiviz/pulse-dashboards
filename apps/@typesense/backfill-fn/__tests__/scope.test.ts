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
  buildPruneFilter,
  instantiateFromSourceCollection,
  isValidStateCode,
} from "../src/scope";

describe("isValidStateCode", () => {
  it.each([
    "US_ID",
    "US_ND",
    "US_TX",
    "US_CA",
    "US_ZZ", // well-formed but not (yet) in ~auth-utils — the ETL fires for
    "US_XX", // states before they're enrolled, so shape is the gate, not membership
  ])("accepts a well-formed state code %j", (value) => {
    expect(isValidStateCode(value)).toBe(true);
  });

  it.each([
    "us_id", // wrong case — codes are uppercase
    "US_TEX", // too many letters
    "US_I", // too few letters
    "US_1D", // digits not allowed
    "USTX",
    "US_ID || true", // filter-injection attempt
    "US ID",
    "",
  ])("rejects a malformed code %j", (value) => {
    expect(isValidStateCode(value)).toBe(false);
  });

  it("rejects non-string values", () => {
    for (const value of [123, null, undefined, {}, ["US_ID"]]) {
      expect(isValidStateCode(value)).toBe(false);
    }
  });
});

describe("buildPruneFilter", () => {
  it("returns undefined with no scope arguments (whole-collection prune)", () => {
    expect(buildPruneFilter(undefined, undefined)).toBeUndefined();
  });

  it("uses the invocation stateCode when only that is set", () => {
    expect(buildPruneFilter(undefined, "US_ID")).toBe("stateCode:=US_ID");
  });

  it("joins constantFields into an AND expression", () => {
    // Multi-source targets need this — a `US_TN_compliantReporting` source
    // must only prune docs in `opportunities` where BOTH stateCode AND
    // opportunityType match, otherwise it would delete every other opp type.
    expect(
      buildPruneFilter(
        { stateCode: "US_TN", opportunityType: "compliantReporting" },
        undefined,
      ),
    ).toBe("stateCode:=US_TN && opportunityType:=compliantReporting");
  });

  it("invocation stateCode overrides constantFields.stateCode when both are set", () => {
    // runBackfill filters mismatched sources out before we get here, so the
    // values should never disagree in practice — but be defensive because
    // prune deletes: the more explicit invocation-level arg wins.
    expect(
      buildPruneFilter(
        { stateCode: "US_TN", opportunityType: "compliantReporting" },
        "US_ID",
      ),
    ).toBe("stateCode:=US_ID && opportunityType:=compliantReporting");
  });
});

describe("instantiateFromSourceCollection", () => {
  it("returns the input unchanged when no sourceCollection is supplied", () => {
    const configs = [
      { name: "clients", fields: ["stateCode"] },
      { name: "opportunities", fields: ["externalId"] },
    ];
    expect(instantiateFromSourceCollection(configs, undefined)).toEqual(
      configs,
    );
  });

  it("fills in sourceCollection, docIdOverrides, and constantFields.sourceCollection on template configs", () => {
    // The opportunity ETL trigger relies on this — a bare template config
    // gets instantiated per-source at trigger time.
    const result = instantiateFromSourceCollection(
      [{ name: "opportunities", fields: ["externalId", "opportunityType"] }],
      "US_TN-compliantReportingReferrals",
    );
    expect(result).toEqual([
      {
        name: "opportunities",
        fields: ["externalId", "opportunityType"],
        sourceCollection: "US_TN-compliantReportingReferrals",
        docIdOverrides: {
          type: "prefix",
          prefix: "US_TN-compliantReportingReferrals",
        },
        constantFields: {
          sourceCollection: "US_TN-compliantReportingReferrals",
        },
      },
    ]);
  });

  it("does NOT overwrite a config that already carries its own sourceCollection", () => {
    // Statically-enumerated multi-source targets (if any) shouldn't be
    // clobbered by an invocation-level sourceCollection meant for a
    // different template.
    const configs = [
      {
        name: "opportunities",
        sourceCollection: "US_ID-LSUReferrals",
        fields: ["externalId"],
        docIdOverrides: {
          type: "prefix" as const,
          prefix: "US_ID-LSUReferrals",
        },
        constantFields: { sourceCollection: "US_ID-LSUReferrals" },
      },
    ];
    expect(
      instantiateFromSourceCollection(configs, "some-other-source"),
    ).toEqual(configs);
  });

  it("preserves an explicit docIdOverrides over the source-derived default", () => {
    // Defensive: if a caller ever supplies a template with a custom prefix,
    // instantiation should keep it instead of overwriting with the source name.
    const [result] = instantiateFromSourceCollection(
      [
        {
          name: "opportunities",
          fields: ["externalId"],
          docIdOverrides: { type: "prefix" as const, prefix: "custom-prefix" },
        },
      ],
      "US_TN-somethingReferrals",
    );
    expect(result?.docIdOverrides).toEqual({
      type: "prefix",
      prefix: "custom-prefix",
    });
  });

  it("leaves a field-composed id alone rather than making it a prefix", () => {
    // A field-composed id is already unique across sources, and sync-fn
    // composes the same id from the update's Firestore path — a prefix here
    // would put the two writers on different documents.
    const [result] = instantiateFromSourceCollection(
      [
        {
          name: "opportunities",
          fields: ["externalId"],
          docIdOverrides: {
            type: "fields" as const,
            fields: ["stateCode", "externalId", "opportunityType"],
            lowercaseFields: ["stateCode"],
          },
        },
      ],
      "US_TN-compliantReportingReferrals",
    );
    expect(result?.docIdOverrides).toEqual({
      type: "fields",
      fields: ["stateCode", "externalId", "opportunityType"],
      lowercaseFields: ["stateCode"],
    });
  });

  it("merges into (not replaces) existing constantFields", () => {
    const [result] = instantiateFromSourceCollection(
      [
        {
          name: "opportunities",
          fields: ["externalId"],
          constantFields: { pipelineVersion: "v2" },
        },
      ],
      "US_TN-somethingReferrals",
    );
    expect(result?.constantFields).toEqual({
      pipelineVersion: "v2",
      sourceCollection: "US_TN-somethingReferrals",
    });
  });

  it("applies the invocation sourceCollection to ANY config that lacks its own", () => {
    // Instantiation is name-blind: any config lacking a static sourceCollection
    // gets the invocation's value, not just the opportunities template.
    const [result] = instantiateFromSourceCollection(
      [{ name: "clients", fields: ["stateCode"] }],
      "US_TN-somethingReferrals",
    );
    expect(result).toMatchObject({
      name: "clients",
      sourceCollection: "US_TN-somethingReferrals",
    });
  });
});
