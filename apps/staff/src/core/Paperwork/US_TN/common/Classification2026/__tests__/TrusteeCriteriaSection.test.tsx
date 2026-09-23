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

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { makeAutoObservable } from "mobx";

import { getTrusteeCriterionNumber, TRUSTEE_CRITERIA } from "~datatypes";

import { FormBase } from "../../../../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { OpportunityFormProvider } from "../../../../OpportunityFormContext";
import {
  CriteriaSection,
  TRUSTEE_SECTIONS,
  TrusteeAssessmentHeader,
} from "../TrusteeCriteriaSection";

function renderWithForm(sectionIndex: number, form: FormBase<any>) {
  const { section, groups } = TRUSTEE_SECTIONS[sectionIndex];

  render(
    <OpportunityFormProvider value={form}>
      <CriteriaSection section={section} groups={groups} />
    </OpportunityFormProvider>,
  );
}

function renderSection(
  sectionIndex: number,
  formData: Record<string, string> = {},
) {
  const updateDraftData = vi.fn();
  const clearDraftData = vi.fn();
  const form = {
    formData,
    updateDraftData,
    clearDraftData,
  } as unknown as FormBase<any>;

  renderWithForm(sectionIndex, form);

  return { updateDraftData, clearDraftData };
}

/**
 * Layers the draft over the record's prefilled values the way `FormBase` does,
 * so a test can tell a deleted draft entry from an answer the counselor
 * actually removed. The stub above cannot: its `formData` is a fixed object.
 */
class MergingForm {
  draftData: Record<string, string> = {};

  constructor(private prefilledData: Record<string, string>) {
    makeAutoObservable(this);
  }

  get formData() {
    return { ...this.prefilledData, ...this.draftData };
  }

  updateDraftData(name: string, value: string) {
    this.draftData[name] = value;
  }

  clearDraftData(name: string) {
    delete this.draftData[name];
  }
}

describe("CriteriaSection", () => {
  it("pairs each criterion's two controls into their own radio group", () => {
    renderSection(0);

    const { criteria } = TRUSTEE_SECTIONS[0].groups[0];
    const criterion = criteria[0];
    const n = getTrusteeCriterionNumber(criterion.key);

    const truthy = screen.getByLabelText(`Criterion ${n}: True`);
    const falsy = screen.getByLabelText(`Criterion ${n}: False`);

    expect(truthy).toHaveAttribute("name", criterion.key);
    expect(falsy).toHaveAttribute("name", criterion.key);
  });

  it("gives every criterion a distinct radio group", () => {
    renderSection(0);

    const names = screen
      .getAllByRole("radio")
      .map((radio) => radio.getAttribute("name"));

    expect(names.every(Boolean)).toBeTrue();
    expect(new Set(names).size).toBe(names.length / 2);
  });

  it("renders every criterion in the section with a True and a False control", () => {
    renderSection(0);

    expect(screen.getAllByRole("radio", { name: /: True$/ })).toHaveLength(6);
    expect(screen.getAllByRole("radio", { name: /: False$/ })).toHaveLength(6);
  });

  it("shows the full criterion text, not a truncated label", () => {
    renderSection(0);

    expect(
      screen.getByText(/conviction for First Degree Murder/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /facilitation, solicitation, attempt, or conspiracy to commit First Degree Murder/,
      ),
    ).toBeInTheDocument();
  });

  it("leaves an unanswered criterion with neither control selected", () => {
    renderSection(0);

    screen
      .getAllByRole("radio")
      .forEach((radio) => expect(radio).not.toBeChecked());
  });

  it("returns a criterion to unanswered when its answer is clicked again", () => {
    const { clearDraftData, updateDraftData } = renderSection(0, {
      trusteeHas10YearsOrLessRemaining: "true",
    });

    fireEvent.click(screen.getByRole("radio", { name: "Criterion 1: True" }));

    // The empty string, not a cleared draft entry: see the note on the click
    // handler. Clearing would uncover the record's prefilled answer.
    expect(updateDraftData).toHaveBeenCalledWith(
      "trusteeHas10YearsOrLessRemaining",
      "",
    );
    expect(clearDraftData).not.toHaveBeenCalled();
  });

  it("returns a prefilled criterion to unanswered, not to the record's answer", () => {
    const form = new MergingForm({ trusteeHas10YearsOrLessRemaining: "true" });

    renderWithForm(0, form as unknown as FormBase<any>);

    const truthy = screen.getByRole("radio", { name: "Criterion 1: True" });

    expect(truthy).toBeChecked();

    fireEvent.click(truthy);

    expect(truthy).not.toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Criterion 1: False" }),
    ).not.toBeChecked();
  });

  it("switches the answer rather than clearing when the other control is clicked", () => {
    const { clearDraftData, updateDraftData } = renderSection(0, {
      trusteeHas10YearsOrLessRemaining: "true",
    });

    fireEvent.click(screen.getByRole("radio", { name: "Criterion 1: False" }));

    expect(updateDraftData).toHaveBeenCalledWith(
      "trusteeHas10YearsOrLessRemaining",
      "false",
    );
    expect(clearDraftData).not.toHaveBeenCalled();
  });

  it("distinguishes False from unanswered", () => {
    renderSection(0, { trusteeNotServingForSexualOffense: "false" });

    const checked = screen
      .getAllByRole("radio")
      .filter((radio) => (radio as HTMLInputElement).checked);

    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveAccessibleName("Criterion 3: False");
  });

  it("writes the answer to the draft when a control is picked", () => {
    const { updateDraftData } = renderSection(0);

    fireEvent.click(screen.getByRole("radio", { name: "Criterion 1: True" }));

    expect(updateDraftData).toHaveBeenCalledWith(
      "trusteeHas10YearsOrLessRemaining",
      "true",
    );
  });

  it("repeats the True and False headings on every group", () => {
    renderSection(0);

    const groupHeaders = screen
      .getAllByRole("columnheader")
      .filter((cell) => cell.textContent === "True");

    expect(groupHeaders).toHaveLength(TRUSTEE_SECTIONS[0].groups.length + 1);
  });

  it("explains that a Group E False adds an approver rather than disqualifying", () => {
    renderSection(1);

    const groupE = screen.getByText(/Requires additional approval if not met/);

    expect(
      within(groupE.closest("th") as HTMLElement).getByText(
        /does not disqualify the inmate\. It adds a required approver/,
      ),
    ).toBeInTheDocument();
  });

  describe("the criterion 3 sub-question", () => {
    const SUB_QUESTION = /7 years or less/;

    it("stays hidden while criterion 3 is unanswered or True", () => {
      renderSection(0);
      expect(screen.queryByText(SUB_QUESTION)).toBeNull();

      cleanup();
      renderSection(0, { trusteeNotServingForSexualOffense: "true" });
      expect(screen.queryByText(SUB_QUESTION)).toBeNull();
    });

    it("appears once criterion 3 is marked False", () => {
      renderSection(0, { trusteeNotServingForSexualOffense: "false" });
      expect(screen.getByText(SUB_QUESTION)).toBeInTheDocument();
    });

    it("writes its answer to its own field, not the criterion's", () => {
      const { updateDraftData } = renderSection(0, {
        trusteeNotServingForSexualOffense: "false",
      });

      fireEvent.click(
        screen.getByRole("radio", {
          name: "Criterion 3 follow-up question: True",
        }),
      );

      expect(updateDraftData).toHaveBeenCalledWith(
        "trusteeHas7YearsOrLessRemaining",
        "true",
      );
    });

    it("labels its radios distinctly from the criterion's own", () => {
      renderSection(0, { trusteeNotServingForSexualOffense: "false" });

      expect(screen.getByRole("radio", { name: "Criterion 3: True" })).not.toBe(
        screen.getByRole("radio", {
          name: "Criterion 3 follow-up question: True",
        }),
      );
    });
  });

  describe("failure notes", () => {
    it("shows no note until a criterion is marked False", () => {
      renderSection(0);
      expect(screen.queryByText(/requirement not met/)).toBeNull();
    });

    it("reports both requirements when an Annex criterion fails", () => {
      renderSection(0, { trusteeHas10YearsOrLessRemaining: "false" });

      const lead = screen.getByText("Trustee requirement not met.");

      expect(lead.tagName).toBe("SPAN");
      expect(lead).toHaveStyleRule("font-weight", "600");
      expect(
        screen.getByText(/Annex requirement not met\./),
      ).toBeInTheDocument();
    });

    it("puts the note below the sub-question, not above it", () => {
      renderSection(0, { trusteeNotServingForSexualOffense: "false" });

      const subQuestion = screen.getByText(/7 years or less/);
      const note = screen.getByText("Trustee requirement not met.");

      expect(
        subQuestion.compareDocumentPosition(note) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("boxes the sub-question so it does not read as criterion 3's own text", () => {
      renderSection(0, { trusteeNotServingForSexualOffense: "false" });

      const box = screen
        .getByRole("radio", { name: "Criterion 3 follow-up question: True" })
        .closest("div")?.parentElement;

      expect(box).toHaveStyleRule("border", "1px solid black");
    });

    it("does not report a Group E False as a failed requirement", () => {
      renderSection(1, { trusteeNotScoredHighForViolence: "false" });

      expect(screen.queryByText(/requirement not met/)).toBeNull();
    });

    it("names the Assistant Commissioner in bold when a Group E criterion fails", () => {
      renderSection(1, { trusteeNotScoredHighForViolence: "false" });

      const note = screen.getByText(
        /must approve Trustee custody placement\. That approval is recorded below\./,
      );

      expect(note.tagName).toBe("SPAN");
      expect(note).toHaveStyleRule("font-weight", "600");
    });

    it("shows the Assistant Commissioner note only on the criterion that failed", () => {
      renderSection(1, { trusteeNotScoredHighForViolence: "false" });

      expect(
        screen.getAllByText(/must approve Trustee custody placement/),
      ).toHaveLength(1);
    });
  });
});

describe("TrusteeAssessmentHeader", () => {
  it("names the instrument and the assessment on separate lines", () => {
    render(<TrusteeAssessmentHeader />);

    const title = screen.getByRole("heading", { level: 1 });

    expect(title).toHaveTextContent(/TENNESSEE CLASSIFICATION INSTRUMENT/);
    expect(title).toHaveTextContent(/TRUSTEE AND ANNEX ASSESSMENT/);
  });

  it("points at the User's Guide for the full instructions", () => {
    render(<TrusteeAssessmentHeader />);

    expect(
      screen.getByText(/Pilot Classification User.s Guide/),
    ).toBeInTheDocument();
  });

  it("reads its criterion numbers off the criteria list", () => {
    render(<TrusteeAssessmentHeader />);

    const hardBars = TRUSTEE_CRITERIA.filter((c) => c.isHardBar);
    const conditional = TRUSTEE_CRITERIA.filter((c) => !c.isHardBar);

    expect(
      screen.getByText(
        new RegExp(
          `Criteria 1 to ${hardBars.length} must be marked True for placement on Trustee custody`,
        ),
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        new RegExp(
          `criteria ${getTrusteeCriterionNumber(conditional[0].key)} or ` +
            `${getTrusteeCriterionNumber(conditional[1].key)} is False`,
        ),
      ),
    ).toBeInTheDocument();
  });

  it("states the Annex route a sex offender can still take", () => {
    render(<TrusteeAssessmentHeader />);

    expect(
      screen.getByText(
        /Criterion 3 may be False if the inmate has 7 years or less remaining/,
      ),
    ).toBeInTheDocument();
  });
});
