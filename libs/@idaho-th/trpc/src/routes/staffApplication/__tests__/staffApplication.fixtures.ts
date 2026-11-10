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
  AcceptedGenders,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  type ClosedOutcome,
  HomePlanInvestigationResult,
  HomePlanType,
  HousingApplicationDocumentType,
  type ParoleCommissionDecision,
  type Prisma,
  type PrismaClient,
  ReleaseDecision,
} from "~@idaho-th/prisma/client";
import type { EligibilityParams } from "~@idaho-th/shared";
import { splitPreferredProviders } from "~@idaho-th/trpc/routes/housing-common/preferredProviders.helpers";
import type { CreateHousingApplicationInput } from "~@idaho-th/trpc/routes/staffApplication/staffApplication.types";
import {
  createHousingApplicationDocument,
  createHousingApplicationHomePlan,
  seedApplicationWithProviders,
  type SeededApplicationProvider,
  TEST_DATES,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";

/**
 * A complete, valid intake form. Spread it and override only the fields a test
 * cares about — the eligibility-relevant defaults (district D3, male, rider,
 * no sex-offender or violence history) match TEST_PROVIDER_LOCATION.
 */
export const TEST_APPLICATION_FORM_DATA = {
  cmPoName: null,
  cmPoEmail: null,
  cmPoPhone: null,
  currentFacilityLocation: null,
  clientFullName: "Jane Doe",
  idocNumber: "123456",
  dob: null,
  age: null,
  ssnLast4: null,
  gender: "Male",
  personalPhoneNumber: null,
  emergencyContactName: null,
  emergencyContactRelationship: null,
  emergencyContactPhone: null,
  legalCurrentStatus: "Rider",
  legalMostRecentConviction: null,
  legalCountyOfCrime: null,
  legalSexOffenderRegistry: false,
  legalBackupForIcOrIce: null,
  childVisitationRequired: null,
  priorInvoluntaryDischarge: null,
  violenceHistoryDors: false,
  housingProbationParoleAtRelease: null,
  tpdHousingNeededDate: "2026-06-18",
  paroleHearingCompleted: null,
  vehicleOnSite: null,
  idsOnFile: [],
  militaryService: null,
  vaEnrolled: null,
  employmentOnRelease: null,
  employer: null,
  employerContact: null,
  medicalMhSupportNeeded: null,
  contagiousDisease: null,
  ssiSsdiSsrbMedicareMedicaid: null,
  benefitsReinstatementDate: null,
  benefitsDuration: null,
  prescribedMedications: null,
  addictions: null,
  substances: null,
  lastUseDate: null,
  underInfluenceAtCrime: null,
  faithBasedPreferred: false,
  previousTransitionalHome: null,
  previousHomeName: null,
  previousHomeCity: null,
  preferredDistrict: ["D3"],
  preferredProviders: [],
  signatureProvided: null,
  signatureDate: null,
  accommodations: [],
  otherAccommodations: null,
  accommodationsInfo: null,
  childFamilyServicesDocumentation: [],
  parentGuardianNames: null,
  child1Info: null,
  child2Info: null,
  child3Info: null,
  childVisitationInfo: null,
  violenceDischargeDescription: null,
  medicalAccommodations: [],
  otherMedicalAccommodation: null,
  additionalMedicalInfo: null,
  ssi90DayCarePlan: null,
  faithBasedProviderInfo: null,
} satisfies CreateHousingApplicationInput["formData"];

/** The params the server is expected to derive from TEST_APPLICATION_FORM_DATA. */
/** TEST_APPLICATION_FORM_DATA as stored: preferred providers live in their own table. */
export const TEST_STORED_FORM_DATA = splitPreferredProviders(
  TEST_APPLICATION_FORM_DATA,
).formData;

export const TEST_ELIGIBILITY_PARAMS = {
  preferredDistricts: ["D3"],
  gender: "Male",
  isRider: true,
  isSexOffender: false,
  faithBasedPreferred: false,
  preferredProviders: [],
} satisfies EligibilityParams;

/** The location the eligibility engine is expected to match for the defaults above. */
export const TEST_PROVIDER_LOCATION = {
  district: "D3",
  acceptedGenders: [AcceptedGenders.MALE],
  acceptsRiders: true,
  acceptsSexOffenders: false,
  acceptsViolentCriminals: false,
  faithBased: false,
} satisfies Partial<Prisma.HousingProviderLocationUncheckedCreateInput>;

/**
 * A bare stage keeps the factory defaults for sub-stage and status; the object
 * form is for tests that need an already-resolved provider application.
 */
type ProviderApplicationSeed =
  | ApplicationStage
  | {
      stage: ApplicationStage;
      subStage?: ApplicationSubStage;
      status?: ApplicationStatus;
    };

function toProviderSeed(seed: ProviderApplicationSeed) {
  return {
    location: TEST_PROVIDER_LOCATION,
    providerApplication: typeof seed === "string" ? { stage: seed } : seed,
  };
}

type SeededProviderApplication =
  SeededApplicationProvider["providerApplication"];

/**
 * Decisions that clear Approvals, for cases seeded past that stage. The default
 * form is a Rider's, so the release side is the court's probation decision.
 */
const CLEARED_APPROVALS = {
  releaseDecision: ReleaseDecision.PROBATION_GRANTED,
  homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
  approvalsAt: TEST_DATES.LAST_ACTIVITY,
  approvalsByStaffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
};

function seedHomePlan(
  prismaClient: PrismaClient,
  applicationId: string,
  kind: "provider" | "address",
  selected: SeededProviderApplication | undefined,
  approvalsCleared: boolean,
) {
  const approvals = approvalsCleared ? CLEARED_APPROVALS : {};

  if (kind === "address") {
    return createHousingApplicationHomePlan(prismaClient, {
      applicationId,
      ...approvals,
    });
  }

  if (selected == null) {
    throw new Error(
      "A provider home plan needs at least one providerApplicationStages entry",
    );
  }

  return createHousingApplicationHomePlan(prismaClient, {
    applicationId,
    type: HomePlanType.PROVIDER,
    address: null,
    selectedProviderId: selected.providerId,
    selectedProviderApplicationId: selected.id,
    ...approvals,
  });
}

type SeedStaffApplicationOptions = {
  staffPseudonymizedId?: string;
  stage?: ApplicationStage;
  subStage?: ApplicationSubStage;
  status?: ApplicationStatus;
  closedOutcome?: ClosedOutcome;
  /** Termer/PV only; a Rider's release decision lives on the home plan. */
  paroleCommissionDecision?: ParoleCommissionDecision;
  formData?: CreateHousingApplicationInput["formData"];
  lastActivityAt?: Date;
  /** One provider — with its own location and provider application — per entry listed. */
  providerApplicationStages?: ProviderApplicationSeed[];
  /**
   * "provider" points the home plan at the first seeded provider application;
   * "address" is a manual-address plan with no provider attached.
   */
  homePlan?: "provider" | "address";
  /** Records granted/approved decisions, so the case may advance to Release. */
  approvalsCleared?: boolean;
  withHandwrittenSourceDocument?: boolean;
  withDigitizedDocument?: boolean;
};

/** A staff-owned application, optionally with providers, a home plan, and a source PDF. */
export async function seedStaffApplication(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
    stage = ApplicationStage.APPLICATION,
    subStage = ApplicationSubStage.PROVIDER_REVIEW,
    status = ApplicationStatus.ACTION_NEEDED,
    closedOutcome,
    paroleCommissionDecision,
    formData = TEST_APPLICATION_FORM_DATA,
    lastActivityAt = TEST_DATES.LAST_ACTIVITY,
    providerApplicationStages = [],
    homePlan,
    approvalsCleared = false,
    withHandwrittenSourceDocument = false,
    withDigitizedDocument = false,
  }: SeedStaffApplicationOptions = {},
) {
  const {
    application,
    staffApplication,
    providers: seededProviders,
  } = await seedApplicationWithProviders(prismaClient, {
    application: {
      clientName: formData.clientFullName ?? "",
      idocNumber: formData.idocNumber,
      formData: formData as Prisma.InputJsonObject,
      lastActivityAt,
    },
    staffApplication: {
      staffPseudonymizedId,
      stage,
      subStage,
      status,
      closedOutcome,
      paroleCommissionDecision,
    },
    providers: providerApplicationStages.map(toProviderSeed),
  });

  const providerApplications = seededProviders.map(
    (seeded) => seeded.providerApplication,
  );

  return {
    application,
    staffApplication,
    providerApplications,
    homePlan: homePlan
      ? await seedHomePlan(
          prismaClient,
          application.id,
          homePlan,
          providerApplications[0],
          approvalsCleared,
        )
      : undefined,
    document: withHandwrittenSourceDocument
      ? await createHousingApplicationDocument(prismaClient, {
          applicationId: application.id,
        })
      : undefined,
    digitizedDocument: withDigitizedDocument
      ? await createHousingApplicationDocument(prismaClient, {
          applicationId: application.id,
          documentType: HousingApplicationDocumentType.DIGITIZED,
          fileName: "digitized.pdf",
          objectKey: `applications/digitized/${application.id}.pdf`,
        })
      : undefined,
  };
}
