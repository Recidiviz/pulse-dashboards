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

import { useForm, useStore } from "@tanstack/react-form";
import { rem } from "polished";
import { useId, useState } from "react";
import ReactModal from "react-modal";
import styled from "styled-components";

import { calendarApiError } from "~@parole-board/common/fixtures";
import { Button, ModalHeading } from "~design-system";

import { semantics } from "../../theme";
import { RadioGridItem } from "../ChoiceGrid";
import { RadioGridField } from "./ChoiceFields";
import { ModalForm } from "./ModalForm";

// The Modal opens on the first render, so the app element is set when the
// examples load rather than in an effect, which would run after it.
ReactModal.setAppElement(
  document.getElementById("storybook-root") ?? document.body,
);

const { space, text, type } = semantics;

const FieldLabel = styled.p`
  ${type.Sans12}
  margin: ${rem(space.md)} 0 ${rem(space.xs)};
  color: ${text.secondary};
  text-transform: uppercase;
`;

const KINDS = ["Hearing", "Full Board", "Business Meeting"];
const FACILITIES = ["Facility A", "Facility B", "Facility C", "Facility D"];

type Values = { kind: string; facility: string | null };

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * A dialog shaped like Add a hearing: two tile choices and a submit that sends a fake request. submitOnOpen clicks the
 * submit button as the dialog opens, to show what follows a submit.
 */
function ExampleDialog({
  send,
  facility = null,
  submitOnOpen = false,
}: {
  send: () => Promise<void>;
  facility?: string | null;
  submitOnOpen?: boolean;
}) {
  const [isOpen, setOpen] = useState(true);
  const typeLabelId = useId();
  const facilityLabelId = useId();
  const form = useForm({
    defaultValues: { kind: KINDS[0], facility } as Values,
    onSubmit: async () => {
      await send();
      setOpen(false);
    },
  });
  const chosen = useStore(form.store, (state) => state.values.facility);

  return (
    <>
      <Button kind="secondary" shape="block" onClick={() => setOpen(true)}>
        Open the dialog
      </Button>
      <ModalForm
        form={form}
        isOpen={isOpen}
        contentLabel="Add a hearing"
        submitLabel="Add hearing"
        submitDisabled={chosen === null}
        errorMessage="We couldn't add this hearing."
        onCancel={() => setOpen(false)}
        onAfterClose={() => form.reset()}
        onAfterOpen={(options) => {
          if (!submitOnOpen) return;
          options?.contentEl
            .querySelector<HTMLButtonElement>('button[type="submit"]')
            ?.click();
        }}
      >
        <ModalHeading>Add a hearing</ModalHeading>
        <FieldLabel id={typeLabelId}>Type</FieldLabel>
        <form.Field name="kind">
          {(field) => (
            <RadioGridField
              field={field}
              ariaLabelledBy={typeLabelId}
              columns={3}
            >
              {KINDS.map((kind) => (
                <RadioGridItem key={kind} value={kind}>
                  {kind}
                </RadioGridItem>
              ))}
            </RadioGridField>
          )}
        </form.Field>
        <FieldLabel id={facilityLabelId}>Facility</FieldLabel>
        <form.Field name="facility">
          {(field) => (
            <RadioGridField
              field={field}
              ariaLabelledBy={facilityLabelId}
              columns={4}
            >
              {FACILITIES.map((name) => (
                <RadioGridItem key={name} value={name}>
                  {name}
                </RadioGridItem>
              ))}
            </RadioGridField>
          )}
        </form.Field>
      </ModalForm>
    </>
  );
}

export default {};

/**
 * Nothing chosen yet, so Add hearing is disabled. Choosing a facility and
 * pressing Add hearing, or Enter on a tile, sends a request that takes a
 * second and a half, then closes the dialog.
 */
export const Default = () => <ExampleDialog send={() => wait(1500)} />;

/** A request that never ends: the button waits and Escape is ignored. */
export const Submitting = () => (
  <ExampleDialog
    facility={FACILITIES[0]}
    send={() => new Promise(() => undefined)}
    submitOnOpen
  />
);

/** The server refused the request with a message written for editors. */
export const ServerError = () => (
  <ExampleDialog
    facility={FACILITIES[0]}
    send={() =>
      Promise.reject(
        calendarApiError("CONFLICT", "Facility A is already on September 14."),
      )
    }
    submitOnOpen
  />
);
