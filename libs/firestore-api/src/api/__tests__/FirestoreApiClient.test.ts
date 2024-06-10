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

import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { FirestoreAPIClient } from "../FirestoreAPIClient";

vi.mock("firebase/app");
vi.mock("firebase/auth");
vi.mock("firebase/firestore");

let client: FirestoreAPIClient;

beforeEach(() => {
  client = new FirestoreAPIClient("US_XX", "project-xx", "api-xx");
});

test("initialize", () => {
  expect(initializeApp).toHaveBeenCalledExactlyOnceWith({
    projectId: "project-xx",
    apiKey: "api-xx",
  });
  expect(getFirestore).toHaveBeenCalledOnce();
});

test("authenticate", async () => {
  vi.mocked(getAuth);

  client.authenticate("token-xx");
  expect(getAuth).toHaveBeenCalledOnce();
  expect(signInWithCustomToken).toHaveBeenCalledExactlyOnceWith(
    undefined, // this is the auth object, which we are not mocking explicitly
    "token-xx",
  );
});
