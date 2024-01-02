// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { add, parseISO, sub } from "date-fns";

import { StaffFilter } from "../../core/models/types";
import { CombinedUserRecord, StaffRecord } from "../../FirestoreStore/types";
import {
  INCARCERATION_OPPORTUNITY_TYPES,
  IncarcerationOpportunityType,
  OPPORTUNITY_CONFIGS,
  SUPERVISION_OPPORTUNITY_TYPES,
  SupervisionOpportunityType,
} from "../Opportunity/OpportunityConfigs";
import {
  filterByUserDistrict,
  fractionalDateBetweenTwoDates,
  getSnoozeUntilDate,
  getSystemIdFromOpportunityType,
  snoozeUntilDateInTheFuture,
  staffNameComparator,
  usCaFilterByRoleSubtype,
} from "../utils";

test("staffNameComparator", () => {
  const sortableStaff: StaffRecord[] = [
    {
      id: "1",
      stateCode: "us_xx",
      email: null,
      hasCaseload: true,
      hasFacilityCaseload: false,
      givenNames: "John",
      surname: "Doe",
    },
    {
      id: "2",
      stateCode: "us_xx",
      email: null,
      hasCaseload: true,
      hasFacilityCaseload: false,
      givenNames: "Jane",
      surname: "Doe",
    },
    {
      id: "3",
      stateCode: "us_xx",
      email: null,
      hasCaseload: true,
      hasFacilityCaseload: false,
      givenNames: "Chad",
      surname: "Doe-Adams",
    },
    {
      id: "4",
      stateCode: "us_xx",
      email: null,
      hasCaseload: true,
      hasFacilityCaseload: false,
      givenNames: "Bob",
      surname: "Adams-Doe",
    },
    {
      id: "4",
      stateCode: "us_xx",
      email: null,
      hasCaseload: true,
      hasFacilityCaseload: false,
      givenNames: "Brad",
      surname: "Collins (Doe)",
    },
  ];

  const sortedStaff = sortableStaff.sort(staffNameComparator);
  expect(sortedStaff.map((s) => `${s.givenNames} ${s.surname}`.trim())).toEqual(
    [
      "Bob Adams-Doe",
      "Brad Collins (Doe)",
      "Jane Doe",
      "John Doe",
      "Chad Doe-Adams",
    ]
  );
});

describe("fractionalDateBetweenTwoDates", () => {
  it("should return the date 1/2 between the two dates", () => {
    const dateLeft = new Date("2009-02-25");
    const dateRight = new Date("2059-10-10");
    const halfDate = new Date(2034, 5, 18);

    const fractionalDate = fractionalDateBetweenTwoDates(
      dateLeft,
      dateRight,
      0.5
    ); // 0.5 for half

    expect(fractionalDate).toEqual(halfDate);
  });

  test.each([
    ["2009-02-25", "2059-10-10", "2034-06-18"],
    ["2023-08-03", "2024-03-18", "2023-11-25"],
    ["2023-06-28", "2024-03-07", "2023-11-01"],
    ["2023-05-12", "2023-09-17", "2023-07-15"],
  ])(
    "Calculates the half date correctly with timezones",
    (dateLeft, dateRight, result) => {
      const halfDate = fractionalDateBetweenTwoDates(
        new Date(dateLeft),
        new Date(dateRight),
        0.5
      );
      expect(halfDate).toEqual(parseISO(result));
    }
  );

  it("should return the date 2/3 between the two dates", () => {
    const dateLeft = new Date("2023-01-01");
    const dateRight = new Date("2023-12-31");

    const twoThirdsDate = new Date(2023, 7, 31);
    const fractionalDate = fractionalDateBetweenTwoDates(
      dateLeft,
      dateRight,
      2 / 3
    );

    expect(fractionalDate).toEqual(twoThirdsDate);
  });
});

describe("filterByUserDistrict", () => {
  const userWithoutDistrict: CombinedUserRecord = {
    info: {
      email: "test",
      givenNames: "test",
      hasCaseload: true,
      hasFacilityCaseload: false,
      id: "test",
      stateCode: "US_XX",
      surname: "test",
    },
  };

  it("should return district overrides if set", () => {
    const user: CombinedUserRecord = {
      info: {
        ...userWithoutDistrict.info,
        district: "district 1",
      },
      updates: {
        stateCode: "US_XX",
        overrideDistrictIds: ["override 1", "override 2"],
      },
    };

    const expected: StaffFilter = {
      filterField: "district",
      filterValues: ["override 1", "override 2"],
    };

    expect(filterByUserDistrict(user, {})).toEqual(expected);
  });

  it("should return district if set and no overrides", () => {
    const user: CombinedUserRecord = {
      info: {
        ...userWithoutDistrict.info,
        district: "district 1",
      },
    };

    const expected: StaffFilter = {
      filterField: "district",
      filterValues: ["district 1"],
    };

    expect(filterByUserDistrict(user, {})).toEqual(expected);
  });

  it("should be undefined if no district and no overrides", () => {
    expect(filterByUserDistrict(userWithoutDistrict, {})).toBeUndefined();
  });

  it("can be overridden by a feature flag", () => {
    const user: CombinedUserRecord = {
      info: {
        ...userWithoutDistrict.info,
        district: "district 1",
      },
    };

    expect(
      filterByUserDistrict(user, {
        supervisionUnrestrictedSearch: {},
      })
    ).toBeUndefined();
  });
});

describe("usCaFilterByRoleSubtype", () => {
  const userWithoutDistrictOrRole = {
    info: {
      email: "test",
      givenNames: "test",
      hasCaseload: true,
      hasFacilityCaseload: false,
      id: "test",
      stateCode: "US_XX",
      surname: "test",
    },
  };

  const enabledFeatureVariant = {
    supervisionUnrestrictedSearch: {},
  };

  it("should return undefined when the feature variant is active", () => {
    expect(
      usCaFilterByRoleSubtype(
        {
          info: {
            ...userWithoutDistrictOrRole.info,
          },
        },
        enabledFeatureVariant
      )
    ).toBeUndefined();

    expect(
      usCaFilterByRoleSubtype(
        {
          info: {
            ...userWithoutDistrictOrRole.info,
            district: "district 1",
            roleSubtype: "SUPERVISION_OFFICER",
          },
        },
        enabledFeatureVariant
      )
    ).toBeUndefined();
  });

  it("should restrict to the user's id", () => {
    const user: CombinedUserRecord = {
      info: {
        ...userWithoutDistrictOrRole.info,
        district: "district 1",
        roleSubtype: "SUPERVISION_OFFICER",
      },
    };

    const expected: StaffFilter = {
      filterField: "email",
      filterValues: ["test"],
    };

    expect(usCaFilterByRoleSubtype(user, {})).toEqual(expected);
  });

  it("should restrict to the user's district", () => {
    const user: CombinedUserRecord = {
      info: {
        ...userWithoutDistrictOrRole.info,
        district: "district 1",
      },
    };

    const expected: StaffFilter = {
      filterField: "district",
      filterValues: ["district 1"],
    };

    expect(usCaFilterByRoleSubtype(user, {})).toEqual(expected);
  });

  it("should restrict to the user's id with no district set", () => {
    const user: CombinedUserRecord = {
      info: {
        ...userWithoutDistrictOrRole.info,
      },
    };

    const expected: StaffFilter = {
      filterField: "email",
      filterValues: [user.info.id],
    };

    expect(usCaFilterByRoleSubtype(user, {})).toEqual(expected);
  });
});

describe("getSnoozeUntilDate", () => {
  test("when auto snoozeUntil value exists", () => {
    const snoozeUntilDate = "2024-10-25";
    expect(getSnoozeUntilDate({ snoozeUntil: snoozeUntilDate })).toEqual(
      parseISO(snoozeUntilDate)
    );
  });

  test("when manual snoozeForDays and snoozedOn values exist", () => {
    expect(
      getSnoozeUntilDate({ snoozeForDays: 5, snoozedOn: "2023-09-25" })
    ).toEqual(parseISO("2023-09-30"));
  });
});

describe("snoozeUntilDateInTheFuture", () => {
  test("snoozed", () => {
    expect(snoozeUntilDateInTheFuture(add(new Date(), { days: 5 }))).toBeTrue();
  });

  test("not snoozed", () => {
    expect(
      snoozeUntilDateInTheFuture(sub(new Date(), { days: 5 }))
    ).toBeFalse();
  });
});

describe("can detect supervision vs. incarceration type", () => {
  const listOfTypes = Object.keys(OPPORTUNITY_CONFIGS);
  test("supervision", () => {
    const arr = listOfTypes.filter(
      (type) =>
        getSystemIdFromOpportunityType(type as SupervisionOpportunityType) ===
        "SUPERVISION"
    );
    expect(arr).toEqual(SUPERVISION_OPPORTUNITY_TYPES);
  });

  test("incarceration", () => {
    const arr = listOfTypes.filter(
      (type) =>
        getSystemIdFromOpportunityType(type as IncarcerationOpportunityType) ===
        "INCARCERATION"
    );
    expect(arr).toEqual(INCARCERATION_OPPORTUNITY_TYPES);
  });

  test("usTnCustodyLevelDowngrade is a incarceration type", () => {
    expect(getSystemIdFromOpportunityType("usTnCustodyLevelDowngrade")).toBe(
      "INCARCERATION"
    );
  });
  test("usCaSupervisionLevelDowngrade is a supervision type", () => {
    expect(
      getSystemIdFromOpportunityType("usCaSupervisionLevelDowngrade")
    ).toBe("SUPERVISION");
  });
});
