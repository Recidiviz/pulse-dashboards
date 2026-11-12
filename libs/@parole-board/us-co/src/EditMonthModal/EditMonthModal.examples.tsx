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

import { useState } from "react";
import ReactModal from "react-modal";

import { editMonthFailedMessage, EditMonthModal } from "./EditMonthModal";

export default {};

const noop = () => undefined;

/** The open dialog, after setting the app element it hides from screen readers. */
function OpenEditMonthModal({
  isUnpublishing = false,
  error,
}: {
  isUnpublishing?: boolean;
  error?: string;
}) {
  // The Modal opens on the first render, so the app element is set before
  // it rather than in an effect, which would run after it.
  useState(() =>
    ReactModal.setAppElement(
      document.getElementById("storybook-root") ?? document.body,
    ),
  );
  return (
    <EditMonthModal
      isOpen
      monthLabel="September 2026"
      isUnpublishing={isUnpublishing}
      error={error}
      onConfirm={noop}
      onCancel={noop}
    />
  );
}

export const Confirm = () => <OpenEditMonthModal />;

export const Unpublishing = () => <OpenEditMonthModal isUnpublishing />;

export const GenericError = () => (
  <OpenEditMonthModal error={editMonthFailedMessage("September 2026")} />
);
