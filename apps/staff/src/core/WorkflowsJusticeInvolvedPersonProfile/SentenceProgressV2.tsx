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

import { Sans14, Sans16, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { Client, JusticeInvolvedPerson } from "../../WorkflowsStore";
import { SentenceProgressPresenter } from "../../WorkflowsStore/presenters/SentenceProgressPresenter";
import { Resident } from "../../WorkflowsStore/Resident";
import {
  formatSentenceLength,
  formatTimeToGo,
  LifeSentenceDisplay,
  OfficerAssignmentDisplay,
} from "./SentenceProgress";
import { SentenceProgressPointV2 } from "./SentenceProgressPointV2";
import SentenceProgressSidePanel from "./SentenceProgressSidePanel";
import { ClientProfileProps, ResidentProfileProps } from "./types";

const Wrapper = styled.div``;

const HeadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledLink = styled(Link)`
  color: ${palette.signal.links} !important;
  &:hover {
    text-decoration: underline;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
`;

const SubHeader = styled.div`
  ${typography.Sans14}
  display: flex;
  justify-content: space-between;
  margin-top: ${rem(spacing.md)};

  & > *:first-child {
    margin-right: ${rem(spacing.lg)};
  }
`;

const Title = styled.div`
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.xs)};
`;

export const CANVAS_HEIGHT = 40;
const TimelineCanvas = styled.svg`
  height: ${rem(CANVAS_HEIGHT)};
  margin-bottom: ${rem(spacing.md)};
  margin-top: ${rem(spacing.md)};
  overflow: visible;
  width: 100%;
`;

export const TIMELINE_HEIGHT = 8;

const TimelineFuture = styled.line`
  stroke-width: ${rem(TIMELINE_HEIGHT)};
  stroke: ${palette.slate50};
`;

const TimelineExpired = styled.line`
  stroke-width: ${rem(TIMELINE_HEIGHT)};
  stroke: ${palette.data.crimson1};
`;

const TimelinePast = styled.line`
  stroke-width: ${rem(TIMELINE_HEIGHT)};
  stroke: ${palette.slate20};
`;

const TimelineViz = ({
  presenter,
}: {
  presenter: SentenceProgressPresenter<Resident | Client>;
}) => {
  const { shouldShowEmptyState, progressPoints, timelineBreakpoint, expired } =
    presenter;

  if (shouldShowEmptyState) return null;

  return (
    <TimelineCanvas>
      <TimelinePast
        x1={0}
        x2={`${timelineBreakpoint}%`}
        y1={"50%"}
        y2={"50%"}
      />
      {expired ? (
        <TimelineExpired
          x1={`${timelineBreakpoint}%`}
          x2={"100%"}
          y1={"50%"}
          y2={"50%"}
        />
      ) : (
        <TimelineFuture
          x1={`${timelineBreakpoint}%`}
          x2={"100%"}
          y1={"50%"}
          y2={"50%"}
        />
      )}
      {progressPoints.map((point) => {
        return (
          <SentenceProgressPointV2
            key={point.date.toDateString()}
            point={point}
            presenter={presenter}
          />
        );
      })}
    </TimelineCanvas>
  );
};

const ProgressHeader = ({
  header,
  officerId,
  startDate,
  endDate,
  presenter,
}: {
  presenter: SentenceProgressPresenter<Resident | Client>;
  header: string;
  officerId?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const showSentenceCalculations = !!startDate && !!endDate;
  return (
    <HeadingWrapper>
      <Header>
        <Sans16>Progress</Sans16>
        <StyledLink
          to="#"
          onClick={() => {
            presenter.isModalOpen = true;
          }}
        >
          See All Events
        </StyledLink>
      </Header>

      <SubHeader>
        <div>
          <Title>{header}</Title>
          {showSentenceCalculations && (
            <Sans14>
              {formatSentenceLength(startDate, endDate)} (
              {formatTimeToGo(endDate)})
            </Sans14>
          )}
        </div>
        <OfficerAssignmentDisplay officerId={officerId} />
      </SubHeader>
    </HeadingWrapper>
  );
};

export const ManagedComponent = observer(function ProgressTimeline({
  presenter,
}: {
  presenter: SentenceProgressPresenter<Resident | Client>;
}) {
  const { timelineDates, header, officerId, startDate, endDate } = presenter;

  return (
    <Wrapper>
      <ProgressHeader
        officerId={officerId}
        header={header}
        startDate={startDate}
        endDate={endDate}
        presenter={presenter}
      />
      <TimelineViz presenter={presenter} />
      <SentenceProgressSidePanel
        presenter={presenter}
        timelineDates={timelineDates.filter((date) => date.label !== "Today")}
      />
    </Wrapper>
  );
});

function usePresenter({ person }: { person: Resident | Client }) {
  const { workflowsStore } = useRootStore();
  if (!workflowsStore) return null;

  return new SentenceProgressPresenter(workflowsStore, person);
}

export const ProgressTimelineV2 = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});

const SupervisionProgress = function SupervisionProgress({
  client,
}: ClientProfileProps): React.ReactElement<any> {
  return <ProgressTimelineV2 person={client} />;
};

const IncarcerationProgress = function IncarcerationProgress({
  resident,
}: ResidentProfileProps): React.ReactElement<any> {
  const {
    admissionDate,
    assignedStaffId: officerId,
    onLifeSentence,
  } = resident;

  if (onLifeSentence) {
    return (
      <SubHeader>
        <div>
          <Title>Incarceration</Title>
          <LifeSentenceDisplay admissionDate={admissionDate} />
        </div>
        <OfficerAssignmentDisplay officerId={officerId} />
      </SubHeader>
    );
  }

  return <ProgressTimelineV2 person={resident} />;
};

export const SentenceProgressV2: React.FC<{
  person: JusticeInvolvedPerson;
}> = observer(function SentenceProgressV2({ person }) {
  if (person instanceof Resident) {
    return <IncarcerationProgress resident={person} />;
  } else if (person instanceof Client) {
    return <SupervisionProgress client={person} />;
  }
});
