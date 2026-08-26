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

// Guards the invariant that binds the scope compilers to the collection
// schemas: a compiled filter_by may only name fields the target collection
// declares.
//
// Typesense rejects a whole query when its filter_by names an undeclared field,
// so a violation is not a silently-empty result set — it is a 400 that takes the
// entire search down. The compiler tests assert strings and the manager tests
// mock the transport, so nothing else in the suite can catch it.

import { describe, expect, test } from "vitest";

import { schemas } from "../../schemas";
import { CaseloadFilterCompiler } from "../CaseloadFilterCompiler";
import { PersonFilterCompiler } from "../PersonFilterCompiler";
import { resolveCaseloadScope } from "../resolveCaseloadScope";
import { resolvePersonScope } from "../resolvePersonScope";
import type {
  CaseloadScope,
  PersonScope,
  SingleWorkflowsSystem,
} from "../types";

// `id` is Typesense's built-in document id. It is always filterable and never
// appears in a schema's `fields`.
const BUILT_IN_FIELDS = new Set(["id"]);

const SYSTEMS: SingleWorkflowsSystem[] = ["SUPERVISION", "INCARCERATION"];

// Every state `resolveStateBase` branches on, plus one unlisted code to cover
// the default arm.
const STATE_CODES = ["US_TN", "US_ID", "US_MI", "US_CA", "US_XX"];

function declaredFields(collectionName: string): Set<string> {
  const schema = schemas.find((s) => s.name === collectionName);
  if (!schema) {
    throw new Error(
      `No Typesense schema named "${collectionName}". Update this test if a collection was renamed.`,
    );
  }
  return new Set((schema.fields ?? []).map((f) => f.name));
}

// Pulls field names out of a compiled filter_by, including the dotted
// nested-field form.
function fieldsNamedIn(filterBy: string): string[] {
  return [...filterBy.matchAll(/([A-Za-z_][A-Za-z0-9_.]*)\s*:=/g)].map(
    (m) => m[1],
  );
}

const USERS = [
  { label: "district", district: "DISTRICT 1", hasCaseload: true },
  { label: "district 10 (US_MI prefix)", district: "10", hasCaseload: true },
  {
    label: "override districts",
    district: "DISTRICT 1",
    overrideDistrictIds: ["DISTRICT 2", "DISTRICT 3"],
    hasCaseload: true,
  },
  { label: "no district, has caseload", hasCaseload: true },
  { label: "no district, no caseload", hasCaseload: false },
  {
    label: "US_CA officer",
    roleSubtype: "SUPERVISION_OFFICER" as const,
    hasCaseload: true,
  },
  {
    label: "US_CA officer supervisor",
    roleSubtype: "SUPERVISION_OFFICER_SUPERVISOR" as const,
    hasCaseload: true,
  },
];

const FEATURE_VARIANTS = [
  {
    label: "none",
    supervisionUnrestrictedSearch: false,
    workflowsSupervisorSearch: false,
  },
  {
    label: "unrestricted search",
    supervisionUnrestrictedSearch: true,
    workflowsSupervisorSearch: false,
  },
  {
    label: "supervisor search",
    supervisionUnrestrictedSearch: false,
    workflowsSupervisorSearch: true,
  },
];

// Every scope a real user can hold, enumerated by driving the resolvers rather
// than hand-constructing scope objects, so a new state rule or feature variant
// is covered the moment it lands.
function reachableScopes(): Array<{
  label: string;
  caseload: Partial<Record<SingleWorkflowsSystem, CaseloadScope>>;
  person: Partial<Record<SingleWorkflowsSystem, PersonScope>>;
}> {
  const cases = [];

  for (const stateCode of STATE_CODES) {
    for (const user of USERS) {
      for (const fv of FEATURE_VARIANTS) {
        for (const isSupervisor of [false, true]) {
          const input = {
            stateCode,
            user: {
              id: "STAFF1",
              email: "u@example.com",
              district: user.district,
              overrideDistrictIds: user.overrideDistrictIds,
              roleSubtype: user.roleSubtype ?? null,
              hasCaseload: user.hasCaseload,
            },
            activeFeatureVariants: {
              supervisionUnrestrictedSearch: fv.supervisionUnrestrictedSearch,
              workflowsSupervisorSearch: fv.workflowsSupervisorSearch,
            },
            isSupervisor,
            staffExternalId: "STAFF1",
            supervisedStaffExternalIds: ["STAFF2", "STAFF3"],
          };

          const caseload: Partial<
            Record<SingleWorkflowsSystem, CaseloadScope>
          > = {};
          const person: Partial<Record<SingleWorkflowsSystem, PersonScope>> =
            {};
          for (const system of SYSTEMS) {
            caseload[system] = resolveCaseloadScope({ ...input, system });
            person[system] = resolvePersonScope({ ...input, system });
          }

          cases.push({
            label: `${stateCode} / ${user.label} / FV ${fv.label} / isSupervisor=${isSupervisor}`,
            caseload,
            person,
          });
        }
      }
    }
  }

  return cases;
}

const SCOPES = reachableScopes();

const REQUEST_SYSTEMS: Array<{
  label: string;
  systems: SingleWorkflowsSystem[];
}> = [
  { label: "SUPERVISION", systems: ["SUPERVISION"] },
  { label: "INCARCERATION", systems: ["INCARCERATION"] },
  { label: "ALL", systems: ["SUPERVISION", "INCARCERATION"] },
];

describe.each(REQUEST_SYSTEMS)(
  "every reachable scope compiles to declared fields ($label)",
  ({ systems }) => {
    const pick = <T>(bySystem: Partial<Record<SingleWorkflowsSystem, T>>) => ({
      supervision: systems.includes("SUPERVISION")
        ? bySystem.SUPERVISION
        : undefined,
      incarceration: systems.includes("INCARCERATION")
        ? bySystem.INCARCERATION
        : undefined,
    });

    test("caseload keys", () => {
      const violations: string[] = [];

      for (const { label, caseload } of SCOPES) {
        const filters = new CaseloadFilterCompiler("US_XX").compile(
          pick(caseload),
        );
        for (const [collection, filterBy] of Object.entries(filters)) {
          const declared = declaredFields(collection);
          for (const field of fieldsNamedIn(filterBy)) {
            if (!declared.has(field) && !BUILT_IN_FIELDS.has(field)) {
              violations.push(`${collection}.${field} — ${label}`);
            }
          }
        }
      }

      expect([...new Set(violations)]).toEqual([]);
    });

    test("person keys", () => {
      const violations: string[] = [];

      for (const { label, person } of SCOPES) {
        const filters = new PersonFilterCompiler("US_XX").compile(pick(person));
        for (const [collection, filterBy] of Object.entries(filters)) {
          const declared = declaredFields(collection);
          for (const field of fieldsNamedIn(filterBy)) {
            if (!declared.has(field) && !BUILT_IN_FIELDS.has(field)) {
              violations.push(`${collection}.${field} — ${label}`);
            }
          }
        }
      }

      expect([...new Set(violations)]).toEqual([]);
    });
  },
);

describe("the compiler's field map matches the schemas", () => {
  const caseload = CaseloadFilterCompiler.COLLECTION_FIELDS;
  const person = PersonFilterCompiler.COLLECTION_FIELDS;

  test.each(Object.entries(caseload))(
    "%s declares every field the compiler may use",
    (collection, fields) => {
      const declared = declaredFields(collection);
      const claimed = [
        fields.districtField,
        fields.emailField,
        ...(fields.hasSupervisorFields
          ? ["supervisorExternalId", "supervisorExternalIds"]
          : []),
      ].filter((f): f is string => f !== null);

      expect(claimed.filter((f) => !declared.has(f))).toEqual([]);
    },
  );

  test.each(Object.entries(person))(
    "%s declares every person grant field the compiler may use",
    (collection, allowedFields) => {
      const declared = declaredFields(collection);
      expect([...allowedFields].filter((f) => !declared.has(f))).toEqual([]);
    },
  );

  // These pin down that no collection declares a column purely to satisfy the
  // filter parser.
  test("locations declare no person-identity fields", () => {
    const declared = declaredFields("locations");
    expect(
      ["email", "supervisorExternalId", "supervisorExternalIds"].filter((f) =>
        declared.has(f),
      ),
    ).toEqual([]);
  });

  test("incarcerationStaff declare no supervisor fields", () => {
    const declared = declaredFields("incarcerationStaff");
    expect(
      ["supervisorExternalId", "supervisorExternalIds"].filter((f) =>
        declared.has(f),
      ),
    ).toEqual([]);
  });

  test("residents declare no district", () => {
    expect(declaredFields("residents").has("district")).toBe(false);
  });
});

describe("schema hygiene", () => {
  // Typesense rejects a collection create with "There are duplicate field names
  // in the schema", which fails the offline sync on the first affected
  // collection and leaves every later one unindexed.
  test.each(schemas.map((s) => s.name))(
    "%s declares each field name once",
    (collectionName) => {
      const names = (
        schemas.find((s) => s.name === collectionName)?.fields ?? []
      ).map((f) => f.name);

      const duplicates = names.filter((name, i) => names.indexOf(name) !== i);

      expect([...new Set(duplicates)]).toEqual([]);
    },
  );

  // migrate-schemas can only PATCH a new field onto a live collection when the
  // field is optional; a required addition aborts the migration.
  test("scope-only fields are optional so they can be added to live collections", () => {
    const scopeFields = new Set([
      "supervisorExternalId",
      "supervisorExternalIds",
      "district",
      "system",
    ]);

    const required = schemas.flatMap((schema) =>
      (schema.fields ?? [])
        .filter((f) => scopeFields.has(f.name) && !f.optional)
        .map((f) => `${schema.name}.${f.name}`),
    );

    expect(required).toEqual([]);
  });
});
