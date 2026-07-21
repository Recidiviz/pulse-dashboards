// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import UserStore from "../../../../RootStore/UserStore";
import { IApiOpportunityConfiguration } from "../interfaces";
import { ApiOpportunityConfiguration } from "../models/ApiOpportunityConfigurationImpl";
import { UsIaEarlyDischargeConfiguration } from "../models/CustomOpportunityConfigurations/UsIa/UsIaEarlyDischargeConfiguration";
import { UsMiEarlyDischargeConfiguration } from "../models/CustomOpportunityConfigurations/UsMi/UsMiEarlyDischargeConfiguration";
import { UsMiMinimumTelephoneReportingConfiguration } from "../models/CustomOpportunityConfigurations/UsMi/UsMiMinimumTelephoneReporting";
import { UsUtEarlyTerminationConfiguration } from "../models/CustomOpportunityConfigurations/UsUt/UsUtEarlyTerminationConfiguration";

describe("maxSnoozeDaysByDenialReasons", () => {
  const userStore = new UserStore({});
  let oppConfig: ApiOpportunityConfiguration;

  test("Maps reasons to snooze config max", () => {
    const mockConfigObject = {
      snooze: { maxSnoozeDays: 90 },
      denialReasons: {
        "REASON 1": "Reason copy 1",
        "REASON 2": "Reason copy 2",
      },
    } as unknown as IApiOpportunityConfiguration;
    oppConfig = new ApiOpportunityConfiguration(mockConfigObject, userStore);
    expect(oppConfig.maxSnoozeDaysByDenialReason).toBeDefined();
    expect(oppConfig.maxSnoozeDaysByDenialReason["REASON 1"]).toEqual(90);
    expect(oppConfig.maxSnoozeDaysByDenialReason["REASON 2"]).toEqual(90);
  });

  test("Empty when no manual snooze config is present", () => {
    const mockConfigObject = {
      snooze: { autoSnoozeParams: {} },
    } as unknown as IApiOpportunityConfiguration;
    oppConfig = new ApiOpportunityConfiguration(mockConfigObject, userStore);

    expect(oppConfig.maxSnoozeDaysByDenialReason).toBeEmpty();
  });
});

describe("indefiniteDenialReasons", () => {
  const userStore = new UserStore({});
  let oppConfig: ApiOpportunityConfiguration;

  test("Empty when no reasons are marked indefinite", () => {
    const mockConfigObject = {
      snooze: { maxSnoozeDays: 90 },
      denialReasons: {
        "REASON 1": "Reason copy 1",
        "REASON 2": "Reason copy 2",
      },
    } as unknown as IApiOpportunityConfiguration;
    oppConfig = new ApiOpportunityConfiguration(mockConfigObject, userStore);
    expect(oppConfig.indefiniteDenialReasons).toBeEmpty();
  });

  test("Pulls indefinite reasons from the maxSnoozeDaysByDenialReasons mapping", () => {
    const mockConfigObject = {
      snooze: { maxSnoozeDays: 90 },
      denialReasons: {
        "REASON 1": "Reason copy 1",
        "REASON 2": "Reason copy 2",
      },
    } as unknown as IApiOpportunityConfiguration;
    oppConfig = new ApiOpportunityConfiguration(mockConfigObject, userStore);
    vi.spyOn(oppConfig, "maxSnoozeDaysByDenialReason", "get").mockReturnValue({
      "REASON 1": 90,
      "REASON 2": undefined,
    });

    expect(oppConfig.indefiniteDenialReasons).toEqual({
      "REASON 2": "Reason copy 2",
    });
  });
});

describe("supportsSupervisorReviewOnSnooze", () => {
  const userStore = new UserStore({});

  test("Reflects the config flag on the base configuration, even when reasons require approval", () => {
    const mockConfigObject = {} as unknown as IApiOpportunityConfiguration;
    const oppConfig = new ApiOpportunityConfiguration(
      mockConfigObject,
      userStore,
    );
    vi.spyOn(oppConfig, "reasonsRequiringApproval", "get").mockReturnValue([
      "REASON 1",
    ]);

    expect(oppConfig.supportsSupervisorReviewOnSnooze).toBeFalsy();
  });

  // Custom configs that override supportsSupervisorReviewOnSnooze to derive it from reasonsRequiringApproval.
  // UsMi custom config overrides only provide reasonsRequiringApproval if indefiniteSnooze is an active FV
  const reviewerUserStore = {
    activeFeatureVariants: { indefiniteSnooze: {} },
  } as UserStore;
  describe.each([
    UsIaEarlyDischargeConfiguration,
    UsMiEarlyDischargeConfiguration,
    UsMiMinimumTelephoneReportingConfiguration,
    UsUtEarlyTerminationConfiguration,
  ])("$name", (Config) => {
    test("True when its own reasons require approval, even if the config flag is unset", () => {
      const mockConfigObject = {} as unknown as IApiOpportunityConfiguration;
      const oppConfig = new Config(mockConfigObject, reviewerUserStore);

      expect(oppConfig.supportsSupervisorReviewOnSnooze).toBeTrue();
    });
  });
});
