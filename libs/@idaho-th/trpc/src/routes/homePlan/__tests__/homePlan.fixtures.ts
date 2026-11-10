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
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  HomePlanInvestigationResult,
  HomePlanType,
  type HousingProvider,
  ParoleCommissionDecision,
  type PrismaClient,
  type ReleaseDecision,
} from "~@idaho-th/prisma/client";
import { buildInitialReleaseTaskRows } from "~@idaho-th/trpc/routes/homePlan/homePlan.progression";
import {
  createHousingApplicationHomePlan,
  createHousingProvider,
  createHousingProviderLocation,
  createProviderHousingApplication,
  seedApplicationWithProviders,
  seedProviderUserWithHousingProviders,
  TEST_DATES,
  TEST_STAFF_PSEUDONYMIZED_ID,
  uniqueId,
} from "~@idaho-th/trpc/test/factories";

export const TEST_HOME_PLAN_ADDRESS = "123 Example St, Boise, ID 12345, USA";
/** The selected provider's email, asserted by the home plan reads. */
export const TEST_PROVIDER_EMAIL = "abc@example.com";
/** The organization name the home plan reads assert on. */
export const TEST_HOUSING_PROVIDER_NAME = "ABC Housing";

/** When the CM's two approvals decisions reached a terminal state. */
export const TEST_APPROVALS_AT = new Date("2026-06-12T01:00:00.000Z");

export type ProviderSeed = {
  /**
   * An existing organization to match the application to — normally one
   * `seedProviderUserWithHousingProviders` created for the caller. Left out, a
   * fresh organization is seeded, which is what a staff-side test wants.
   */
  providerId?: string;
  /** Ignored when `providerId` names an organization that already exists. */
  name?: string;
  stage?: ApplicationStage;
  subStage?: ApplicationSubStage;
  status?: ApplicationStatus;
};

/** A provider that has conditionally approved and can be accepted as the plan. */
export const CONDITIONALLY_APPROVED_PROVIDER: ProviderSeed = {
  name: TEST_HOUSING_PROVIDER_NAME,
  subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
};

/**
 * The single organization `providerCaller()` resolves to, with the person and
 * the assignment behind it. Named so a read can assert on it.
 */
export async function seedActiveHousingProvider(
  prismaClient: PrismaClient,
): Promise<HousingProvider> {
  const { housingProviders } = await seedProviderUserWithHousingProviders(
    prismaClient,
    { housingProviders: [{ name: TEST_HOUSING_PROVIDER_NAME }] },
  );
  return housingProviders[0];
}

type SeededProvider = {
  provider: HousingProvider;
  providerApplication: { id: string; providerId: string };
};

/** Matches one organization to the application, creating it if the seed has none. */
async function seedApplicationMatch(
  prismaClient: PrismaClient,
  applicationId: string,
  {
    providerId,
    name = uniqueId("Sunrise House"),
    stage = ApplicationStage.APPLICATION,
    subStage = ApplicationSubStage.PROVIDER_REVIEW,
    status = ApplicationStatus.ACTION_NEEDED,
  }: ProviderSeed,
): Promise<SeededProvider> {
  const provider =
    providerId == null
      ? await createHousingProvider(prismaClient, { name })
      : await prismaClient.housingProvider.findUniqueOrThrow({
          where: { id: providerId },
        });

  const providerLocation = await createHousingProviderLocation(prismaClient, {
    providerId: provider.id,
  });

  return {
    provider,
    providerApplication: await createProviderHousingApplication(prismaClient, {
      applicationId,
      providerId: provider.id,
      providerLocationId: providerLocation.id,
      stage,
      subStage,
      status,
    }),
  };
}

export type HomePlanSeed = {
  type?: HomePlanType;
  /** Which seeded provider the plan points at. PROVIDER plans only. */
  selectedProviderIndex?: number;
  address?: string | null;
  releaseDecision?: ReleaseDecision;
  homePlanInvestigation?: HomePlanInvestigationResult;
  /** Stamped only once the approvals reach a terminal state. */
  approvalsAt?: Date;
  /** The ORDERED_RELEASE_TASK_TYPES rows a real home plan is created with. */
  withReleaseTasks?: boolean;
};

/** The release-flow cohort and the Termer/PV decision on the staff row. */
type ReleaseFlowSeed = {
  /** Q6. Left out, the form has none, which counts as Termer/PV. */
  legalCurrentStatus?: string;
  paroleCommissionDecision?: ParoleCommissionDecision;
};

type SeedHomePlanApplicationOptions = ReleaseFlowSeed & {
  staffPseudonymizedId?: string;
  stage?: ApplicationStage;
  subStage?: ApplicationSubStage;
  sentToProvidersAt?: Date | null;
  /** One organization — with its own location and match — per entry. */
  providers?: ProviderSeed[];
  homePlan?: HomePlanSeed;
};

function seedHomePlan(
  prismaClient: PrismaClient,
  applicationId: string,
  {
    type = HomePlanType.PROVIDER,
    selectedProviderIndex = 0,
    address,
    releaseDecision,
    homePlanInvestigation,
    approvalsAt,
    withReleaseTasks = true,
  }: HomePlanSeed,
  seededProviders: SeededProvider[],
) {
  const isProviderPlan = type === HomePlanType.PROVIDER;
  const selected = seededProviders[selectedProviderIndex];

  if (isProviderPlan && selected == null) {
    throw new Error("A provider home plan needs at least one seeded provider");
  }

  return createHousingApplicationHomePlan(prismaClient, {
    applicationId,
    type,
    address: isProviderPlan
      ? address ?? null
      : address ?? TEST_HOME_PLAN_ADDRESS,
    ...(isProviderPlan && selected
      ? {
          selectedProviderId: selected.provider.id,
          selectedProviderApplicationId: selected.providerApplication.id,
        }
      : {}),
    ...(releaseDecision ? { releaseDecision } : {}),
    ...(homePlanInvestigation ? { homePlanInvestigation } : {}),
    ...(approvalsAt
      ? {
          approvalsAt,
          approvalsByStaffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        }
      : {}),
    ...(withReleaseTasks
      ? { releaseTasks: { create: buildInitialReleaseTaskRows() } }
      : {}),
  });
}

/**
 * A staff-owned application matched to any number of organizations, with an
 * optional home plan, seeded the way the home plan services expect to find it.
 */
export async function seedHomePlanApplication(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
    stage = ApplicationStage.APPLICATION,
    subStage = ApplicationSubStage.PROVIDER_REVIEW,
    sentToProvidersAt = TEST_DATES.SENT_TO_PROVIDERS,
    providers = [],
    homePlan,
    legalCurrentStatus,
    paroleCommissionDecision,
  }: SeedHomePlanApplicationOptions = {},
) {
  const { application, staffApplication } = await seedApplicationWithProviders(
    prismaClient,
    {
      application: {
        sentToProvidersAt,
        // Deliberately stale so a test can prove a home plan write bumped it.
        lastActivityAt: TEST_DATES.LAST_ACTIVITY,
        formData: legalCurrentStatus == null ? {} : { legalCurrentStatus },
      },
      staffApplication: {
        staffPseudonymizedId,
        stage,
        subStage,
        paroleCommissionDecision,
      },
    },
  );

  // Promise.all keeps the results in the order the test asked for.
  const seededProviders = await Promise.all(
    providers.map((seed) =>
      seedApplicationMatch(prismaClient, application.id, seed),
    ),
  );

  return {
    application,
    staffApplication,
    providers: seededProviders.map((seeded) => seeded.provider),
    providerApplications: seededProviders.map(
      (seeded) => seeded.providerApplication,
    ),
    homePlan: homePlan
      ? await seedHomePlan(
          prismaClient,
          application.id,
          homePlan,
          seededProviders,
        )
      : undefined,
  };
}

/**
 * `providerId` is the organization the plan selects — pass the one the caller
 * is acting as whenever the test is about a provider. Left out, the fixture
 * seeds an organization of its own, which is all a staff-side test needs.
 */
type SelectedHousingProviderOption = { providerId?: string };

/**
 * A provider home plan waiting on the CM's two approvals decisions. The
 * selected organization is returned first in `providers`.
 */
export function seedApprovalsStageApplication(
  prismaClient: PrismaClient,
  {
    providerId,
    homePlan = {},
    ...releaseFlow
  }: SelectedHousingProviderOption &
    ReleaseFlowSeed & { homePlan?: HomePlanSeed } = {},
) {
  return seedHomePlanApplication(prismaClient, {
    ...releaseFlow,
    stage: ApplicationStage.APPROVALS,
    subStage: ApplicationSubStage.OFFERS_RECEIVED,
    providers: [
      {
        ...CONDITIONALLY_APPROVED_PROVIDER,
        ...(providerId == null ? {} : { providerId }),
        stage: ApplicationStage.APPROVALS,
        subStage: ApplicationSubStage.SELECTED,
      },
    ],
    homePlan,
  });
}

/**
 * An approved provider home plan sitting in the Release stage. The selected
 * organization is returned first in `providers`.
 */
export function seedReleaseStageApplication(
  prismaClient: PrismaClient,
  {
    providerId,
    extraProviders = [],
  }: SelectedHousingProviderOption & { extraProviders?: ProviderSeed[] } = {},
) {
  return seedHomePlanApplication(prismaClient, {
    stage: ApplicationStage.RELEASE,
    providers: [
      {
        ...CONDITIONALLY_APPROVED_PROVIDER,
        ...(providerId == null ? {} : { providerId }),
        stage: ApplicationStage.RELEASE,
        subStage: ApplicationSubStage.SELECTED,
      },
      ...extraProviders,
    ],
    // A Termer/PV case (no Q6), so the release side is on the staff row.
    paroleCommissionDecision: ParoleCommissionDecision.PAROLE_GRANTED,
    homePlan: {
      homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
      approvalsAt: TEST_APPROVALS_AT,
    },
  });
}
