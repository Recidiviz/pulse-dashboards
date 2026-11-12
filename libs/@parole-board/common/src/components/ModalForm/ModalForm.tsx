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

import { rem } from "polished";
import {
  FormEvent,
  KeyboardEvent,
  ReactNode,
  RefObject,
  useId,
  useRef,
  useState,
} from "react";
import styled from "styled-components";

import { Modal, type ModalProps } from "~design-system";

import { editorErrorMessage } from "../../api/errors";
import { semantics } from "../../theme";
import { Callout } from "../Callout";
import {
  ParoleBoardButton,
  type ParoleBoardButtonKind,
} from "../ParoleBoardButton";
import { useRestoreFocusAfterSubmit } from "./useRestoreFocusAfterSubmit";

const { space } = semantics;

/** A dialog's Cancel and submit buttons, at the right below its content. */
export const ModalActionRow = styled.div`
  display: flex;
  gap: ${rem(space.sm)};
  justify-content: flex-end;
  margin-top: ${rem(space.lg)};
`;

const ErrorSlot = styled.div`
  margin-top: ${rem(space.md)};
`;

/**
 * A dialog's error above its buttons. id lets the submit button point at it
 * with aria-describedby, so a screen reader reads the error again when focus
 * returns to the button.
 */
export function ModalError({ id, children }: { id: string; children: string }) {
  return (
    <ErrorSlot id={id}>
      <Callout tone="error">{children}</Callout>
    </ErrorSlot>
  );
}

/**
 * The Modal props that keep a dialog open while its request runs: Escape,
 * the overlay and onRequestClose do nothing until it ends, so the request's
 * result always reaches the dialog.
 */
export function modalCloseProps(busy: boolean, onClose: () => void) {
  return {
    shouldCloseOnEsc: !busy,
    shouldCloseOnOverlayClick: !busy,
    onRequestClose: () => {
      if (!busy) onClose();
    },
  } satisfies Partial<ModalProps>;
}

/**
 * The parts of a TanStack Form instance, the result of useForm, that
 * ModalForm uses.
 */
export type ModalFormApi = {
  handleSubmit: () => Promise<void>;
  Subscribe: (props: {
    selector: (state: { isSubmitting: boolean }) => boolean;
    children: (isSubmitting: boolean) => ReactNode;
  }) => ReactNode;
};

export type ModalFormProps = {
  /** The form from useForm. Its onSubmit sends the request. */
  form: ModalFormApi;
  isOpen: boolean;
  /** The dialog's accessible name, usually its heading's text. */
  contentLabel: string;
  submitLabel: ReactNode;
  /** "destructive" for a submit that deletes or overwrites data. */
  submitKind?: ParoleBoardButtonKind;
  /** Disables the submit button, such as while nothing is chosen. */
  submitDisabled?: boolean;
  /**
   * The error shown when onSubmit fails with an error the server didn't
   * write for editors, such as "We couldn't add this hearing."
   */
  errorMessage: string;
  /** Closes the dialog. Cancel, Escape and the overlay call it. */
  onCancel: () => void;
  onAfterOpen?: ModalProps["onAfterOpen"];
  onAfterClose?: () => void;
  className?: string;
  /** The heading and the fields, usually form.Field elements. */
  children: ReactNode;
};

type ModalFormContentProps = Pick<
  ModalFormProps,
  | "form"
  | "submitLabel"
  | "submitKind"
  | "submitDisabled"
  | "errorMessage"
  | "onCancel"
  | "children"
> & {
  submitting: boolean;
  dialogRef: RefObject<HTMLDivElement | null>;
};

function ModalFormContent({
  form,
  submitting,
  dialogRef,
  submitLabel,
  submitKind = "primary",
  submitDisabled = false,
  errorMessage,
  onCancel,
  children,
}: ModalFormContentProps) {
  const errorId = useId();
  const submitRef = useRef<HTMLButtonElement>(null);
  // Wrapped, since anything can be thrown, undefined included.
  const [failure, setFailure] = useState<{ error: unknown } | null>(null);
  const message = failure && editorErrorMessage(failure.error, errorMessage);

  useRestoreFocusAfterSubmit(submitting, {
    hold: dialogRef,
    restore: [submitRef],
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The dialog renders in a portal, and React passes its events up the
    // component tree, so a form around the dialog's opener mustn't see this.
    event.stopPropagation();
    // TODO(CO-958): The ~design-system DropdownMenuItem renders a <button>
    // with no type, which is a submit button, so choosing an item in a menu
    // inside the form submits it. Only this form's own submit button may
    // submit; drop this check once DropdownMenuItem sets type="button".
    const { submitter } = event.nativeEvent as SubmitEvent;
    if (submitter !== submitRef.current || submitting) return;
    setFailure(null);
    form.handleSubmit().catch((error: unknown) => setFailure({ error }));
  };

  // Enter in a field submits through this form's own button. A browser
  // would click the form's first submit button instead, which can be a menu
  // item's bare <button> (see the TODO in submit), so the guard would drop the
  // submit and the menu item would act.
  const submitOnEnter = (event: KeyboardEvent<HTMLFormElement>) => {
    const { target } = event;
    if (
      event.key !== "Enter" ||
      event.defaultPrevented ||
      event.nativeEvent.isComposing ||
      !(target instanceof HTMLInputElement) ||
      target.type === "submit" ||
      target.type === "button"
    ) {
      return;
    }
    event.preventDefault();
    const button = submitRef.current;
    if (button && !button.disabled) event.currentTarget.requestSubmit(button);
  };

  return (
    // The form only reroutes Enter from its own fields to its submit button,
    // which keeps the keyboard behaviour a form already has.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <form noValidate onSubmit={submit} onKeyDown={submitOnEnter}>
      {children}
      {message && <ModalError id={errorId}>{message}</ModalError>}
      <ModalActionRow>
        <ParoleBoardButton
          type="button"
          kind="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </ParoleBoardButton>
        <ParoleBoardButton
          ref={submitRef}
          type="submit"
          kind={submitKind}
          disabled={submitDisabled}
          waiting={submitting}
          aria-describedby={message ? errorId : undefined}
        >
          {submitLabel}
        </ParoleBoardButton>
      </ModalActionRow>
    </form>
  );
}

/**
 * A dialog holding a <form> whose state is a TanStack Form (useForm), for
 * the calendar's input dialogs, such as Add a month and Add a hearing. Enter
 * in a field submits, as in any form, and only the submit button can submit.
 * It renders Cancel and the submit button, which waits while the form's
 * onSubmit runs, and while it does, Escape and the overlay don't close the
 * dialog. Focus stays in the dialog while the request runs and returns to
 * the submit button after it fails. A failure shows above the buttons: the
 * server's message when it was written for editors (editorErrorMessage), and
 * errorMessage otherwise.
 *
 * onSubmit closes the dialog when the request succeeds. A failure that means
 * the editor's copy of the month is stale (STALE_CALENDAR_CODES) has already
 * refetched the month; a dialog that closes instead of showing it catches
 * that error in onSubmit and closes there.
 *
 * The dialog's content mounts on each open, so an error clears when it
 * closes; the form's values live in useForm, so the dialog's owner resets
 * them when it should start over.
 */
export function ModalForm({
  form,
  isOpen,
  contentLabel,
  onCancel,
  onAfterOpen,
  onAfterClose,
  className,
  ...contentProps
}: ModalFormProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(submitting) => (
        <Modal
          isOpen={isOpen}
          contentLabel={contentLabel}
          className={className}
          contentRef={(node) => {
            dialogRef.current = node;
          }}
          onAfterOpen={onAfterOpen}
          onAfterClose={onAfterClose}
          {...modalCloseProps(submitting, onCancel)}
        >
          <ModalFormContent
            {...contentProps}
            form={form}
            submitting={submitting}
            dialogRef={dialogRef}
            onCancel={onCancel}
          />
        </Modal>
      )}
    </form.Subscribe>
  );
}
