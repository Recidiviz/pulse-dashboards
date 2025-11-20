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

import React from "react";

import { useScrollToBottom } from "~@reentry/frontend/components/IntakeChatV2/hooks/useScrollToBottom";
import styles from "~@reentry/frontend/components/IntakeChatV2/Interstitials/PreIntake/PreIntake.module.css";
import ScrollToBottomButton from "~@reentry/frontend/components/IntakeChatV2/ScrollToBottomButton/ScrollToBottomButton";
import { IntakeChatV2CommonStyles as common } from "~@reentry/frontend-shared";
interface StepTwoProps {
  onGoBack: () => void;
  onStartIntake: () => void;
}

const StepTwo: React.FC<StepTwoProps> = ({ onGoBack, onStartIntake }) => {
  const {
    ref: cardRef,
    showScrollToBottom,
    scrollToBottom,
  } = useScrollToBottom<HTMLDivElement>({ threshold: 95 });

  return (
    <div className={styles["noteContainer"]}>
      <div ref={cardRef} className={styles["noteCard"]}>
        <h1 className={styles["noteTwoTitle"]}>Before You Start</h1>
        <div className={styles["noteTwoBody"]}>
          <div className={styles["section"]}>
            <h3 className={styles["sectionTitle"]}>
              Who will I be chatting with?
            </h3>
            <p className={styles["sectionText"]}>
              In this intake, you will be interacting with a chatbot, not a live
              person.
            </p>
          </div>
          <div className={styles["section"]}>
            <h3 className={styles["sectionTitle"]}>
              What will this intake cover?
            </h3>
            <p className={styles["sectionText"]}>
              This intake will cover topics related to education, employment,
              criminal history, finances, family and marital details, housing,
              leisure and recreation, and alcohol and drugs.
            </p>
          </div>
          <div className={styles["section"]}>
            <h3 className={styles["sectionTitle"]}>
              Who will see my responses?
            </h3>
            <p className={styles["sectionText"]}>
              Your responses to this intake will be visible to your case manager
              and to your supervisory officer after release.
            </p>
          </div>
          <div className={styles["section"]}>
            <h3 className={styles["sectionTitle"]}>
              Important things to know:
            </h3>
            <ul className={styles["list"]}>
              <li className={styles["listItem"]}>
                <span className={styles["bullet"]} />
                <p>
                  <span className={styles["boldLabel"]}>Time:</span> This intake
                  will take approximately 45 minutes to complete.
                </p>
              </li>
              <li className={styles["listItem"]}>
                <span className={styles["bullet"]} />
                <p>
                  <span className={styles["boldLabel"]}>Pace:</span> Some
                  questions might require careful thought. Feel free to pause
                  and reflect as much as you need.
                </p>
              </li>
              <li className={styles["listItem"]}>
                <span className={styles["bullet"]} />
                <p>
                  <span className={styles["boldLabel"]}>
                    Pausing and continuing:
                  </span>{" "}
                  Your progress is automatically saved, so you can leave the
                  intake chat and return later if you need to pause and resume
                  later.
                </p>
              </li>
              <li className={styles["listItem"]}>
                <span className={styles["bullet"]} />
                <p>
                  <span className={styles["boldLabel"]}>Deadline:</span> This
                  intake should be completed before your re-entry to help
                  develop a plan. The sooner you can finish it, the better.
                </p>
              </li>
            </ul>
          </div>
        </div>

        {showScrollToBottom && (
          <ScrollToBottomButton scrollToBottom={scrollToBottom} />
        )}

        <div className={styles["noteButtonContainer"]}>
          <button
            type="button"
            onClick={onGoBack}
            className={`${styles["buttonCommon"]} ${styles["goBack"]} ${common["buttonBase"]} ${common["buttonSecondary"]}`}
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={onStartIntake}
            className={`${styles["buttonCommon"]} ${styles["continue"]} ${common["buttonBase"]} ${common["buttonPrimary"]}`}
          >
            Start Intake
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepTwo;
