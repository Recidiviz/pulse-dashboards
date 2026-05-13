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

import { BaseModal } from "~@reentry/frontend-shared";

import styles from "./DownloadConfirmModal.module.css";

interface DownloadConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDownloading?: boolean;
}

const DownloadConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDownloading = false,
}: DownloadConfirmModalProps) => {
  const [reviewedPlan, setReviewedPlan] = useState(false);

  const allChecked = reviewedPlan;

  const handleClose = () => {
    setReviewedPlan(false);
    onClose();
  };

  const handleConfirm = () => {
    if (!allChecked) return;
    setReviewedPlan(false);
    onConfirm();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title="Before you download"
      onClose={handleClose}
    >
      <div className={styles["body"]}>
        <div className={styles["disclosure"]}>
          <span className={styles["disclosureIcon"]}>◆</span>
          <p className={styles["disclosureText"]}>
            This action plan was generated with AI assistance. Review it
            carefully before sharing with your client — AI can make mistakes.
          </p>
        </div>

        <label
          className={`${styles["checkboxLabel"]} ${reviewedPlan ? styles["checked"] : ""}`}
        >
          <input
            type="checkbox"
            checked={reviewedPlan}
            onChange={(e) => setReviewedPlan(e.target.checked)}
            className={styles["checkboxInput"]}
          />
          <span className={styles["checkboxText"]}>
            I have read through the full action plan and confirmed it is
            accurate
          </span>
        </label>
      </div>

      <div className={styles["actions"]}>
        <button
          type="button"
          onClick={handleClose}
          className={styles["cancelButton"]}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!allChecked || isDownloading}
          className={styles["confirmButton"]}
        >
          {isDownloading ? "Downloading..." : "Download PDF ↓"}
        </button>
      </div>
    </BaseModal>
  );
};

export default DownloadConfirmModal;
