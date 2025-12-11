// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Opportunities } from "../../api";
import {
  CaseDetailsFixture,
  StaffInfoFixture,
} from "../../api/offlineFixtures";
import { PSIStore } from "../../datastores/PSIStore";
import { SentencingStore } from "../../datastores/SentencingStore";
import { createMockSentencingStore } from "../../utils/test";
import { CaseDetailsPresenter } from "../CaseDetailsPresenter";

const caseId = Object.keys(CaseDetailsFixture)[0];
let sentencingStore: SentencingStore;
let presenter: CaseDetailsPresenter;

beforeEach(() => {
  sentencingStore = createMockSentencingStore();
  presenter = new CaseDetailsPresenter(sentencingStore.PSIStore, caseId);

  vi.spyOn(sentencingStore.staffStore, "loadStaffInfo");
  vi.spyOn(sentencingStore.apiClient, "getCaseDetails").mockResolvedValue(
    CaseDetailsFixture[caseId],
  );
  vi.spyOn(sentencingStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("hydration states", async () => {
  vi.spyOn(sentencingStore.PSIStore, "loadCaseDetails");
  expect(presenter.hydrationState).toEqual({ status: "needs hydration" });

  const hydrationPromise = presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "loading" });

  await hydrationPromise;

  expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  expect(sentencingStore.PSIStore.loadCaseDetails).toHaveBeenCalled();
  expect(sentencingStore.PSIStore.caseDetailsById[caseId]).toBeDefined();
});

test("hydration error", async () => {
  const error = new Error("Something went wrong");
  vi.spyOn(PSIStore.prototype, "loadCaseDetails").mockImplementation(() => {
    throw error;
  });

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "failed", error });
});

test("no redundant hydration while in progress", async () => {
  vi.spyOn(sentencingStore.PSIStore, "loadCaseDetails");

  const firstHydrationCall = presenter.hydrate();
  const secondHydrationCall = presenter.hydrate();

  await Promise.all([firstHydrationCall, secondHydrationCall]);
  expect(sentencingStore.PSIStore.loadCaseDetails).toHaveBeenCalledTimes(1);
});

test("no hydration if already hydrated", async () => {
  vi.spyOn(sentencingStore.PSIStore, "loadCaseDetails");

  await presenter.hydrate();
  expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  presenter.hydrate();

  expect(sentencingStore.PSIStore.loadCaseDetails).toHaveBeenCalledTimes(1);
});

test("activeEligibleCommunityOpportunities filters out inactive opportunities", async () => {
  const communityOpportunities = [
    {
      opportunityName: "Active Opportunity 1",
      description: "",
      providerName: null,
      providerPhoneNumber: "",
      providerWebsite: "",
      providerAddress: "",
      minAge: 18,
      maxAge: 65,
      developmentalDisabilityDiagnosisCriterion: false,
      noCurrentOrPriorSexOffenseCriterion: false,
      noCurrentOrPriorViolentOffenseCriterion: false,
      noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
      priorCriminalHistoryCriterion: null,
      entryOfGuiltyPleaCriterion: false,
      veteranStatusCriterion: false,
      diagnosedMentalHealthDiagnosisCriterion: [],
      diagnosedSubstanceUseDisorderCriterion: null,
      asamLevelOfCareRecommendationCriterion: null,
      needsAddressed: [],
      minLsirScoreCriterion: null,
      maxLsirScoreCriterion: null,
      district: "D1",
      lastUpdatedAt: new Date(),
      additionalNotes: null,
      genders: [],
      genericDescription: null,
      counties: [],
      active: true,
      source: "internal",
    },
    {
      opportunityName: "Inactive Opportunity 2",
      description: "",
      providerName: null,
      providerPhoneNumber: "",
      providerWebsite: "",
      providerAddress: "",
      minAge: 18,
      maxAge: 65,
      developmentalDisabilityDiagnosisCriterion: false,
      noCurrentOrPriorSexOffenseCriterion: false,
      noCurrentOrPriorViolentOffenseCriterion: false,
      noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
      priorCriminalHistoryCriterion: null,
      entryOfGuiltyPleaCriterion: false,
      veteranStatusCriterion: false,
      diagnosedMentalHealthDiagnosisCriterion: [],
      diagnosedSubstanceUseDisorderCriterion: null,
      asamLevelOfCareRecommendationCriterion: null,
      needsAddressed: [],
      minLsirScoreCriterion: null,
      maxLsirScoreCriterion: null,
      district: "D1",
      lastUpdatedAt: new Date(),
      additionalNotes: null,
      genders: [],
      genericDescription: null,
      counties: [],
      active: false,
      source: "internal",
    },
  ] satisfies Opportunities;
  sentencingStore.PSIStore.communityOpportunities = communityOpportunities;

  await presenter.hydrate();

  expect(presenter.activeEligibleCommunityOpportunities.length).toBe(1);
  expect(
    presenter.activeEligibleCommunityOpportunities[0].opportunityName,
  ).toBe("Active Opportunity 1");
  expect(presenter.activeEligibleCommunityOpportunities).toContainEqual(
    communityOpportunities.find((opp) => opp.active),
  );
  expect(presenter.activeEligibleCommunityOpportunities).not.toContainEqual(
    communityOpportunities.find((opp) => !opp.active),
  );
});
