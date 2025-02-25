// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Opportunity } from "../../WorkflowsStore";
import { DenialCaseNoteModal } from "./UsMe/DenialCaseNoteModal";
import { DocstarsDenialModal } from "./UsNd/DocstarsDenialModal";

export type DenialConfirmationModalProps = {
  opportunity: Opportunity;
  reasons: string[];
  otherReason: string;
  snoozeUntilDate?: Date;
  showModal: boolean;
  onCloseFn: () => void;
  onSuccessFn: () => void;
  onAlternativeSubmissionFn: () => void;
};

const TestingStub = ({ showModal }: DenialConfirmationModalProps) => (
  <div data-testid="stub-modal">
    {showModal ? "MODAL SHOWN" : "MODAL NOT SHOWN"}
  </div>
);

export const DenialConfirmationModals = {
  DenialCaseNoteModal,
  DocstarsDenialModal,
  TestingStub,
} satisfies Record<string, React.ComponentType<DenialConfirmationModalProps>>;

export type DenialConfirmationModalName = keyof typeof DenialConfirmationModals;
