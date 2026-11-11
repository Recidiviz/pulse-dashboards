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

import { fireEvent, render, screen } from "@testing-library/react";
import { observable, runInAction } from "mobx";

import { FormBase } from "../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { useReactiveInput } from "../utils";

function setup() {
  const updateDraftData = vi.fn();
  const form = observable({
    formData: {},
    formIsReverting: false,
    inputFlushRequests: 0,
    updateDraftData,
  }) as unknown as FormBase<any>;

  function Narrative() {
    const [value, onChange] = useReactiveInput<HTMLTextAreaElement>(
      "narrative",
      form,
    );
    return (
      <textarea
        aria-label="Narrative"
        value={String(value ?? "")}
        onChange={onChange}
      />
    );
  }
  render(<Narrative />);

  return { form, updateDraftData };
}

describe("useReactiveInput", () => {
  it("saves a debounced value as soon as the form asks for a flush", () => {
    const { form, updateDraftData } = setup();

    fireEvent.change(screen.getByLabelText("Narrative"), {
      target: { value: "Completed treatment." },
    });
    expect(updateDraftData).not.toHaveBeenCalled();

    runInAction(() => {
      form.inputFlushRequests += 1;
    });

    expect(updateDraftData).toHaveBeenCalledWith(
      "narrative",
      "Completed treatment.",
    );
  });
});
