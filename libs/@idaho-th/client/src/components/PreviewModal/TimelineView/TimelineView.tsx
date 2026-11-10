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

import React, { useEffect, useState } from "react";

import { formatTimestamp } from "~@idaho-th/client/utils/date";
import { APPLICATION_STAGE } from "~@idaho-th/shared";

import { useApplicationDetailByRole } from "../../../hooks/useApplicationDetail";
import {
  useProviderTimeline,
  useStaffTimeline,
} from "../../../hooks/useTimeline";
import { BodyS1, palette } from "../../../styles";
import { trpc } from "../../../trpc/client";
import * as PanelStyled from "../PreviewModal.styles";
import { StaffClosedBanner } from "../StaffPreviewModal/StaffClosedBanner";
import { formatActorRole } from "./TimelineView.helpers";
import * as Styled from "./TimelineView.styles";

interface TimelineViewProps {
  applicationId: string | undefined;
  variant: "staff" | "provider";
}

export const TimelineView: React.FC<TimelineViewProps> = function TimelineView({
  applicationId,
  variant,
}) {
  const enabled = !!applicationId;

  const staffQuery = useStaffTimeline(
    applicationId,
    enabled && variant === "staff",
  );
  const providerQuery = useProviderTimeline(
    applicationId,
    enabled && variant === "provider",
  );

  const query = variant === "staff" ? staffQuery : providerQuery;
  const events = query.data?.events ?? [];
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const detail = useApplicationDetailByRole(applicationId, variant);
  const isClosed = detail?.stage === APPLICATION_STAGE.CLOSED;

  const utils = trpc.useUtils();

  const { mutate: markStaffViewed } =
    trpc.timeline.markViewedForStaff.useMutation({
      onSuccess: () => {
        void utils.timeline.getForStaff.invalidate();
      },
    });
  const { mutate: markProviderViewed } =
    trpc.timeline.markViewedForProvider.useMutation({
      onSuccess: () => {
        void utils.timeline.getForProvider.invalidate();
      },
    });

  useEffect(() => {
    if (!applicationId || !query.isSuccess) {
      return;
    }
    if (variant === "staff") {
      markStaffViewed({ applicationId });
    } else {
      markProviderViewed({ applicationId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, query.isSuccess, variant]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const showTimeline = query.isSuccess && events.length > 0;
  const showEmpty = query.isSuccess && events.length === 0;

  return (
    <Styled.PanelRoot>
      <PanelStyled.PanelHeader>
        <PanelStyled.PanelTitle>Timeline</PanelStyled.PanelTitle>
      </PanelStyled.PanelHeader>

      <Styled.PanelBody>
        {variant === "staff" && isClosed && <StaffClosedBanner />}
        {query.isLoading && (
          <Styled.EmptyState>
            <BodyS1 $color={palette.foreground.secondary}>
              Loading timeline…
            </BodyS1>
          </Styled.EmptyState>
        )}
        {query.isError && (
          <Styled.EmptyState>
            <BodyS1 $color={palette.foreground.secondary}>
              Failed to load timeline.
            </BodyS1>
          </Styled.EmptyState>
        )}
        {showEmpty && (
          <Styled.EmptyState>
            <BodyS1 $color={palette.foreground.secondary}>
              No timeline events yet.
            </BodyS1>
          </Styled.EmptyState>
        )}
        {showTimeline && (
          <Styled.TimelineList>
            {events.map((event, index) => {
              const isFirst = index === 0;
              const isLast = index === events.length - 1;
              return (
                <Styled.TimelineItem key={event.id}>
                  <Styled.TimelineIndicator>
                    <Styled.TimelineConnectorTop $visible={!isFirst} />
                    <Styled.TimelineDot $active={isFirst} />
                    <Styled.TimelineConnectorBottom $visible={!isLast} />
                  </Styled.TimelineIndicator>
                  <Styled.TimelineContent>
                    <Styled.TimelineTextGroup>
                      <Styled.TimelineActor>
                        {formatActorRole(event.actorRole)}
                      </Styled.TimelineActor>
                      {event.message ? (
                        <>
                          <Styled.TimelineMessageContainer
                            $expanded={expandedIds.has(event.id)}
                          >
                            <Styled.TimelineDescriptionLabel>
                              {event.description}
                            </Styled.TimelineDescriptionLabel>{" "}
                            <Styled.TimelineMessageText>
                              {event.message}
                            </Styled.TimelineMessageText>
                          </Styled.TimelineMessageContainer>
                          <Styled.TimelineMessageToggle
                            type="button"
                            onClick={() => toggleExpanded(event.id)}
                          >
                            <Styled.TimelineToggleLabel>
                              {expandedIds.has(event.id)
                                ? "Collapse"
                                : "Show more"}
                            </Styled.TimelineToggleLabel>
                            <Styled.TimelineToggleChevron
                              $expanded={expandedIds.has(event.id)}
                            />
                          </Styled.TimelineMessageToggle>
                        </>
                      ) : (
                        <Styled.TimelineDescription>
                          {event.description}
                        </Styled.TimelineDescription>
                      )}
                    </Styled.TimelineTextGroup>
                    <Styled.TimelineDate>
                      {formatTimestamp(event.createdAt, "MMM d")}
                    </Styled.TimelineDate>
                  </Styled.TimelineContent>
                </Styled.TimelineItem>
              );
            })}
          </Styled.TimelineList>
        )}
      </Styled.PanelBody>
    </Styled.PanelRoot>
  );
};
