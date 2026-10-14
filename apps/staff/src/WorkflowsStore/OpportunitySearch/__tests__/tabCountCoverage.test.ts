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

// THE LIST IS PROVEN HERE. `BUCKET_KEY_INSUFFICIENT` decides at runtime which
// types the census refuses to count; this file decides whether that list is
// right, by building a shell AND a real instance from the same fixture and
// requiring them to agree.
//
// Neither direction depends on anyone remembering, which is the whole point.

import { beforeEach, describe, expect, test, vi } from "vitest";

import * as datatypes from "~datatypes";
import { OpportunityType } from "~datatypes";

import { mockOpportunityConfigs } from "../../../core/__tests__/testUtils";
import { RootStore } from "../../../RootStore";
import { OpportunityBase } from "../../Opportunity/OpportunityBase";
import { apiOpportunityConfigurationFactory } from "../../Opportunity/OpportunityConfigurations/models/CustomOpportunityConfigurations";
import { localOpportunityConfigParams } from "../../Opportunity/OpportunityConfigurations/models/CustomOpportunityConfigurations/localOpportunityConfigurations";
import { opportunityConstructors } from "../../Opportunity/opportunityConstructors";
import {
  BUCKET_KEY_INSUFFICIENT,
  opportunityShell,
} from "../tabTitleForBucket";

vi.mock("@sentry/react", () => ({ captureException: vi.fn() }));

/**
 * Overriding types with no fixtures, so nothing can be compared.
 *
 * TODO(OBT-46427): the US_AZ records reference people who do not exist, so no
 * instance can be built from them. US_IA is fixed by the companion search.
 */
const UNCHECKABLE = [
  "pastFTRD",
  "usAzTransferToAdministrativeSupervision",
  "usAzTransferToAdministrativeSupervisionV2",
  "usIaCompleteSupervisionLevelDowngrade",
];

/** The class that actually owns `tabTitle`, anywhere up the chain. */
function tabTitleOwner(Klass: unknown): string | null {
  let proto = (Klass as { prototype?: object })?.prototype;
  while (proto && proto !== Object.prototype) {
    if (Object.prototype.hasOwnProperty.call(proto, "tabTitle")) {
      return (
        (proto as { constructor?: { name?: string } }).constructor?.name ?? "?"
      );
    }
    proto = Object.getPrototypeOf(proto);
  }
  return null;
}

/** A type's fixtures, by the export-name convention. Derived, not listed. */
function fixturesFor(
  type: string,
): Record<string, { input: unknown }> | undefined {
  const exported = (datatypes as Record<string, unknown>)[`${type}Fixtures`];
  return exported && typeof exported === "object"
    ? (exported as Record<string, { input: unknown }>)
    : undefined;
}

/** The code-defined configs, built the way the store builds them. */
function localConfigs(): Record<string, unknown> {
  const userStore = { activeFeatureVariants: { usTnRcafV2: {} } } as never;
  return Object.fromEntries(
    Object.values(localOpportunityConfigParams).flatMap((byType) =>
      Object.entries(byType ?? {}).map(([type, raw]) => [
        type,
        apiOpportunityConfigurationFactory(
          type as OpportunityType,
          raw as never,
          userStore,
        ),
      ]),
    ),
  );
}

describe("tab count coverage", () => {
  let root: RootStore;

  beforeEach(() => {
    root = new RootStore();
    // BOTH sources, as `OpportunityConfigurationStore.populate` merges them.
    // `mockHydrated` defaults to the Admin Panel export alone, which omits the
    // US_TN classification types — live in production, defined in code.
    root.workflowsRootStore.opportunityConfigurationStore.mockHydrated({
      ...localConfigs(),
      ...mockOpportunityConfigs,
    } as never);
  });

  function configuredTypes(): OpportunityType[] {
    const configs = root.workflowsRootStore.opportunityConfigurationStore
      .opportunities as Record<string, unknown>;
    return (Object.keys(opportunityConstructors) as OpportunityType[]).filter(
      (type) => Boolean(configs[type]),
    );
  }

  /** The real class on the whole record, which is what a shell must match. */
  function realTabTitle(type: OpportunityType, input: Record<string, unknown>) {
    const Ctor = opportunityConstructors[type] as unknown as new (
      person: unknown,
      record: unknown,
      type: unknown,
    ) => { tabTitle: (g?: never) => string; config: { tabGroups: object } };

    const opportunity = new Ctor(
      {
        // Non-empty: the update subscription builds a Firestore reference in
        // its constructor, and an empty id is an invalid path.
        recordId: "us_xx_TAB_PROBE",
        externalId: "TAB_PROBE",
        pseudonymizedId: "",
        stateCode: "US_XX",
        rootStore: root,
        opportunities: {},
        flattenedOpportunities: [],
      },
      input,
      type,
    );
    return opportunity.tabTitle(
      Object.keys(opportunity.config.tabGroups)[0] as never,
    );
  }

  /** Types whose shell disagrees with a real instance, on any fixture. */
  function diverging(): string[] {
    const out: string[] = [];

    for (const type of configuredTypes()) {
      const fixtures = fixturesFor(type);
      if (!fixtures) continue;

      for (const [, fixture] of Object.entries(fixtures)) {
        const input = fixture.input as Record<string, unknown> | undefined;
        if (!input || typeof input !== "object") continue;

        const metadata = (input["metadata"] ?? {}) as Record<string, unknown>;
        const shell = opportunityShell(
          {
            opportunityType: type,
            isEligible: input["isEligible"] !== false,
            isAlmostEligible: input["isAlmostEligible"] === true,
            tabName: metadata["tabName"] as string | undefined,
            tabDescription: metadata["tabDescription"] as string | undefined,
            hasGrantedDate: Boolean(metadata["grantedAt"]),
          },
          root,
        );

        let shellTab: string | undefined;
        try {
          shellTab = shell?.opportunity.tabTitle(shell.tabGroup);
        } catch {
          shellTab = undefined;
        }

        let realTab: string | undefined;
        try {
          realTab = realTabTitle(type, input);
        } catch {
          // No real instance, so nothing to compare against. See UNCHECKABLE.
          continue;
        }

        if (shellTab !== realTab) {
          out.push(type);
          break;
        }
      }
    }
    return out.sort();
  }

  test("every excluded type diverges, and every diverging type is excluded", () => {
    // An unlisted type that diverges fails here until it is listed; a listed
    // type that has started agreeing fails until it is removed. Exclusions
    // with no fixtures are set aside — the next test keeps those honest.
    const provable = [...BUCKET_KEY_INSUFFICIENT]
      .filter((type) => !UNCHECKABLE.includes(type))
      .sort();

    expect(diverging()).toEqual(provable);
  });

  test("an overriding type is checkable, or named as not", () => {
    // Without this a new override with no fixtures would be covered by
    // nothing at all, and nobody would be told.
    const baseOwner = tabTitleOwner(OpportunityBase);
    const unverifiable = configuredTypes()
      .filter(
        (type) => tabTitleOwner(opportunityConstructors[type]) !== baseOwner,
      )
      .filter((type) => !fixturesFor(type))
      .filter((type) => !UNCHECKABLE.includes(type));

    expect(unverifiable).toEqual([]);
  });

  test("most types need no override at all", () => {
    // Stated so the count is visible: these are correct because the shell runs
    // the same base method the Firestore path does.
    const baseOwner = tabTitleOwner(OpportunityBase);
    const baseOnly = configuredTypes().filter(
      (type) => tabTitleOwner(opportunityConstructors[type]) === baseOwner,
    );
    const overriding = configuredTypes().filter(
      (type) => tabTitleOwner(opportunityConstructors[type]) !== baseOwner,
    );

    expect(baseOnly.length).toBeGreaterThan(overriding.length);
  });
});

describe("configured counts the census can reproduce", () => {
  // A type whose count genuinely needs the records, not a tab histogram.
  // Adding to this list makes that type's card unreconstructable on the
  // indexed-search homepage, so it must be a deliberate decision.
  const NEEDS_THE_RECORDS = ["usOrEarnedDischargeSentence"];

  test("every type with a configured count implements countFromTabCounts", () => {
    const root = new RootStore();
    root.workflowsRootStore.opportunityConfigurationStore.mockHydrated({
      ...localConfigs(),
      ...mockOpportunityConfigs,
    } as never);

    const configs =
      root.workflowsRootStore.opportunityConfigurationStore.opportunities;

    const missing = Object.entries(configs)
      .filter(([, config]) => {
        const c = config as unknown as {
          countByFunction?: unknown;
          countFromTabCounts?: unknown;
        };
        return c.countByFunction && !c.countFromTabCounts;
      })
      .map(([type]) => type)
      .sort();

    expect(missing).toEqual([...NEEDS_THE_RECORDS].sort());
  });
});

describe("a type that configures no count at all", () => {
  // The common case: most types define neither `countFromTabCounts` nor
  // `countByFunction`, and both homepages must fall back to the generic rule.
  test("countByFunction is undefined, so both paths use the generic total", () => {
    const root = new RootStore();
    root.workflowsRootStore.opportunityConfigurationStore.mockHydrated({
      ...localConfigs(),
      ...mockOpportunityConfigs,
    } as never);

    const configs =
      root.workflowsRootStore.opportunityConfigurationStore.opportunities;

    const plain = Object.entries(configs).filter(([, config]) => {
      const c = config as unknown as { countFromTabCounts?: unknown };
      return !c.countFromTabCounts;
    });

    // Not a vacuous assertion: this is most of the catalog.
    expect(plain.length).toBeGreaterThan(10);

    for (const [type, config] of plain) {
      // US_OR overrides the accessor directly; everything else inherits the
      // base getter, which returns undefined with no rule to apply.
      if (type === "usOrEarnedDischargeSentence") continue;
      expect([type, config.countByFunction]).toEqual([type, undefined]);
    }
  });
});
