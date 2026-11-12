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
import { injectable, withDi } from "react-magnetic-di";
import ReactModal from "react-modal";
import { action } from "storybook/actions";

import { useUnpublishMonth } from "~@parole-board/common";
import { mutationResult } from "~@parole-board/common/fixtures";

import { EditPublishedMonthModal } from "./EditPublishedMonthModal";

export default {};

const SEPTEMBER_2026 = { id: "month-2026-9", year: 2026, month: 9 };

const useIdleDi = injectable(
  useUnpublishMonth,
  (): ReturnType<typeof useUnpublishMonth> => mutationResult(),
);
const usePendingDi = injectable(
  useUnpublishMonth,
  (): ReturnType<typeof useUnpublishMonth> =>
    mutationResult({ isPending: true }),
);

/** The open dialog, after setting the app element it hides from screen readers. */
function OpenModal() {
  // The Modal opens on the first render, so the app element is set before
  // it rather than in an effect, which would run after it.
  useState(() =>
    ReactModal.setAppElement(
      document.getElementById("storybook-root") ?? document.body,
    ),
  );
  return (
    <EditPublishedMonthModal
      isOpen
      month={SEPTEMBER_2026}
      onClose={action("onClose")}
    />
  );
}

const IdleModal = withDi(OpenModal, [useIdleDi]);
const PendingModal = withDi(OpenModal, [usePendingDi]);

/** Waiting for the editor to confirm; confirming logs months.unpublish. */
export const Confirm = () => <IdleModal />;

/** months.unpublish is running. */
export const Unpublishing = () => <PendingModal />;
