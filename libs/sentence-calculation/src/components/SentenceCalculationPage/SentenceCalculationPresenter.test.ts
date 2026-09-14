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

import { SentenceCalculationHost } from "../../types";
import { SentenceCalculationPresenter } from "./SentenceCalculationPresenter";

const host: SentenceCalculationHost = {
  currentTenantId: "US_NV",
  userStore: { getToken: () => Promise.resolve("token") },
};

function mockFetch(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("SentenceCalculationPresenter", () => {
  it("cannot submit an empty or whitespace-only value", () => {
    const presenter = new SentenceCalculationPresenter(host);

    expect(presenter.canSubmit).toBe(false);

    presenter.setInputValue("   ");
    expect(presenter.canSubmit).toBe(false);

    presenter.setInputValue("hello");
    expect(presenter.canSubmit).toBe(true);
  });

  it("posts the value to the tenant's echo endpoint and stores the response", async () => {
    const fetchMock = mockFetch({
      ok: true,
      json: () => Promise.resolve({ echo: "hello", stateCode: "US_NV" }),
    });
    const presenter = new SentenceCalculationPresenter(host);
    presenter.setInputValue("hello");

    await presenter.submit();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/sentence_calculation/US_NV/echo");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ value: "hello" }));
    expect(init.headers.Authorization).toBe("Bearer token");

    expect(presenter.response).toEqual({ echo: "hello", stateCode: "US_NV" });
    expect(presenter.error).toBeUndefined();
    expect(presenter.isSubmitting).toBe(false);
  });

  it("captures a failed request as an error rather than throwing", async () => {
    mockFetch({ ok: false, status: 401 });
    const presenter = new SentenceCalculationPresenter(host);
    presenter.setInputValue("hello");

    await presenter.submit();

    expect(presenter.response).toBeUndefined();
    expect(presenter.error?.message).toContain("401");
    expect(presenter.isSubmitting).toBe(false);
  });

  it("errors rather than calling the API when no tenant is selected", async () => {
    const fetchMock = mockFetch({ ok: true });
    const presenter = new SentenceCalculationPresenter({
      ...host,
      currentTenantId: undefined,
    });
    presenter.setInputValue("hello");

    await presenter.submit();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(presenter.error?.message).toMatch(/no tenant selected/);
  });
});
