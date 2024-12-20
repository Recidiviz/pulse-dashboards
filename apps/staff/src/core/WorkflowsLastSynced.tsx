// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Icon, palette, Pill } from "@recidiviz/design-system";
import { FC } from "react";
import styled from "styled-components/macro";

import { useFeatureVariants } from "../components/StoreProvider";
import coreStyles from "./CoreConstants.module.scss";

const LastSyncedPill = styled(Pill)`
  position: fixed;
  bottom: 28px;
  left: 20px;

  display: flex;
  gap: 5px;
  background: white;
  z-index: 10;
  border-radius: 11px;

  @media screen and (max-width: ${coreStyles.breakpointXxs}) {
    bottom: 5rem;
  }
`;

interface WorkflowsLastSyncedProps {
  date?: Date;
}

const WorkflowsLastSynced: FC<WorkflowsLastSyncedProps> = ({ date }) => {
  const { lastSyncedDate } = useFeatureVariants();

  if (!lastSyncedDate || !date) return null;

  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <LastSyncedPill color={palette.slate20}>
      <Icon kind="Check" color={palette.signal.highlight} size={10} />
      Synced {formattedDate}
    </LastSyncedPill>
  );
};

export default WorkflowsLastSynced;
