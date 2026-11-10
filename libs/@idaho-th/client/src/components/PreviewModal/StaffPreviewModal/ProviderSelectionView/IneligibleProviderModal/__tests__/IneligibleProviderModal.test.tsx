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

import { fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { IneligibleProviderModal } from "../IneligibleProviderModal";

vi.mock("../../../../../assets/x.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../../../../Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock("../../../common", () => ({
  BadgeRow: ({ labels }: { labels: Array<{ text: string }> }) => (
    <div>
      {labels.map((l) => (
        <span key={l.text}>{l.text}</span>
      ))}
    </div>
  ),
}));

const provider = {
  id: "prov-1",
  name: "Hope Housing",
  labels: [{ text: "Gender conflict", kind: "conflict" }],
} as never;

test("names the provider and lists unmet eligibility requirements", () => {
  const screen = render(
    <IneligibleProviderModal
      isOpen
      onClose={vi.fn()}
      onConfirm={vi.fn()}
      provider={provider}
    />,
  );

  expect(
    screen.getByText(
      /doesn’t meet the following eligibility requirements for Hope Housing/i,
    ),
  ).toBeInTheDocument();
  expect(screen.getByText("Gender conflict")).toBeInTheDocument();
});

test("passes the internal override note when Add Provider is clicked", () => {
  const onConfirm = vi.fn();

  const screen = render(
    <IneligibleProviderModal
      isOpen
      onClose={vi.fn()}
      onConfirm={onConfirm}
      provider={provider}
    />,
  );

  fireEvent.change(
    screen.getByPlaceholderText(/Why are you adding this provider/i),
    { target: { value: "Exception approved by supervisor" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Add Provider" }));

  expect(onConfirm).toHaveBeenCalledWith(
    provider,
    "Exception approved by supervisor",
  );
});

test("closes via Cancel", () => {
  const onClose = vi.fn();

  const screen = render(
    <IneligibleProviderModal
      isOpen
      onClose={onClose}
      onConfirm={vi.fn()}
      provider={provider}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
