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

import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components";

import {
  BottomSheet,
  Card,
  CopyWrapper,
  GoLink,
  JIIButton,
  OverlayBody,
  OverlayHeading,
} from "~@jii/common-ui";
import { CardDateInfo } from "~@jii/earned-good-time";
import {
  useDateDistanceTranslation,
  useUsArTranslations,
} from "~@jii/translation";
import { spacing } from "~design-system";

const DateInfoContent = styled(CopyWrapper)`
  p:last-child {
    margin-bottom: 0;
  }
`;

const OverlayButtons = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(spacing.md)};
  margin-top: ${rem(spacing.md)};
`;

export type OverlayCopy = {
  id: string;
  //label for link to open overlay
  openOverlayLabel: string;
  //overlay copy
  heading: string;
  body: string;
  //url and text for the link within the overlay
  overlayLinkUrl: string;
  overlayLinkText?: string;
};

export type DateInfoProps = {
  date: Date | undefined;
  label: string;
  description: string;
  overlays?: OverlayCopy[];
};

export function DateInfoCard({
  date,
  label,
  description,
  overlays,
}: DateInfoProps) {
  const { t } = useUsArTranslations();
  const dateDistance = useDateDistanceTranslation(date);

  let dateCardValue;
  let subtitle;
  if (date) {
    // locale-aware formatting of the date
    dateCardValue = t(($) => $.importantDates.formatFullDate, {
      date,
    });
    subtitle = `(${dateDistance})`;
  } else {
    dateCardValue = t(($) => $.importantDates.missingDateMessage);
  }
  //which overlay is showing
  const [overlayIndex, setOverlayIndex] = useState(0);
  //whether the overlay is open
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const activeOverlay = overlays?.[overlayIndex];

  return (
    <Card>
      <CardDateInfo label={label} value={dateCardValue} subtitle={subtitle} />
      <DateInfoContent>{description}</DateInfoContent>
      {overlays && activeOverlay && (
        <>
          <OverlayButtons>
            {overlays.map((overlay, index) => (
              <JIIButton
                kind="secondary"
                key={overlay.id}
                onClick={() => {
                  setOverlayIndex(index);
                  setIsOverlayOpen(true);
                }}
              >
                {overlay.openOverlayLabel}
              </JIIButton>
            ))}
          </OverlayButtons>
          <BottomSheet
            isOpen={isOverlayOpen}
            onRequestClose={() => setIsOverlayOpen(false)}
            ariaLabel={activeOverlay.heading}
          >
            <OverlayHeading>{activeOverlay.heading}</OverlayHeading>
            <OverlayBody>{activeOverlay.body}</OverlayBody>
            {activeOverlay.overlayLinkText && (
              <GoLink to={activeOverlay.overlayLinkUrl}>
                {activeOverlay.overlayLinkText}
              </GoLink>
            )}
          </BottomSheet>
        </>
      )}
    </Card>
  );
}
