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

import {
  Button,
  Icon,
  palette,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import simplur from "simplur";
import styled from "styled-components/macro";

import { SupervisionOfficer } from "~datatypes";

import useIsMobile from "../../hooks/useIsMobile";
import {
  ConfigLabels,
  OfficerVitalsMetricDetail,
} from "../../InsightsStore/presenters/types";
import { StyledDrawerModalV2 } from "../InsightsInfoModal/InsightsInfoModalV2";
import { NAV_BAR_HEIGHT } from "../NavigationLayout";
import { VitalsTaskDrilldownTable } from "./VitalsTaskDrilldownTable";

const ModalControls = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-content: space-between;
  background: white;
  padding: 1rem;
  border-bottom: ${rem(1)} solid ${palette.slate20};
  height: ${rem(NAV_BAR_HEIGHT)};

  Button {
    grid-column: 2;
    justify-self: flex-end;
  }
`;

const ModalContent = styled.div``;

const ModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${rem(spacing.lg)};
  border-bottom: ${rem(1)} solid ${palette.slate20};
`;

const ModalTitle = styled.div`
  ${typography.Sans18};
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.xs)};
`;

const ModalSubtitle = styled.div`
  ${typography.Sans14};
  color: ${palette.slate60};
`;

const FooterText = styled.p`
  ${typography.Sans14};
  color: ${palette.slate70};
  padding: ${rem(spacing.xl)};
  text-align: center;
`;

interface VitalsTaskDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricDetails?: OfficerVitalsMetricDetail;
  labels: ConfigLabels;
  officer?: SupervisionOfficer;
}

export const VitalsTaskDrilldownModal = observer(
  function VitalsTaskDrilldownModal({
    isOpen,
    onClose,
    metricDetails,
    labels,
    officer,
  }: VitalsTaskDrilldownModalProps) {
    const { isMobile } = useIsMobile(true);
    if (!officer || !metricDetails) return null;
    const { tasks, bodyDisplayName, titleDisplayName } = metricDetails;

    const overdueCount = tasks.filter((task) => task.isOverdue).length;

    return (
      <StyledDrawerModalV2
        isOpen={isOpen}
        onRequestClose={onClose}
        isMobile={isMobile}
      >
        <ModalControls>
          <Button kind="link" onClick={onClose}>
            <Icon kind="Close" size="14" color={palette.pine2} />
          </Button>
        </ModalControls>

        <ModalHeader>
          <ModalTitle>
            {officer.fullName.givenNames}’s {titleDisplayName}s
          </ModalTitle>
          <ModalSubtitle>{simplur`${overdueCount} Overdue ${bodyDisplayName}[|s]`}</ModalSubtitle>
        </ModalHeader>

        <ModalContent>
          <VitalsTaskDrilldownTable
            tasks={tasks}
            docLabel={labels.docLabel}
            bodyDisplayName={bodyDisplayName}
          />
          <FooterText>
            {bodyDisplayName}s due more than 30 days from today are not shown.
          </FooterText>
        </ModalContent>
      </StyledDrawerModalV2>
    );
  },
);
