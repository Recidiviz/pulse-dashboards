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

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { DEFAULT_FORM_VALUES } from "../../HousingApplicationForm/hooks/useHousingApplicationForm/utils";
import type { HousingApplicationForm } from "../../HousingApplicationForm/types";
import { IntakeFormModal } from "../IntakeFormModal";

const testDoubles = vi.hoisted(() => ({
  currentApplication: {
    clientName: "John Doe",
    formData: {},
    id: "application-123",
    intakeStatus: "DRAFT",
  },
  setCurrentApplication: vi.fn(),
  setCurrentFormValues: vi.fn(),
  submitDraftApplication: vi.fn(),
  updateApplication: vi.fn(),
}));

const providers = [
  { id: "provider-one", name: "Provider One" },
  { id: "provider-two", name: "Provider Two" },
  { id: "provider-three", name: "Provider Three" },
];

vi.mock("~design-system", () => ({
  Icon: () => <svg />,
}));

vi.mock("react-datepicker", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  return {
    default: ({
      customInput,
      onChangeRaw,
      placeholderText,
      value,
    }: {
      customInput?: React.ReactNode;
      onChangeRaw?: (event: React.KeyboardEvent<HTMLElement>) => void;
      placeholderText?: string;
      value?: string;
    }) => {
      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChangeRaw?.(event as unknown as React.KeyboardEvent<HTMLElement>);
      };

      if (React.isValidElement(customInput)) {
        return React.cloneElement(
          customInput as React.ReactElement<Record<string, unknown>>,
          {
            onChange: handleChange,
            placeholder: placeholderText,
            value: value ?? "",
          },
        );
      }

      return (
        <input
          onChange={handleChange}
          placeholder={placeholderText}
          value={value ?? ""}
        />
      );
    },
  };
});

vi.mock("../../../hooks/useIsMobile", () => ({
  default: () => ({ isTablet: false }),
}));

vi.mock("../../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({
    currentApplication: testDoubles.currentApplication,
    currentApplicationId: testDoubles.currentApplication.id,
    setCurrentApplication: testDoubles.setCurrentApplication,
    setCurrentFormValues: testDoubles.setCurrentFormValues,
  }),
}));

vi.mock("../../../hooks/housingApplication", () => ({
  useHousingProviders: () => ({
    isPending: false,
    providers,
  }),
  useSubmitDraftHousingApplication: () => ({
    isPending: false,
    mutate: testDoubles.submitDraftApplication,
  }),
  useUpdateHousingApplication: () => ({
    mutate: testDoubles.updateApplication,
  }),
}));

vi.mock("../../../hooks/useDocumentUpload", () => ({
  useDocumentUpload: () => ({
    startUpload: vi.fn(),
  }),
}));

vi.mock("../../../hooks/useDigitizedDocumentUpload", () => ({
  useDigitizedDocumentUpload: () => ({
    uploadDigitizedDocument: vi.fn(),
  }),
}));

vi.mock("../../Modal/Modal", () => ({
  Modal: ({
    children,
    hideModal,
    isOpen,
  }: {
    children: ReactNode;
    hideModal: () => void;
    isOpen: boolean;
  }) =>
    isOpen ? (
      <div>
        <button type="button" onClick={hideModal}>
          Mock modal close
        </button>
        {children}
      </div>
    ) : null,
}));

vi.mock("../../HousingApplications/PdfViewer", () => ({
  PdfViewer: ({
    pageNumber,
    signedUrl,
  }: {
    pageNumber?: number;
    signedUrl: string | null;
  }) => (
    <div
      data-page-number={pageNumber}
      data-signed-url={signedUrl}
      data-testid="pdf-viewer"
    />
  ),
}));

vi.mock("../../assets/x.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../assets/tabler-icon-alert-triangle.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../assets/tabler-icon-check.svg?react", () => ({
  default: () => <svg />,
}));

describe("IntakeFormModal", () => {
  beforeEach(() => {
    testDoubles.setCurrentApplication.mockReset();
    testDoubles.setCurrentFormValues.mockReset();
    testDoubles.submitDraftApplication.mockReset();
    testDoubles.updateApplication.mockReset();
  });

  const expectTextboxValue = (label: string, value: string) => {
    expect(screen.getByRole("textbox", { name: label })).toHaveValue(value);
  };

  const expectDisplayedValue = (value: string) => {
    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
  };

  const expectComboboxValue = (label: string, value: string) => {
    const combobox = screen.getByRole("combobox", { name: label });
    const valueContainer = combobox.closest(
      ".searchable-select__value-container",
    ) as HTMLElement | null;
    if (valueContainer) {
      expect(valueContainer).toHaveTextContent(value);
    } else {
      expect(combobox).toHaveDisplayValue(value);
    }
  };

  const expectSelectDisplayValue = (label: string, value: string) => {
    expect(screen.getByRole("combobox", { name: label })).toHaveDisplayValue(
      value,
    );
  };

  const flushFormUpdates = async () => {
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });
  };

  const clickNextPage = async (user: ReturnType<typeof userEvent.setup>) => {
    const nextPageButton = await screen.findByRole("button", {
      name: "Next page",
    });
    await user.click(nextPageButton);
    await flushFormUpdates();
  };

  const renderIntakeFormModal = async (
    defaultValues?: HousingApplicationForm,
  ) => {
    await act(async () => {
      render(
        <IntakeFormModal
          isOpen
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          pdf="https://example.com/prepared-application.pdf"
          defaultValues={defaultValues}
        />,
      );
    });
    await flushFormUpdates();
  };

  const page1ValidValues: HousingApplicationForm = {
    ...DEFAULT_FORM_VALUES,
    clientFullName: "John Doe",
    dob: "01/01/1999",
    idocNumber: "123456",
    legalCurrentStatus: "Termer",
    tpdHousingNeededDate: "07/01/2026",
  };
  const page2ValidValues: HousingApplicationForm = {
    ...page1ValidValues,
    preferredDistrict: ["D1"],
    signatureDate: "06/01/2026",
    signatureProvided: true,
  };

  test("disables Next page when Page 1 required fields are missing", async () => {
    await renderIntakeFormModal();

    expect(screen.getByText("Page 1 of 4")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "1",
    );
    expect(
      await screen.findByRole("textbox", { name: "Full Name (Q1)" }),
    ).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "IDOC# (Q1)" })).toHaveValue("");
    expect(screen.getByLabelText("DOB (Q1)")).toHaveValue("");
    expect(screen.getByLabelText("Release Date (Q15)")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  test("opens Page 2 when Page 1 required fields are valid", async () => {
    const user = userEvent.setup();
    await renderIntakeFormModal(page1ValidValues);

    expect(screen.getByText("Page 1 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

    await clickNextPage(user);

    expect(screen.getByText("Page 2 of 4")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "2",
    );
    expect(
      screen.getByRole("combobox", { name: "Preferred District (Q29)" }),
    ).toBeInTheDocument();
  });

  test("disables Next page when Page 2 required fields are missing", async () => {
    const user = userEvent.setup();

    await renderIntakeFormModal(page1ValidValues);
    await clickNextPage(user);

    expect(screen.getByText("Page 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  test("resets the form when the modal is closed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    await act(async () => {
      render(
        <IntakeFormModal
          isOpen
          onClose={onClose}
          onSubmit={vi.fn()}
          pdf="https://example.com/prepared-application.pdf"
        />,
      );
    });
    await flushFormUpdates();

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: "Full Name (Q1)" }),
        "Jane Doe",
      );
      await user.type(
        screen.getByRole("textbox", { name: "IDOC# (Q1)" }),
        "123456",
      );
      await user.type(screen.getByLabelText("DOB (Q1)"), "06/15/1991");
      await user.click(
        screen.getByRole("combobox", { name: "Current Status (Q6)" }),
      );
      await user.click(screen.getByRole("option", { name: "Termer" }));
      await user.type(
        screen.getByLabelText("Release Date (Q15)"),
        "07/01/2026",
      );
    });
    await flushFormUpdates();

    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

    await clickNextPage(user);

    expect(screen.getByText("Page 2 of 4")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "2",
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Close modal" }));
    });
    await flushFormUpdates();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Page 1 of 4")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "1",
    );
    expect(screen.getByRole("textbox", { name: "Full Name (Q1)" })).toHaveValue(
      "",
    );
    expect(screen.getByRole("textbox", { name: "IDOC# (Q1)" })).toHaveValue("");
    expect(screen.getByLabelText("DOB (Q1)")).toHaveValue("");
    expect(screen.getByLabelText("Release Date (Q15)")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  }, 10000);

  test("returns to Page 1 when Back is clicked from Page 2", async () => {
    const user = userEvent.setup();
    await renderIntakeFormModal(page1ValidValues);

    await clickNextPage(user);

    expect(screen.getByText("Page 2 of 4")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "2",
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Back" }));
    });
    await flushFormUpdates();

    expect(screen.getByText("Page 1 of 4")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "1",
    );
    expect(
      screen.getByRole("textbox", { name: "Full Name (Q1)" }),
    ).toBeInTheDocument();
  });

  test("opens Page 3 after Page 2 required fields are filled", async () => {
    const user = userEvent.setup();
    await renderIntakeFormModal(page2ValidValues);

    await clickNextPage(user);

    expect(screen.getByText("Page 2 of 4")).toBeInTheDocument();
    expectSelectDisplayValue("Preferred District (Q29)", "D1");
    expectSelectDisplayValue("Signature Provided (Q31)", "Yes");
    expect(screen.getByLabelText("Signature Date (Q31)")).toHaveValue(
      "06/01/2026",
    );
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

    await clickNextPage(user);

    expect(screen.getByText("Page 3 of 4")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "3",
    );
    expect(
      screen.getByRole("combobox", { name: "Accommodations (Q#2)" }),
    ).toBeInTheDocument();
  });

  test("opens Page 4 when Next page is clicked from Page 3", async () => {
    const user = userEvent.setup();
    await renderIntakeFormModal(page2ValidValues);

    await clickNextPage(user);
    await clickNextPage(user);

    expect(screen.getByText("Page 3 of 4")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "3",
    );

    await clickNextPage(user);

    expect(screen.getByText("Page 4 of 4")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "4",
    );
    expect(
      screen.getByRole("combobox", { name: "Accommodations (Q#5)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", {
        name: "Other Medical Accommodations (Q#5)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Additional Medical Info (Q#5)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "SSI 90-Day Care Plan (Q#6)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Faith-Based Provider Info (Q#7)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose providers" }),
    ).toBeInTheDocument();
  });

  test("keeps the intake form open when housing application save fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    testDoubles.submitDraftApplication.mockImplementation((_input, options) => {
      options?.onError?.(new Error("Save failed"));
    });

    await act(async () => {
      render(
        <IntakeFormModal
          isOpen
          onClose={vi.fn()}
          onSubmit={onSubmit}
          pdf="https://example.com/prepared-application.pdf"
          defaultValues={{
            ...page1ValidValues,
            preferredDistrict: ["D1"],
            signatureDate: "06/01/2026",
            signatureProvided: true,
          }}
        />,
      );
    });
    await flushFormUpdates();

    await clickNextPage(user);
    await clickNextPage(user);
    await clickNextPage(user);

    expect(screen.getByText("Page 4 of 4")).toBeInTheDocument();

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Choose providers" }),
      );
    });
    await flushFormUpdates();

    expect(testDoubles.submitDraftApplication).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Page 4 of 4")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "4",
    );
    expect(
      screen.getByRole("button", { name: "Choose providers" }),
    ).toBeInTheDocument();
  });

  test("calls onSubmit when housing application save succeeds", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    testDoubles.submitDraftApplication.mockImplementation((_input, options) => {
      options?.onSuccess?.({ id: "application-123" });
    });

    await act(async () => {
      render(
        <IntakeFormModal
          isOpen
          onClose={vi.fn()}
          onSubmit={onSubmit}
          pdf="https://example.com/prepared-application.pdf"
          defaultValues={{
            ...page1ValidValues,
            preferredDistrict: ["D1"],
            signatureDate: "06/01/2026",
            signatureProvided: true,
          }}
        />,
      );
    });
    await flushFormUpdates();

    await clickNextPage(user);
    await clickNextPage(user);
    await clickNextPage(user);

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Choose providers" }),
      );
    });
    await flushFormUpdates();

    expect(testDoubles.submitDraftApplication).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("application-123");
  });

  test("opens with extracted default values prefilled across all pages", async () => {
    const user = userEvent.setup();
    const extractedValues: HousingApplicationForm = {
      ...DEFAULT_FORM_VALUES,
      age: 35,
      accommodations: ["Wheelchair", "Oxygen"],
      accommodationsInfo: "Needs first floor access.",
      addictions: false,
      additionalMedicalInfo: "Needs medication refrigeration.",
      benefitsDuration: "12 months",
      benefitsReinstatementDate: "07/15/2026",
      child1Info: "Child One, female, 8",
      child2Info: "Child Two, male, 6",
      child3Info: "Child Three, male, 4",
      childFamilyServicesDocumentation: [
        "Order of Guardianship",
        "Custody Agreement",
      ],
      childVisitationInfo: "Saturday visitation approved.",
      childVisitationRequired: true,
      clientFullName: "John Doe",
      cmPoEmail: "po@example.com",
      cmPoName: "Officer Smith",
      cmPoPhone: "2085550111",
      contagiousDisease: false,
      currentFacilityLocation: "Boise Facility",
      dob: "01/01/1999",
      emergencyContactName: "Jane Doe",
      emergencyContactPhone: "2085550199",
      emergencyContactRelationship: "Sister",
      employer: "Acme Warehouse",
      employerContact: "2085550177",
      employmentOnRelease: true,
      faithBasedPreferred: true,
      faithBasedProviderInfo: "Open to faith-based providers.",
      gender: "Male",
      housingProbationParoleAtRelease: true,
      idocNumber: "123456",
      idsOnFile: ["Driver's License", "Social Security Card"],
      lastUseDate: "04/01/2026",
      legalBackupForIcOrIce: false,
      legalCountyOfCrime: "Ada",
      legalCurrentStatus: "Rider",
      legalMostRecentConviction: "Burglary",
      legalSexOffenderRegistry: false,
      medicalAccommodations: ["Prescription Medication", "MOUD/MAT Program"],
      medicalMhSupportNeeded: true,
      militaryService: false,
      otherAccommodations: "Ground floor unit",
      otherMedicalAccommodation: "Daily insulin storage",
      parentGuardianNames: "Jane Doe",
      paroleHearingCompleted: true,
      personalPhoneNumber: "2085551234",
      prescribedMedications: "Metformin",
      preferredDistrict: ["D1", "D3"],
      preferredProviders: ["provider-one", "provider-two", "provider-three"],
      previousHomeCity: "Nampa",
      previousHomeName: "Hope House",
      previousTransitionalHome: true,
      priorInvoluntaryDischarge: false,
      signatureDate: "06/01/2026",
      signatureProvided: true,
      ssi90DayCarePlan: "Care plan already requested.",
      ssiSsdiSsrbMedicareMedicaid: true,
      ssnLast4: "6789",
      substances: "Alcohol",
      tpdHousingNeededDate: "07/01/2026",
      underInfluenceAtCrime: false,
      vaEnrolled: false,
      vehicleOnSite: true,
      violenceDischargeDescription: "No discharge concerns.",
      violenceHistoryDors: false,
    };

    await act(async () => {
      render(
        <IntakeFormModal
          isOpen
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          pdf="https://example.com/prepared-application.pdf"
          defaultValues={extractedValues}
        />,
      );
    });
    await flushFormUpdates();

    await waitFor(() => {
      expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
        "data-signed-url",
        "https://example.com/prepared-application.pdf",
      );
      expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
        "data-page-number",
        "1",
      );
    });
    expect(
      await screen.findByRole("textbox", { name: "Full Name (Q1)" }),
    ).toHaveValue("John Doe");
    expectTextboxValue("IDOC# (Q1)", "123456");
    expectComboboxValue("Gender (Q2)", "Male");
    expectDisplayedValue("07/01/2026");
    expectDisplayedValue("01/01/1999");
    expectTextboxValue("Age (Q1)", "35");
    expectTextboxValue("Facility", "Boise Facility");
    expectTextboxValue("SSN (last 4) (Q1)", "6789");
    expectTextboxValue("CM/PO Contact Email", "po@example.com");
    expectTextboxValue("CM/PO Phone Number", "208-555-0111");
    expectTextboxValue("Emergency Contact Name (Q4)", "Jane Doe");
    expectTextboxValue("Relationship (Q4)", "Sister");
    expectTextboxValue("Client Phone Number (Q3)", "208-555-1234");
    expectTextboxValue("Emergency Contact Phone (Q5)", "208-555-0199");
    expectComboboxValue("Current Status (Q6)", "Rider");
    expectTextboxValue("Most Recent Conviction (Q7)", "Burglary");
    expectComboboxValue("County of Crime (Q8)", "Ada");
    expectSelectDisplayValue("Sex Offender Registry (Q9)", "No");
    expectSelectDisplayValue("Backup for IC or ICE (Q10)", "No");
    expectSelectDisplayValue("Child Visitation Required (Q11)", "Yes");
    expectSelectDisplayValue("Prior Involuntary Discharge (Q12)", "No");
    expectSelectDisplayValue("Violence History / DORs (Q13)", "No");
    expectSelectDisplayValue("Parole Hearing Completed (Q15)", "Yes");
    expectSelectDisplayValue("Probation/Parole at Release (Q14)", "Yes");
    expectSelectDisplayValue("Vehicle on Site (Q16)", "Yes");
    expectSelectDisplayValue(
      "IDs on File (Q17)",
      "Driver's License, Social Security Card",
    );
    expectSelectDisplayValue("Military Service (Q18)", "No");
    expectSelectDisplayValue("VA Enrolled (Q18)", "No");
    expectSelectDisplayValue("Employment on Release (Q19)", "Yes");

    await clickNextPage(user);

    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "2",
    );
    expectSelectDisplayValue("Preferred District (Q29)", "D1, D3");
    expectSelectDisplayValue("Faith-Based Preferred (Q27)", "Yes");
    expectComboboxValue("Preferred Provider 1 (Q30)", "Provider One");
    expectComboboxValue("Preferred Provider 2 (Q30)", "Provider Two");
    expectComboboxValue("Preferred Provider 3 (Q30)", "Provider Three");
    expectTextboxValue("Employer (Q20)", "Acme Warehouse");
    expectTextboxValue("Employer Contact (Q20)", "208-555-0177");
    expectSelectDisplayValue("Medical/MH Support Needed (Q21)", "Yes");
    expectSelectDisplayValue("Contagious Disease (Q22)", "No");
    expectSelectDisplayValue("SSI/SSDI/SSRB/Medicare/Medicaid (Q23)", "Yes");
    expectDisplayedValue("07/15/2026");
    expectTextboxValue("Benefits Duration (Q23)", "12 months");
    expectTextboxValue("Prescribed Medications (Q24)", "Metformin");
    expectSelectDisplayValue("Under Influence at Crime (Q26)", "No");
    expectSelectDisplayValue("Addictions (Q25)", "No");
    expectTextboxValue("Substances (Q25)", "Alcohol");
    expectDisplayedValue("04/01/2026");
    expectSelectDisplayValue("Previous Transitional Home (Q28)", "Yes");
    expectTextboxValue("Previous Transitional Home Name (Q28)", "Hope House");
    expectTextboxValue("Previous Transitional Home City (Q28)", "Nampa");
    expectTextboxValue("CM/PO Name (Q31)", "Officer Smith");
    expectSelectDisplayValue("Signature Provided (Q31)", "Yes");
    expectDisplayedValue("06/01/2026");

    await clickNextPage(user);

    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "3",
    );
    expectComboboxValue("Accommodations (Q#2)", "Wheelchair, Oxygen");
    expectTextboxValue("Other Assistance Needed (Q#2)", "Ground floor unit");
    expectTextboxValue(
      "Additional Accommodations Info (Q#2)",
      "Needs first floor access.",
    );
    expectSelectDisplayValue(
      "Documentation (Q#3)",
      "Order of Guardianship, Custody Agreement",
    );
    expectTextboxValue("Parent/Guardian name(s) (Q#3)", "Jane Doe");
    expectTextboxValue(
      "Child 1 (name, gender, age, special info) (Q#3)",
      "Child One, female, 8",
    );
    expectTextboxValue(
      "Child 2 (name, gender, age, special info) (Q#3)",
      "Child Two, male, 6",
    );
    expectTextboxValue(
      "Child 3 (name, gender, age, special info) (Q#3)",
      "Child Three, male, 4",
    );
    expectTextboxValue(
      "Additional Child/Family Info (Q#3)",
      "Saturday visitation approved.",
    );
    expectTextboxValue(
      "Violence/Discharge Description (Q#4)",
      "No discharge concerns.",
    );

    await clickNextPage(user);

    expect(screen.getByTestId("pdf-viewer")).toHaveAttribute(
      "data-page-number",
      "4",
    );
    expectComboboxValue(
      "Accommodations (Q#5)",
      "Prescription Medication, MOUD/MAT Program",
    );
    expectTextboxValue(
      "Other Medical Accommodations (Q#5)",
      "Daily insulin storage",
    );
    expectTextboxValue(
      "Additional Medical Info (Q#5)",
      "Needs medication refrigeration.",
    );
    expectTextboxValue(
      "SSI 90-Day Care Plan (Q#6)",
      "Care plan already requested.",
    );
    expectTextboxValue(
      "Faith-Based Provider Info (Q#7)",
      "Open to faith-based providers.",
    );
  }, 20000);
});
