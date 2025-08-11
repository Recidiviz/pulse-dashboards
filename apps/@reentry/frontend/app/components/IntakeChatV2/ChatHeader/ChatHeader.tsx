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

import styles from "~@reentry/frontend/components/IntakeChatV2/ChatHeader/ChatHeader.module.css";

interface ChatHeaderProps {
  firstName: string | null;
  lastName: string | null;
  docId?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  firstName,
  lastName,
  docId,
}) => {
  const initials =
    `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  return (
    <div className={`${styles["container"]}`}>
      <div className={styles["avatar"]}>{initials}</div>
      <div
        className={styles["name"]}
      >{`${firstName || ""} ${lastName || ""}`}</div>
      <div className={styles["docId"]}>{docId}</div>
    </div>
  );
};

export default ChatHeader;
