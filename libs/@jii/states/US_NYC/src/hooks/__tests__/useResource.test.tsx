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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { Suspense } from "react";

import { useRootStore } from "~@jii/data";

import { US_NYC_CONTACT_LABELS } from "../../constants";
import { useResource } from "../useResource";
import {
  makeAddress,
  makePhone,
  makeResourceDetail,
  makeWebsite,
} from "./testUtils";

vi.mock("~@jii/data", async (importOriginal) => ({
  ...(await importOriginal()),
  useRootStore: vi.fn(),
}));

const QUERY_KEY = ["resource", 1];

const mockResource = makeResourceDetail(1, {
  name: "East Harlem Employment Center",
  description: "Job training and employment services.",
  categories: [
    { category: "Employment", subcategory: "Job Training" },
    { category: "Legal", subcategory: "Civil Rights" },
  ],
  tags: ["Se habla Español"],
});

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  queryClient.setQueryData(QUERY_KEY, mockResource);

  vi.mocked(useRootStore).mockReturnValue({
    apiClient: {
      trpcQuerier: {
        resident: {
          resources: {
            getResource: {
              queryOptions: vi.fn().mockReturnValue({
                queryKey: QUERY_KEY,
                queryFn: vi.fn(),
              }),
            },
          },
        },
      },
    },
  } as unknown as ReturnType<typeof useRootStore>);
});

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>{children}</Suspense>
    </QueryClientProvider>
  );
}

test("name and description are passed through from the API", () => {
  const { result } = renderHook(() => useResource(1), { wrapper });

  expect(result.current.name).toBe("East Harlem Employment Center");
  expect(result.current.description).toBe(
    "Job training and employment services.",
  );
});

test("labels combines categories as 'category / subcategory' followed by tags", () => {
  const { result } = renderHook(() => useResource(1), { wrapper });

  expect(result.current.labels).toEqual([
    "Employment / Job Training",
    "Legal / Civil Rights",
    "Se habla Español",
  ]);
});

test("standalone phone with no address goes into generalContactRows", () => {
  queryClient.setQueryData(
    QUERY_KEY,
    makeResourceDetail(1, {
      phoneNumbers: [makePhone(1, "555-1234")],
    }),
  );

  const { result } = renderHook(() => useResource(1), { wrapper });

  expect(result.current.contactInformation.generalContactRows).toEqual([
    { key: "phone-1", label: US_NYC_CONTACT_LABELS.phone, value: "555-1234" },
  ]);
  expect(result.current.contactInformation.locationGroups).toEqual([]);
});

test("address with tied phone produces a location group", () => {
  queryClient.setQueryData(
    QUERY_KEY,
    makeResourceDetail(1, {
      addresses: [makeAddress(1, "123 Main St")],
      phoneNumbers: [makePhone(2, "555-5678", { addressId: 1 })],
    }),
  );

  const { result } = renderHook(() => useResource(1), { wrapper });

  expect(result.current.contactInformation.locationGroups).toHaveLength(1);
  expect(result.current.contactInformation.locationGroups[0].rows).toEqual([
    {
      key: "address-1",
      label: US_NYC_CONTACT_LABELS.address,
      value: "123 Main St",
    },
    {
      key: "phone-2",
      label: US_NYC_CONTACT_LABELS.phone,
      value: "555-5678",
    },
  ]);
  expect(result.current.contactInformation.generalContactRows).toEqual([]);
});

test("standalone website with no address goes into generalContactRows", () => {
  queryClient.setQueryData(
    QUERY_KEY,
    makeResourceDetail(1, {
      websites: [makeWebsite(1, "https://example.com")],
    }),
  );

  const { result } = renderHook(() => useResource(1), { wrapper });

  expect(result.current.contactInformation.generalContactRows).toEqual([
    {
      key: "website-1",
      label: US_NYC_CONTACT_LABELS.website,
      value: "https://example.com",
    },
  ]);
  expect(result.current.contactInformation.locationGroups).toEqual([]);
});
