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

import { act, fireEvent, render, screen } from "@testing-library/react";
import ReactModal from "react-modal";

import { UsIaEarlyDischargeCharge } from "~datatypes";

import { UsIaEarlyDischargeForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import { SubmitForApprovalModal } from "../SubmitForApprovalModal";

function charge(jurisdiction: string, chargeExternalId: string) {
  return { jurisdiction, chargeExternalId } as UsIaEarlyDischargeCharge;
}

function setup(
  submitForSupervisorReview: () => Promise<void> = vi
    .fn()
    .mockResolvedValue(undefined),
) {
  const selectedChargesByJurisdiction = new Map([
    ["POLK", [charge("POLK", "C1"), charge("POLK", "C2")]],
    ["SCOTT", [charge("SCOTT", "C3")]],
  ]);
  const form = {
    opportunity: {
      person: {
        displayId: "DOC-001",
        fullName: { givenNames: "Jordan", surname: "Example" },
      },
      submitForSupervisorReview,
    },
    selectedChargesByJurisdiction,
    selectedChargeCount: 3,
    waitForPendingUpdates: vi.fn().mockResolvedValue(undefined),
  } as unknown as UsIaEarlyDischargeForm;
  const onClose = vi.fn();

  render(<SubmitForApprovalModal isOpen onClose={onClose} form={form} />);

  return { form, onClose, submitForSupervisorReview };
}

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

describe("SubmitForApprovalModal", () => {
  it("names the dialog after its title", () => {
    setup();

    expect(
      screen.getByRole("dialog", { name: "Submit for supervisor approval" }),
    ).toBeInTheDocument();
  });

  it("names the client and lists each jurisdiction's charge count", () => {
    setup();

    expect(
      screen.getByText("Jordan Example · DOC ID DOC-001"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "3 charges across 2 jurisdictions. This goes to your supervisor for review.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("POLK — 2 charges")).toBeInTheDocument();
    expect(screen.getByText("SCOTT — 1 charge")).toBeInTheDocument();
  });

  it("sends every selected charge to the supervisor after the draft saves, then closes", async () => {
    const { form, onClose, submitForSupervisorReview } = setup();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Submit for approval" }),
      );
    });

    expect(submitForSupervisorReview).toHaveBeenCalledWith(["C1", "C2", "C3"]);
    expect(
      vi.mocked(form.waitForPendingUpdates).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(submitForSupervisorReview).mock.invocationCallOrder[0],
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("disables Submit while the write is in flight", async () => {
    let finishWrite = () => undefined as void;
    const submitForSupervisorReview = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        }),
    );
    setup(submitForSupervisorReview);
    const submit = screen.getByRole("button", { name: "Submit for approval" });

    await act(async () => {
      fireEvent.click(submit);
    });
    fireEvent.click(submit);

    expect(submit).toBeDisabled();
    expect(submitForSupervisorReview).toHaveBeenCalledOnce();
    await act(async () => finishWrite());
  });

  it("stays open and says what failed when the write fails", async () => {
    const { onClose } = setup(vi.fn().mockRejectedValue(new Error("offline")));

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Submit for approval" }),
      );
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The report wasn't submitted. Try again.",
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Submit for approval" }),
    ).toBeEnabled();
  });

  it("clears a failed write's error when the modal closes", async () => {
    setup(vi.fn().mockRejectedValue(new Error("offline")));
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Submit for approval" }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("closes without writing on Cancel", () => {
    const { onClose, submitForSupervisorReview } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
    expect(submitForSupervisorReview).not.toHaveBeenCalled();
  });
});
