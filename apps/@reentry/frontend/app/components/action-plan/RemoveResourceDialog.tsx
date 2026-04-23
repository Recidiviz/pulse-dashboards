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

import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { BaseModal } from "~@reentry/frontend-shared";

import styles from "./styles/RemoveResourceDialog.module.css";

interface RemoveResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resourceName: string;
  sectionTitle: string;
}

const RemoveResourceDialog = ({
  isOpen,
  onClose,
  onConfirm,
  resourceName,
  sectionTitle,
}: RemoveResourceDialogProps) => {
  return (
    <BaseModal
      isOpen={isOpen}
      title={`Remove ${resourceName}?`}
      onClose={onClose}
    >
      <p className={styles["body"]}>
        Remove <span className={styles["bold"]}>{resourceName}</span> from{" "}
        <span className={styles["bold"]}>{sectionTitle}</span> resources?
        <br />
        <br />
        This change will apply immediately.
      </p>

      <div className={styles["actions"]}>
        <PrimaryButton
          buttonText="Cancel"
          onClick={onClose}
          ignoreCapabilities={true}
        />
        <PrimaryButton
          buttonText="Remove"
          className={styles["removeConfirmButton"]}
          onClick={onConfirm}
          ignoreCapabilities={true}
        />
      </div>
    </BaseModal>
  );
};

export default RemoveResourceDialog;
