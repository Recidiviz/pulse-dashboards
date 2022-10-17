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

import { configure } from "mobx";
import { IDisposer } from "mobx-utils";

import { trackSetOpportunityStatus } from "../../../../analytics";
import { RootStore } from "../../../../RootStore";
import { Client } from "../../../../WorkflowsStore";
import { eligibleClient } from "../../../../WorkflowsStore/__fixtures__";
import {
  CollectionDocumentSubscription,
  DocumentSubscription,
  OpportunityUpdateSubscription,
} from "../../../../WorkflowsStore/subscriptions";
import { updateCompliantReportingFormFieldData } from "../utils";

let testObserver: IDisposer;

jest.mock("../../../../analytics");
jest.mock("../../../../firestore");
jest.mock("../../../../WorkflowsStore/subscriptions");

const CollectionDocumentSubscriptionMock = CollectionDocumentSubscription as jest.MockedClass<
  typeof CollectionDocumentSubscription
>;
const OpportunityUpdateSubscriptionMock = OpportunityUpdateSubscription as jest.MockedClass<
  typeof OpportunityUpdateSubscription
>;

let client: Client;
let rootStore: RootStore;
let mockReferralSub: DocumentSubscription<any>;
let mockUpdatesSub: DocumentSubscription<any>;

beforeEach(() => {
  // this lets us spy on mobx computed getters
  configure({ safeDescriptors: false });
  rootStore = new RootStore();
  client = new Client(eligibleClient, rootStore);
  [mockReferralSub] = CollectionDocumentSubscriptionMock.mock.instances;
  [mockUpdatesSub] = OpportunityUpdateSubscriptionMock.mock.instances;

  mockReferralSub.isHydrated = true;
});

afterEach(() => {
  configure({ safeDescriptors: true });
  jest.resetAllMocks();

  // clean up any Mobx observers to avoid leaks
  if (testObserver) {
    testObserver();
  }
});

test("track start of progress on pending review", async () => {
  // simulating a fetch that has found no updates yet
  mockUpdatesSub.isHydrated = true;

  updateCompliantReportingFormFieldData("testUser", client, {
    clientFirstName: "Testabc",
  });

  expect(trackSetOpportunityStatus).toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    status: "IN_PROGRESS",
    opportunityType: "compliantReporting",
  });
});

test("form updates should not track status change if it's already set", async () => {
  // simulate fetching existing edits to the form
  mockUpdatesSub.data = { referralForm: { data: { foo: "bar" } } };
  mockUpdatesSub.isHydrated = true;

  updateCompliantReportingFormFieldData("testUser", client, {
    clientFirstName: "Testabc",
  });

  expect(trackSetOpportunityStatus).toHaveBeenCalledTimes(0);
  expect(trackSetOpportunityStatus).not.toHaveBeenCalledWith({
    clientId: client.pseudonymizedId,
    status: "IN_PROGRESS",
  });
});
