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

import { Avatar } from "@mui/material";
import Image from "next/image";
import React from "react";

import { useIntakeAuthContext } from "~@reentry/frontend/components/IntakeChatV2/providers/IntakeAuthProvider";
import { getInitials } from "~@reentry/frontend/components/IntakeChatV2/utils";

import styles from "./CustomAvatar.module.css";

interface AvatarProps {
  size?: number;
  clientInitials?: string;
}

export const ClientAvatar: React.FC<AvatarProps> = ({
  size = 32,
  clientInitials,
}) => {
  const { firstName, lastName } = useIntakeAuthContext();
  const clientName = `${firstName || ""} ${lastName || ""}`;
  const userInitials = clientInitials ?? getInitials(clientName);

  return (
    <Avatar
      sx={{ width: size, height: size }}
      variant="circular"
      className={styles["clientAvatar"]}
    >
      <span className={styles["initials"]}>{userInitials}</span>
    </Avatar>
  );
};

export const CaseWorkerAvatar: React.FC = () => (
  <div className={styles["caseAvatar"]}>
    <Image
      src="/favicon.ico"
      alt="caseworker"
      width={22}
      height={22}
      priority
    />
  </div>
);

export default ClientAvatar;
