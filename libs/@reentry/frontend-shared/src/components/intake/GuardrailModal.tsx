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

"use client";

import type React from "react";
import Modal from "react-modal";

import { getGuardrailCopy } from "../../configs/overrides/utils";
import type {
  HardStopGuardrailType,
  SoftStopGuardrailType,
} from "../../websockets/eventTypes";
import { useSocket } from "../../websockets/IntakeSocketContext";
import styles from "./styles/GuardrailModal.module.css";

interface GuardrailModalProps {
  reason: HardStopGuardrailType | SoftStopGuardrailType;
  onAction: () => void;
}

export const GuardrailModal: React.FC<GuardrailModalProps> = ({
  reason,
  onAction,
}) => {
  const {
    intakeContext: { client_state },
  } = useSocket();

  const { title, body, buttonLabel } = getGuardrailCopy(reason, client_state);

  return (
    <Modal
      isOpen
      overlayClassName={styles["overlay"]}
      className={styles["content"]}
      ariaHideApp={false}
      parentSelector={() => document.getElementById("root") || document.body}
    >
      <div className={styles["card"]}>
        <div className={styles["header"]}>
          <p className={styles["title"]}>{title}</p>
        </div>
        <div className={styles["body"]}>
          <p className={styles["message"]}>{body}</p>
          <button
            type="button"
            className={styles["actionButton"]}
            onClick={onAction}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
