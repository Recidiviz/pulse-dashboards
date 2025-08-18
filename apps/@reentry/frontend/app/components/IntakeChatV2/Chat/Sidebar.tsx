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

import Image from "next/image";

import styles from "~@reentry/frontend/components/IntakeChatV2/Chat/Sidebar.module.css";
import { StepIndicator } from "~@reentry/frontend/components/IntakeChatV2/Chat/StepsIndicator";
import { useChatContext } from "~@reentry/frontend/components/IntakeChatV2/providers/ChatProvider";
import { getSectionStatuses } from "~@reentry/frontend/components/IntakeChatV2/utils";

interface SidebarProps {
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { sections, messages } = useChatContext();
  const statuses = getSectionStatuses(messages, sections);

  return (
    <div className={styles["container"]}>
      <div className={styles["header"]}>
        <div className={styles["logo"]}>
          <Image
            src="/images/brand.svg"
            alt="Brand logo"
            width={80}
            height={28}
            priority
            className={styles["logoImg"]}
          />
        </div>

        {/* Close Button (mobile) */}
        <button
          type="button"
          onClick={onClose}
          className={styles["closeButton"]}
          aria-label="Close sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-hidden="true"
          >
            <title>Close Icon</title>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Sections */}
      <div className={styles["steps"]}>
        {sections?.map((section, index) => {
          const status = statuses[index];
          const hasNext = index < sections.length - 1;

          return (
            <StepIndicator
              key={section.title}
              status={status}
              hasNext={hasNext}
              text={section.title}
              description={section.description}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
