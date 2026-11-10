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

import React from "react";

import { Modal } from "../../../Modal/Modal";
import { ProviderSelectionView } from "../ProviderSelectionView/ProviderSelectionView";

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent?: (count: number) => void;
}

export const AddProviderModal: React.FC<AddProviderModalProps> = ({
  isOpen,
  onClose,
  onSent,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      hideModal={onClose}
      width="35rem"
      height="42rem"
      padding="0"
    >
      {/* useProviderSelection calls onClose right after onSent on a
          successful send, both in the same state update, so this modal
          closes in the same render pass as the ancestor-owned success
          modal opening - never nested. */}
      <ProviderSelectionView
        variant="modal"
        onClose={onClose}
        onSent={onSent}
      />
    </Modal>
  );
};
