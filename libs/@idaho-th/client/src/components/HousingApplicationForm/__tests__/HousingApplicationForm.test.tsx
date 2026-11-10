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

import { render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

import { HousingApplicationForm } from "../HousingApplicationForm";

const testDoubles = vi.hoisted(() => ({
  currentApplication: {
    clientName: "John Doe",
    id: "application-123",
    formData: {},
    intakeStatus: "DRAFT",
  },
  submittedApplication: {
    clientName: "John Doe",
    id: "application-123",
    formData: {},
  },
  formValues: {
    clientFullName: "John Doe",
    faithBasedPreferred: true,
    gender: "Male",
    idocNumber: "12345",
    legalCurrentStatus: "Rider",
    legalSexOffenderRegistry: false,
    preferredDistrict: ["D1"],
    preferredProviders: ["Provider One"],
    tpdHousingNeededDate: "2026-07-01",
    violenceHistoryDors: false,
  },
  isPending: false,
  submitDraftApplication: vi.fn(),
  validate: vi.fn(),
  uploadDigitizedDocument: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../assets/x.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../FormContext/FormContext", () => ({
  useFormContext: () => ({
    canProceed: () => true,
    form: {
      state: {
        values: testDoubles.formValues,
      },
      validate: testDoubles.validate,
    },
    step: 4,
  }),
}));

vi.mock("../pages", () => ({
  Page1: () => null,
  Page2: () => null,
  Page3: () => null,
  Page4: () => null,
}));

vi.mock("../../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({
    currentApplicationId: testDoubles.currentApplication.id,
  }),
}));

vi.mock("../../../hooks/housingApplication", () => ({
  useSubmitDraftHousingApplication: () => ({
    isPending: testDoubles.isPending,
    mutate: testDoubles.submitDraftApplication,
  }),
}));

vi.mock("../../../hooks/useDigitizedDocumentUpload", () => ({
  useDigitizedDocumentUpload: () => ({
    uploadDigitizedDocument: testDoubles.uploadDigitizedDocument,
  }),
}));

describe("HousingApplicationForm", () => {
  beforeEach(() => {
    testDoubles.isPending = false;
    testDoubles.submitDraftApplication.mockReset();
    testDoubles.validate.mockReset();
    testDoubles.uploadDigitizedDocument.mockReset();
    vi.mocked(toast.error).mockReset();
    (testDoubles.currentApplication as unknown as { id?: string }).id =
      "application-123";
  });

  test("submits the draft housing application when Choose providers is clicked", async () => {
    const user = userEvent.setup();

    render(<HousingApplicationForm />);

    await user.click(screen.getByRole("button", { name: "Choose providers" }));

    expect(testDoubles.submitDraftApplication).toHaveBeenCalledWith(
      {
        id: testDoubles.currentApplication.id,
        formData: testDoubles.formValues,
      },
      { onSuccess: expect.any(Function) },
    );
  });

  test("opens review only after the housing application save succeeds", async () => {
    const user = userEvent.setup();
    const onReview = vi.fn();

    render(<HousingApplicationForm onReview={onReview} />);

    await user.click(screen.getByRole("button", { name: "Choose providers" }));

    expect(onReview).not.toHaveBeenCalled();

    const [, mutationOptions] = testDoubles.submitDraftApplication.mock
      .calls[0] as [unknown, { onSuccess: (application: unknown) => void }];

    mutationOptions.onSuccess(testDoubles.submittedApplication);

    expect(onReview).toHaveBeenCalledWith(testDoubles.submittedApplication.id);
  });

  test("shows Saving and disables Choose providers while the application is saving", async () => {
    const user = userEvent.setup();
    testDoubles.isPending = true;

    render(<HousingApplicationForm />);

    const finishButton = screen.getByRole("button", { name: "Saving…" });

    expect(finishButton).toBeDisabled();

    await user.click(finishButton);

    expect(testDoubles.submitDraftApplication).not.toHaveBeenCalled();
  });

  test("shows an error toast and does not submit when currentApplicationId is missing", async () => {
    (testDoubles.currentApplication as unknown as { id?: string }).id =
      undefined;

    const user = userEvent.setup();
    render(<HousingApplicationForm />);

    await user.click(screen.getByRole("button", { name: "Choose providers" }));

    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "Something went wrong. Please re-upload the application.",
    );
    expect(testDoubles.submitDraftApplication).not.toHaveBeenCalled();
  });

  test("does not uploadDigitizedDocument when onPrepareDigitizedPdf returns null, but still calls onReview", async () => {
    const user = userEvent.setup();
    const onReview = vi.fn();

    const onPrepareDigitizedPdf = vi.fn(async () => null);

    render(
      <HousingApplicationForm
        onReview={onReview}
        onPrepareDigitizedPdf={onPrepareDigitizedPdf}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Choose providers" }));

    const [, mutationOptions] = testDoubles.submitDraftApplication.mock
      .calls[0] as [unknown, { onSuccess: (application: unknown) => void }];

    mutationOptions.onSuccess(testDoubles.submittedApplication);

    expect(onReview).toHaveBeenCalledWith(testDoubles.submittedApplication.id);
    expect(testDoubles.uploadDigitizedDocument).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onPrepareDigitizedPdf).toHaveBeenCalled();
    });
  });

  test("starts upload of digitized application when onPrepareDigitizedPdf returns a File", async () => {
    const user = userEvent.setup();
    const onReview = vi.fn();

    const onPrepareDigitizedPdf = vi.fn(
      async () => new File(["pdf"], "app.pdf"),
    );

    render(
      <HousingApplicationForm
        onReview={onReview}
        onPrepareDigitizedPdf={onPrepareDigitizedPdf}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Choose providers" }));

    const [, mutationOptions] = testDoubles.submitDraftApplication.mock
      .calls[0] as [unknown, { onSuccess: (application: unknown) => void }];

    mutationOptions.onSuccess(testDoubles.submittedApplication);

    expect(onReview).toHaveBeenCalledWith(testDoubles.submittedApplication.id);
    await waitFor(() => {
      expect(testDoubles.uploadDigitizedDocument).toHaveBeenCalled();
    });

    expect(testDoubles.uploadDigitizedDocument).toHaveBeenCalledWith(
      testDoubles.submittedApplication.id,
      expect.any(File),
    );
  });

  test("does not surface an unhandled rejection when the digitized upload fails", async () => {
    const user = userEvent.setup();
    const onReview = vi.fn();
    const unhandledRejections: unknown[] = [];
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      unhandledRejections.push(event.reason);
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    testDoubles.uploadDigitizedDocument.mockRejectedValue(
      new Error("upload failed"),
    );
    const onPrepareDigitizedPdf = vi.fn(
      async () => new File(["pdf"], "app.pdf"),
    );

    try {
      render(
        <HousingApplicationForm
          onReview={onReview}
          onPrepareDigitizedPdf={onPrepareDigitizedPdf}
        />,
      );

      await user.click(
        screen.getByRole("button", { name: "Choose providers" }),
      );

      const [, mutationOptions] = testDoubles.submitDraftApplication.mock
        .calls[0] as [unknown, { onSuccess: (application: unknown) => void }];
      mutationOptions.onSuccess(testDoubles.submittedApplication);

      await waitFor(() => {
        expect(testDoubles.uploadDigitizedDocument).toHaveBeenCalled();
      });
      // Let the rejected promise chain settle.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(onReview).toHaveBeenCalledWith(
        testDoubles.submittedApplication.id,
      );
      expect(unhandledRejections).toEqual([]);
    } finally {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    }
  });
});
