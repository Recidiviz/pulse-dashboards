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

import { add, parseISO, sub } from "date-fns";

import { StaffRecord } from "~datatypes";

import { StaffFilter } from "../../core/models/types";
import { CombinedUserRecord } from "../../FirestoreStore/types";
import {
  filterByUserDistrict,
  fractionalDateBetweenTwoDates,
  getSnoozeUntilDate,
  snoozeUntilDateInTheFuture,
  staffNameComparator,
  usCaFilterByRoleSubtype,
  usMiFilterByUserDistrict,
} from "../utils";

test("staffNameComparator", () => {
  const sortableStaff: StaffRecord[] = [
    {
      id: "1",
      recordType: "supervisionStaff",
      stateCode: "us_xx",
      email: null,
      givenNames: "John",
      surname: "Doe",
      supervisorExternalId: null,
      pseudonymizedId: "p001",
    },
    {
      id: "2",
      recordType: "supervisionStaff",
      stateCode: "us_xx",
      email: null,
      givenNames: "Jane",
      surname: "Doe",
      supervisorExternalId: null,
      pseudonymizedId: "p002",
    },
    {
      id: "3",
      recordType: "supervisionStaff",
      stateCode: "us_xx",
      email: null,
      givenNames: "Chad",
      surname: "Doe-Adams",
      supervisorExternalId: null,
      pseudonymizedId: "p003",
    },
    {
      id: "4",
      recordType: "supervisionStaff",
      stateCode: "us_xx",
      email: null,
      givenNames: "Bob",
      surname: "Adams-Doe",
      supervisorExternalId: "ABC201",
      pseudonymizedId: "p004",
    },
    {
      id: "5",
      recordType: "supervisionStaff",
      stateCode: "us_xx",
      email: null,
      givenNames: "Brad",
      surname: "Collins (Doe)",
      supervisorExternalId: null,
      pseudonymizedId: "p005",
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
    ],
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
      0.5,
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
        0.5,
      );
      expect(halfDate).toEqual(parseISO(result));
    },
  );

  it("should return the date 2/3 between the two dates", () => {
    const dateLeft = new Date("2023-01-01");
    const dateRight = new Date("2023-12-31");

    const twoThirdsDate = new Date(2023, 7, 31);
    const fractionalDate = fractionalDateBetweenTwoDates(
      dateLeft,
      dateRight,
      2 / 3,
    );

    expect(fractionalDate).toEqual(twoThirdsDate);
  });
});

describe("usMiFilterByUserDistrict", () => {
  const usMiUser: CombinedUserRecord = {
    info: {
      email: "testEmail",
      givenNames: "testGivenNames",
      id: "testId",
      stateCode: "US_MI",
      surname: "testSurname",
      recordType: "supervisionStaff",
      pseudonymizedId: "test",
    },
  };

  it("should return all district 10s", () => {
    const user: CombinedUserRecord = {
      info: {
        ...usMiUser.info,
        district: "10 - WEST",
      },
    };

    const expected: StaffFilter = {
      filterField: "district",
      filterValues: [
        "10 - WEST",
        "10 - CENTRAL",
        "10 - NORTHEAST",
        "10 - NORTHWEST",
      ],
    };

    expect(usMiFilterByUserDistrict(user, {})).toEqual(expected);
  });

  it("should return district 1", () => {
    const user: CombinedUserRecord = {
      info: {
        ...usMiUser.info,
        district: "district 1",
      },
    };
    const expected: StaffFilter = {
      filterField: "district",
      filterValues: ["district 1"],
    };

    expect(usMiFilterByUserDistrict(user, {})).toEqual(expected);
  });

  it("should return district overrides if set", () => {
    const user: CombinedUserRecord = {
      info: {
        ...usMiUser.info,
        district: "10 - WEST",
      },
      updates: {
        stateCode: "US_MI",
        overrideDistrictIds: ["override 1", "override 2"],
      },
    };

    const expected: StaffFilter = {
      filterField: "district",
      filterValues: ["override 1", "override 2"],
    };

    expect(usMiFilterByUserDistrict(user, {})).toEqual(expected);
  });

  it("can be overridden by a feature flag", () => {
    const user: CombinedUserRecord = {
      info: {
        ...usMiUser.info,
        district: "10 - WEST",
      },
    };

    expect(
      usMiFilterByUserDistrict(user, {
        supervisionUnrestrictedSearch: {},
      }),
    ).toBeUndefined();
  });
});

describe("filterByUserDistrict", () => {
  const userWithoutDistrict: CombinedUserRecord = {
    info: {
      email: "testEmail",
      givenNames: "testGivenNames",
      id: "testId",
      stateCode: "US_XX",
      surname: "testSurname",
      recordType: "supervisionStaff",
      pseudonymizedId: "test",
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

  it("should be restricted to email if no district and no overrides", () => {
    const expected: StaffFilter = {
      filterField: "email",
      filterValues: ["testEmail"],
    };
    expect(filterByUserDistrict(userWithoutDistrict, {})).toEqual(expected);
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
      }),
    ).toBeUndefined();
  });
});

describe("usCaFilterByRoleSubtype", () => {
  const userWithoutDistrictOrRole = {
    info: {
      email: "testEmail",
      givenNames: "test",
      id: "testId",
      stateCode: "US_XX",
      surname: "testSurname",
      recordType: "supervisionStaff" as const,
      pseudonymizedId: "ptest",
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
        enabledFeatureVariant,
      ),
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
        enabledFeatureVariant,
      ),
    ).toBeUndefined();
  });

  it("should return undefined when the user is a supervisor", () => {
    expect(
      usCaFilterByRoleSubtype(
        {
          info: {
            ...userWithoutDistrictOrRole.info,
            roleSubtype: "SUPERVISION_OFFICER_SUPERVISOR",
          },
        },
        enabledFeatureVariant,
      ),
    ).toBeUndefined();
  });

  it("should restrict to the user's email", () => {
    const user: CombinedUserRecord = {
      info: {
        ...userWithoutDistrictOrRole.info,
        district: "district 1",
        roleSubtype: "SUPERVISION_OFFICER",
        recordType: "supervisionStaff",
      },
    };

    const expected: StaffFilter = {
      filterField: "email",
      filterValues: ["testEmail"],
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

  it("should restrict to the user's email with no district set", () => {
    const user: CombinedUserRecord = {
      info: {
        ...userWithoutDistrictOrRole.info,
      },
    };

    const expected: StaffFilter = {
      filterField: "email",
      filterValues: [user.info.email],
    };

    expect(usCaFilterByRoleSubtype(user, {})).toEqual(expected);
  });
});

describe("getSnoozeUntilDate", () => {
  test("when auto snoozeUntil value exists", () => {
    const snoozeUntilDate = "2024-10-25";
    expect(getSnoozeUntilDate({ snoozeUntil: snoozeUntilDate })).toEqual(
      parseISO(snoozeUntilDate),
    );
  });

  test("when manual snoozeForDays and snoozedOn values exist", () => {
    expect(
      getSnoozeUntilDate({ snoozeForDays: 5, snoozedOn: "2023-09-25" }),
    ).toEqual(parseISO("2023-09-30"));
  });
});

describe("snoozeUntilDateInTheFuture", () => {
  test("snoozed", () => {
    expect(snoozeUntilDateInTheFuture(add(new Date(), { days: 5 }))).toBeTrue();
  });

  test("not snoozed", () => {
    expect(
      snoozeUntilDateInTheFuture(sub(new Date(), { days: 5 })),
    ).toBeFalse();
  });
});
