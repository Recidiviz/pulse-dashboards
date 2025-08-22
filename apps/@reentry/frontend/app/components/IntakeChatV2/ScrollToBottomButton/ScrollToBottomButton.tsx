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

import styles from "~@reentry/frontend/components/IntakeChatV2/ScrollToBottomButton/ScrollToBottomButton.module.css";

const ScrollToBottomButton = ({
  scrollToBottom,
}: {
  scrollToBottom: () => void;
}) => {
  return (
    <div className={styles["scrollOverlay"]}>
      <button
        type="button"
        aria-label="Scroll to bottom"
        className={styles["scrollToBottomBtn"]}
        onClick={scrollToBottom}
      >
        {/* Down Arrow */}
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          focusable="false"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 14l-7 7-7-7"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
        </svg>
      </button>
    </div>
  );
};

export default ScrollToBottomButton;
