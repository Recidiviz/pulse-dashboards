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

import {
  BROWSER_SEARCHABLE_COLLECTIONS,
  collectionNames,
  schemas,
} from "../../schemas";
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

  // The map's VALUES are the physical columns a compiled filter_by names, and
  // they differ from the grant name. A typo compiles fine, then fails the whole
  // query at runtime: Typesense rejects a filter naming an undeclared field.
  test.each(Object.entries(person))(
    "%s declares every column the compiler may name",
    (collection, allowedFields) => {
      const declared = declaredFields(collection);
      const columns = [...allowedFields.values()];
      expect(columns.filter((f) => !declared.has(f))).toEqual([]);
    },
  );

  test("the rename map is total — every allowed grant maps to a column", () => {
    const unmapped = Object.entries(person).flatMap(([collection, fields]) =>
      [...fields.entries()]
        .filter(([, column]) => !column)
        .map(([grant]) => `${collection}.${grant}`),
    );

    expect(unmapped).toEqual([]);
  });

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

// Two reference attributes whose defaults are wrong for us, both failing
// silently: `cascade_delete` defaults to TRUE, and setting it false is invalid
// without `async_reference: true` — so removing the latter re-enables it.
describe("reference fields", () => {
  const referenceFields = schemas.flatMap((schema) =>
    (schema.fields ?? [])
      .filter((f) => f["reference"] !== undefined)
      .map((f) => ({ collection: schema.name, field: f })),
  );

  test("every reference field is covered by this suite", () => {
    expect(
      referenceFields.map((r) => `${r.collection}.${r.field.name}`),
    ).toEqual([
      "opportunities.clientDocId",
      "opportunities.residentDocId",
      "opportunityUpdates.opportunityDocId",
    ]);
  });

  test.each(referenceFields.map((r) => [`${r.collection}.${r.field.name}`, r]))(
    "%s opts out of cascade_delete and keeps async_reference",
    (_label, { field }) => {
      expect(field["cascade_delete"]).toBe(false);
      expect(field["async_reference"]).toBe(true);
    },
  );

  // Provisioning walks `schemas` in order, and Typesense rejects a collection
  // whose referenced collection does not exist yet.
  test.each(referenceFields.map((r) => [`${r.collection}.${r.field.name}`, r]))(
    "%s is declared after the collection it references",
    (_label, { collection, field }) => {
      const [target] = String(field["reference"]).split(".");
      const order = schemas.map((s) => s.name);

      expect(order.indexOf(target)).toBeGreaterThanOrEqual(0);
      expect(order.indexOf(target)).toBeLessThan(order.indexOf(collection));
    },
  );
});

// The scoped key is the security boundary, and it ships to the BROWSER — so
// these hold against a hostile query, not just the ones the frontend builds.
// Each failure below is silent: a wrong result set with no error.
describe("the opportunities key is safe by construction", () => {
  const compiled = SCOPES.flatMap(({ label, person }) =>
    REQUEST_SYSTEMS.map(({ systems }) => ({
      label,
      filters: new PersonFilterCompiler("US_XX").compile({
        supervision: systems.includes("SUPERVISION")
          ? person.SUPERVISION
          : undefined,
        incarceration: systems.includes("INCARCERATION")
          ? person.INCARCERATION
          : undefined,
      }),
    })),
  );

  // THE invariant. Typesense discards a key's JOIN clause when the query's
  // filter_by puts any join into a top-level OR — measured at 2,520 documents
  // returned where 420 was correct. A key with no join never enters that path.
  test("no minted key contains a join clause", () => {
    const withJoins = compiled.flatMap(({ label, filters }) =>
      Object.entries(filters)
        .filter(([, filterBy]) => filterBy.includes("$"))
        .map(([collection]) => `${collection} — ${label}`),
    );

    expect([...new Set(withJoins)]).toEqual([]);
  });

  // `locationId` holds a supervision district OR an incarceration facility, so
  // a clause without the discriminator would be a cross-system leak.
  test("every locationId clause is paired with a system clause", () => {
    const unpaired = compiled.flatMap(({ label, filters }) => {
      const filterBy = filters.opportunities;
      if (filterBy === undefined || !filterBy.includes("locationId:=")) {
        return [];
      }
      // Each system's predicate is wrapped as `(system:=X && (...))`, so every
      // locationId must sit inside such a group.
      const groups = [
        ...filterBy.matchAll(/\(system:=[^()]*&&\s*\(([^()]*)\)\)/g),
      ]
        .map((m) => m[1])
        .join(" ");
      const locationClauses = (filterBy.match(/locationId:=/g) ?? []).length;
      const pairedClauses = (groups.match(/locationId:=/g) ?? []).length;
      return locationClauses === pairedClauses
        ? []
        : [`${label} — ${filterBy}`];
    });

    expect([...new Set(unpaired)]).toEqual([]);
  });

  // A supervision-only user must not reach an incarceration document. The key
  // expresses that by OMITTING the system, not by leaving it unbounded.
  test("a single-system scope names only that system", () => {
    const supervisionOnly = new PersonFilterCompiler("US_XX").compile({
      supervision: { grants: [{ kind: "unrestricted" }] },
    }).opportunities;

    expect(supervisionOnly).toContain("system:=`SUPERVISION`");
    expect(supervisionOnly).not.toContain("INCARCERATION");
  });

  // Dropping a grant a collection cannot express must NARROW, never widen: an
  // empty clause list collapses to a never-match sentinel, not "no restriction".
  test("a scope with no expressible grant never compiles to unrestricted", () => {
    const unexpressible = new PersonFilterCompiler("US_XX").compile({
      incarceration: {
        grants: [{ kind: "byField", field: "district", ids: [] }],
      },
    });

    expect(unexpressible.residents).toContain("__no_match__");
    expect(unexpressible.opportunities).toContain("__no_match__");
  });
});

describe("the browser's collection boundary", () => {
  test("excludes opportunityUpdates, which only declares stateCode", () => {
    expect(BROWSER_SEARCHABLE_COLLECTIONS).not.toContain("opportunityUpdates");
  });

  test("names only real collections", () => {
    // An allowlist can go stale the other way too: a renamed or misspelled
    // entry would silently narrow the browser's reach and break a search.
    expect(
      BROWSER_SEARCHABLE_COLLECTIONS.filter(
        (name) => !collectionNames.includes(name),
      ),
    ).toEqual([]);
  });

  test("omits every collection the browser never queries", () => {
    expect(
      collectionNames.filter(
        (name) =>
          !(BROWSER_SEARCHABLE_COLLECTIONS as readonly string[]).includes(name),
      ),
    ).toEqual(["opportunityUpdates"]);
  });
});
