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

import React from "react";
import styled from "styled-components";

import { LABEL_STATE } from "~@idaho-th/client/constants/label";
import { ProviderLabel } from "~@idaho-th/client/interfaces/common";
import { filterMatchLabels } from "~@idaho-th/client/utils/labelGenerator";

import { BodyS1, palette, spacing } from "../../../../../styles";
import { BadgeRow } from "../BadgeRow";

interface ProviderLabelsProps {
  labels: ProviderLabel[];
}

const LabelsContainer = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
  width: 100%;
`;

const LabelText = styled(BodyS1)`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`;

const BulletSeparator = styled.span`
  margin: 0 ${spacing[1]};
  padding-bottom: 1px;
  display: inline-block;
`;

export const ProviderLabels: React.FC<ProviderLabelsProps> = ({ labels }) => {
  const matchLabels = filterMatchLabels(labels);
  const badgeLabels = labels.filter((l) => l.state !== LABEL_STATE.match);

  if (!matchLabels.length && !badgeLabels.length) return null;

  return (
    <LabelsContainer>
      {matchLabels.length > 0 && (
        <LabelText
          $color={palette.foreground.secondary}
          data-testid="match-label"
        >
          {matchLabels.map((l, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <React.Fragment key={`${l.text}-${i}`}>
              {i > 0 && <BulletSeparator>•</BulletSeparator>}
              {l.text}
            </React.Fragment>
          ))}
        </LabelText>
      )}
      {badgeLabels.length > 0 && (
        <div data-testid="badge-label">
          <BadgeRow labels={badgeLabels} />
        </div>
      )}
    </LabelsContainer>
  );
};
