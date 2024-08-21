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

import {
  rawLeadershipUserInfoFixture,
  rawSupervisorUserInfoFixture,
} from "../offlineFixtures/UserInfoFixture";
import { RawUserInfo, userInfoSchema } from "../UserInfo";

test("supervisor transformation", () => {
  expect(userInfoSchema.parse(rawSupervisorUserInfoFixture)).toMatchSnapshot();
});

test("leadership transformation", () => {
  expect(userInfoSchema.parse(rawLeadershipUserInfoFixture)).toMatchSnapshot();
});

test("null entity with supervisor role fails", () => {
  expect(() => {
    userInfoSchema.parse({
      ...rawSupervisorUserInfoFixture,
      entity: null,
    });
  }).toThrow();
});

test("present entity with null role fails", () => {
  expect(() => {
    userInfoSchema.parse({
      ...rawSupervisorUserInfoFixture,
      role: null,
    });
  }).toThrow();
});

test("hasSeenOnboarding is moved into metadata", () => {
  const testUserInfo: RawUserInfo = {
    entity: null,
    role: null,
    hasSeenOnboarding: true,
  };
  expect(userInfoSchema.parse(testUserInfo)).toMatchInlineSnapshot(`
    {
      "entity": null,
      "metadata": {
        "hasSeenOnboarding": true,
      },
      "role": null,
    }
  `);
});
