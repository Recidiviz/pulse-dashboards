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

import { renderHook } from "@testing-library/react-native";

import { trpc } from "~@meetings/app/shared/api";

import { useMeetings } from "./useMeetings";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("~@meetings/app/shared/api/trpc", () => ({
  __esModule: true,
  trpc: {
    v1: {
      client: { getMeetings: { useQuery: jest.fn() } },
      resident: { getMeetings: { useQuery: jest.fn() } },
    },
  },
}));

jest.mock("~@meetings/app/utils/isMeetingProcessing", () => ({
  isMeetingProcessing: () => false,
}));

const mockClientGetMeetings = trpc.v1.client.getMeetings.useQuery as jest.Mock;
const mockResidentGetMeetings = trpc.v1.resident.getMeetings
  .useQuery as jest.Mock;

const personId = BigInt(1);
const emptyResult = { data: [], isLoading: false };

describe("useMeetings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClientGetMeetings.mockReturnValue(emptyResult);
    mockResidentGetMeetings.mockReturnValue(emptyResult);
  });

  describe("personType: client", () => {
    it("enables the client route and disables the resident route", () => {
      renderHook(() => useMeetings({ personId, personType: "client" }));

      expect(mockClientGetMeetings).toHaveBeenCalledWith(
        { clientId: personId },
        expect.objectContaining({ enabled: true }),
      );
      expect(mockResidentGetMeetings).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ enabled: false }),
      );
    });

    it("returns the client query result", () => {
      const clientData = [{ id: 1, postMeetingProcessingStatus: "COMPLETED" }];
      mockClientGetMeetings.mockReturnValue({
        data: clientData,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useMeetings({ personId, personType: "client" }),
      );

      expect(result.current.data).toEqual(clientData);
    });
  });

  describe("personType: resident", () => {
    it("enables the resident route and disables the client route", () => {
      renderHook(() => useMeetings({ personId, personType: "resident" }));

      expect(mockResidentGetMeetings).toHaveBeenCalledWith(
        { residentId: personId },
        expect.objectContaining({ enabled: true }),
      );
      expect(mockClientGetMeetings).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ enabled: false }),
      );
    });

    it("returns the resident query result", () => {
      const residentData = [
        { id: 2, postMeetingProcessingStatus: "COMPLETED" },
      ];
      mockResidentGetMeetings.mockReturnValue({
        data: residentData,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useMeetings({ personId, personType: "resident" }),
      );

      expect(result.current.data).toEqual(residentData);
    });
  });
});
