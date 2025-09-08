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

import UserStore from "../../../../../../RootStore/UserStore";
import { IApiOpportunityConfiguration } from "../../../interfaces";
import { UsIaEarlyDischargeConfiguration } from "./UsIaEarlyDischargeConfiguration";

describe("maxSnoozeDaysByDenialReasons", () => {
  const userStore = new UserStore({});
  let oppConfig: UsIaEarlyDischargeConfiguration;
  let mockConfigObject: IApiOpportunityConfiguration;
  beforeEach(() => {
    mockConfigObject = {
      snooze: { maxSnoozeDays: 90 },
      denialReasons: {
        "FINES & FEES": "Has unpaid court fees or restitution",
        PENDING: "Has pending criminal charges",
        PROGRAMMING: "Has not completed mandated interventions/programming",
        SPECIAL: "Is not compliant with special conditions",
        "PUBLIC SAFETY": "Poses a public safety risk",
        COURT: "Is excluded from early discharge via court order",
        DENIED:
          "Has recently been denied early discharge by court or county attorney",
        VIOLATIONS:
          "Has recently incurred serious violations or has pending violation reports",
        "INTERSTATE (IC-IN)":
          "Is serving an ICOTS case and sentencing state did not approve early discharge",
        "INTERSTATE (IC-OUT)":
          "Is serving an ICOTS case and supervising state has not provided progress report or other necessary information",
      },
    } as unknown as IApiOpportunityConfiguration;
    oppConfig = new UsIaEarlyDischargeConfiguration(
      mockConfigObject,
      userStore,
    );
  });

  test("Maps reasons that aren't overridden to snooze config max", () => {
    const defaultSnoozeReasons = [
      "PENDING",
      "PROGRAMMING",
      "SPECIAL",
      "PUBLIC SAFETY",
      "VIOLATIONS",
    ];
    expect(oppConfig.maxSnoozeDaysByDenialReason).toBeDefined();
    defaultSnoozeReasons.forEach((reason) =>
      expect(oppConfig.maxSnoozeDaysByDenialReason[reason]).toEqual(90),
    );
  });

  test("Maps reasons that have extended snooze lengths to the correct values", () => {
    const defaultSnoozeReasons = [
      "DENIED",
      "INTERSTATE (IC-OUT)",
      "FINES & FEES",
    ];
    expect(oppConfig.maxSnoozeDaysByDenialReason).toBeDefined();
    defaultSnoozeReasons.forEach((reason) =>
      expect(oppConfig.maxSnoozeDaysByDenialReason[reason]).toEqual(365),
    );
  });

  test("Maps indefinite reasons to undefined when FV is set", () => {
    oppConfig = new UsIaEarlyDischargeConfiguration(mockConfigObject, {
      activeFeatureVariants: { indefiniteSnooze: {} },
    } as UserStore);
    const indefiniteSnoozeReasons = ["COURT", "INTERSTATE (IC-IN)"];
    expect(oppConfig.maxSnoozeDaysByDenialReason).toBeDefined();
    indefiniteSnoozeReasons.forEach((reason) =>
      expect(oppConfig.maxSnoozeDaysByDenialReason[reason]).toEqual(undefined),
    );
  });

  test("Doesn't map indefinite reasons to undefined when FV is not set", () => {
    const indefiniteSnoozeReasons = ["COURT", "INTERSTATE (IC-IN)"];
    expect(oppConfig.maxSnoozeDaysByDenialReason).toBeDefined();
    indefiniteSnoozeReasons.forEach((reason) =>
      expect(oppConfig.maxSnoozeDaysByDenialReason[reason]).toEqual(90),
    );
  });
});

describe("indefiniteDenialReasons", () => {
  const userStore = new UserStore({});
  let oppConfig: UsIaEarlyDischargeConfiguration;
  let mockConfigObject: IApiOpportunityConfiguration;
  beforeEach(() => {
    mockConfigObject = {
      snooze: { maxSnoozeDays: 90 },
      denialReasons: {
        "FINES & FEES": "Has unpaid court fees or restitution",
        PENDING: "Has pending criminal charges",
        PROGRAMMING: "Has not completed mandated interventions/programming",
        SPECIAL: "Is not compliant with special conditions",
        "PUBLIC SAFETY": "Poses a public safety risk",
        COURT: "Is excluded from early discharge via court order",
        DENIED:
          "Has recently been denied early discharge by court or county attorney",
        VIOLATIONS:
          "Has recently incurred serious violations or has pending violation reports",
        "INTERSTATE (IC-IN)":
          "Is serving an ICOTS case and sentencing state did not approve early discharge",
        "INTERSTATE (IC-OUT)":
          "Is serving an ICOTS case and supervising state has not provided progress report or other necessary information",
      },
    } as unknown as IApiOpportunityConfiguration;
    oppConfig = new UsIaEarlyDischargeConfiguration(
      mockConfigObject,
      userStore,
    );
  });

  test("Empty when FV is turned off", () => {
    expect(oppConfig.indefiniteDenialReasons).toEqual({});
  });

  test("Contains indefinite reasons and relevant copy when FV is on", () => {
    oppConfig = new UsIaEarlyDischargeConfiguration(mockConfigObject, {
      activeFeatureVariants: { indefiniteSnooze: {} },
    } as UserStore);
    const indefiniteSnoozeReasons = ["COURT", "INTERSTATE (IC-IN)"];
    indefiniteSnoozeReasons.forEach((reason) => {
      expect(oppConfig.indefiniteDenialReasons).toContainKey(reason);
      expect(oppConfig.indefiniteDenialReasons[reason]).toBeDefined();
      expect(oppConfig.indefiniteDenialReasons[reason]).toEqual(
        oppConfig.denialReasons[reason],
      );
    });
  });
});
