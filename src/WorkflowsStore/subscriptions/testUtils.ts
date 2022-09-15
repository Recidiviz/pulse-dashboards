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

/**
 * @returns a reference to the callback that receives subscription data,
 * so that test data can be piped through the subscription on demand
 */
export function getMockDocumentSnapshotHandler(
  snapshotMock: jest.Mock
): (mockData: any) => void {
  let subscriptionHandler: any;

  snapshotMock.mockImplementation((query, handler) => {
    subscriptionHandler = handler;
  });

  snapshotMock();
  snapshotMock.mockClear();

  return function mockReceiveSnapshot(mockData: any): void {
    subscriptionHandler({
      data: () => mockData,
    });
  };
}
