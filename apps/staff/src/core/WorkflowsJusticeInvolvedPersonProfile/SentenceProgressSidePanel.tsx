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

import { Sans16 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { palette, spacing } from "~design-system";

import { Client } from "../../WorkflowsStore";
import {
  SentenceProgressPresenter,
  TimelineDate,
} from "../../WorkflowsStore/presenters/SentenceProgressPresenter";
import { Resident } from "../../WorkflowsStore/Resident";
import { SidePanelContents } from "../sharedComponents";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";

type SentenceProgressSidePanelProps = {
  timelineDates: TimelineDate[];
  presenter: SentenceProgressPresenter<Client | Resident>;
};

const DateRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding-bottom: ${rem(spacing.md)};
  margin-bottom: ${rem(spacing.md)};
  border-bottom: 1px solid black;
`;

const ProgressInfo = styled(Sans16)`
  color: ${palette.pine1};
`;

export const ProgressSidePanel = observer(function ProgressSidePanel({
  timelineDates,
}: SentenceProgressSidePanelProps) {
  return (
    <SidePanelContents>
      {timelineDates.map((point) => {
        return (
          <DateRow>
            <ProgressInfo>{point.label}</ProgressInfo>
            <ProgressInfo>{point.formattedDate}</ProgressInfo>
          </DateRow>
        );
      })}
    </SidePanelContents>
  );
});

const SentenceProgressSidePanel = observer(function SentenceProgressSidePanel(
  props: SentenceProgressSidePanelProps,
): React.ReactNode {
  const { presenter } = props;
  return (
    <WorkflowsPreviewModal
      titleContent={<Sans16>All Events</Sans16>}
      isOpen={presenter.isModalOpen}
      onClose={() => (presenter.isModalOpen = false)}
      clearSelectedPersonOnClose={false}
      pageContent={<ProgressSidePanel {...props} />}
    />
  );
});

export default SentenceProgressSidePanel;
