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

import { useApplicationContext } from "../../contexts/ApplicationContext";
import { clearIntakeSession } from "../../utils/clearIntakeSession";
import type { HardStopGuardrailType } from "../../websockets/eventTypes";
import styles from "./GuardrailModal.module.css";

const CONTENT: Record<HardStopGuardrailType, { title: string; body: string }> =
  {
    prompt_injection: {
      title: "Session ended",
      body: "This session has been ended because a restricted message was detected.",
    },
    crisis: {
      title: "We're here to help",
      body: "It looks like you may need immediate support. Please speak with your caseworker or call 988 (Suicide & Crisis Lifeline) for help.",
    },
  };

const DEFAULT_CONTENT = {
  title: "Session ended",
  body: "This session has been ended. Please speak with your caseworker to continue.",
};

interface GuardrailModalProps {
  reason: HardStopGuardrailType;
}

export const GuardrailModal: React.FC<GuardrailModalProps> = ({ reason }) => {
  const { navigateAfterIntake } = useApplicationContext();
  const { title, body } = CONTENT[reason] ?? DEFAULT_CONTENT;

  const handleReturnHome = () => {
    clearIntakeSession();
    navigateAfterIntake();
  };

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
            className={styles["returnHomeButton"]}
            onClick={handleReturnHome}
          >
            Return home
          </button>
        </div>
      </div>
    </Modal>
  );
};
