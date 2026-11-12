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

import { useForm } from "@tanstack/react-form";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ReactNode } from "react";
import ReactModal from "react-modal";

import { calendarApiError } from "../../../fixtures";
import { CheckboxGridItem, RadioGridItem } from "../../ChoiceGrid";
import { CheckboxGridField, RadioGridField } from "../ChoiceFields";
import { ModalForm } from "../ModalForm";

type Values = {
  note: string;
  facility: string | null;
  days: string[];
};

const DEFAULTS: Values = { note: "", facility: null, days: [] };

function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function TestForm({
  send,
  onCancel = () => undefined,
  before,
  extra,
}: {
  send: (values: Values) => Promise<void>;
  onCancel?: () => void;
  /** Rendered before the fields. */
  before?: ReactNode;
  extra?: ReactNode;
}) {
  const form = useForm({
    defaultValues: DEFAULTS,
    onSubmit: ({ value }) => send(value),
  });
  return (
    <ModalForm
      form={form}
      isOpen
      contentLabel="Add a hearing"
      submitLabel="Add hearing"
      errorMessage="We couldn't add this hearing."
      onCancel={onCancel}
    >
      {before}
      <form.Field name="note">
        {(field) => (
          <label>
            Note
            <input
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </label>
        )}
      </form.Field>
      <form.Field name="facility">
        {(field) => (
          <RadioGridField field={field} ariaLabel="Facility" columns={2}>
            <RadioGridItem value="Facility A">Facility A</RadioGridItem>
            <RadioGridItem value="Facility B">Facility B</RadioGridItem>
          </RadioGridField>
        )}
      </form.Field>
      <form.Field name="days">
        {(field) => (
          <CheckboxGridField field={field} ariaLabel="Days" columns={2}>
            <CheckboxGridItem value="14">14</CheckboxGridItem>
            <CheckboxGridItem value="15">15</CheckboxGridItem>
          </CheckboxGridField>
        )}
      </form.Field>
      {extra}
    </ModalForm>
  );
}

const submitButton = () => screen.getByRole("button", { name: "Add hearing" });

// react-modal reads keyCode, which user-event doesn't set for Escape.
const pressEscape = () =>
  fireEvent.keyDown(document.activeElement ?? document.body, {
    key: "Escape",
    keyCode: 27,
  });

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

describe("ModalForm", () => {
  test("sends the fields' values, including the choice grids'", async () => {
    const send = vi.fn(() => Promise.resolve());
    render(<TestForm send={send} />);

    await userEvent.click(screen.getByRole("radio", { name: "Facility B" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "15" }));
    await userEvent.click(submitButton());

    expect(send).toHaveBeenCalledExactlyOnceWith({
      note: "",
      facility: "Facility B",
      days: ["15"],
    });
  });

  test("Enter in a field submits", async () => {
    const send = vi.fn(() => Promise.resolve());
    render(<TestForm send={send} />);

    await userEvent.type(
      screen.getByRole("textbox", { name: "Note" }),
      "Moved{Enter}",
    );

    expect(send).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ note: "Moved" }),
    );
  });

  test("Enter in a field submits through its own button, not an earlier bare button", async () => {
    const send = vi.fn(() => Promise.resolve());
    const menuItem = vi.fn();
    render(
      <TestForm
        send={send}
        // A menu item as the DS DropdownMenuItem renders it, ahead of the
        // fields: a button with no type, the form's first submit button.
        before={<button onClick={menuItem}>Facility C</button>}
      />,
    );

    await userEvent.type(
      screen.getByRole("textbox", { name: "Note" }),
      "Moved{Enter}",
    );

    expect(send).toHaveBeenCalledOnce();
    expect(menuItem).not.toHaveBeenCalled();
  });

  test("ignores a submit from any button but its own", async () => {
    const send = vi.fn(() => Promise.resolve());
    render(
      <TestForm
        send={send}
        // A menu item as the DS DropdownMenuItem renders it: a button with
        // no type, which submits the form it's in.
        extra={<button>Facility C</button>}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Facility C" }));

    expect(send).not.toHaveBeenCalled();
  });

  test("waits while the request runs, and ignores Escape until it ends", async () => {
    const request = deferred();
    const onCancel = vi.fn();
    render(<TestForm send={() => request.promise} onCancel={onCancel} />);

    await userEvent.click(submitButton());

    expect(submitButton()).toHaveAttribute("aria-busy", "true");
    expect(submitButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    // Focus stays in the dialog while the waiting button is disabled.
    expect(screen.getByRole("dialog")).toHaveFocus();

    pressEscape();
    expect(onCancel).not.toHaveBeenCalled();

    request.resolve();
    await waitFor(() => expect(submitButton()).not.toBeDisabled());

    pressEscape();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  test("shows the server's message for an editor-facing error, describing the submit button, which gets focus back", async () => {
    const { container } = render(
      <TestForm
        send={() =>
          Promise.reject(
            calendarApiError("CONFLICT", "Facility A is already on May 14."),
          )
        }
      />,
    );

    await userEvent.click(submitButton());

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("Facility A is already on May 14.");
    expect(submitButton()).toHaveAccessibleDescription(
      "Facility A is already on May 14.",
    );
    await waitFor(() => expect(submitButton()).toHaveFocus());
    expect(await axe(container)).toHaveNoViolations();
  });

  test("shows errorMessage for any other error, and clears it on the next submit", async () => {
    const request = deferred();
    const send = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockReturnValueOnce(request.promise);
    render(<TestForm send={send} />);

    await userEvent.click(submitButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't add this hearing.",
    );

    await userEvent.click(submitButton());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(submitButton()).not.toHaveAccessibleDescription();
  });
});
