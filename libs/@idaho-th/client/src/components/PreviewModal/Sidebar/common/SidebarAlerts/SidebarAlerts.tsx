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

import type { Alert } from "~@idaho-th/client/interfaces/common";

import XIcon from "../../../../assets/x.svg?react";
import { ALERT_LABEL } from "./SidebarAlerts.constants";
import * as Styled from "./SidebarAlerts.styles";

interface SidebarAlertsProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
}

export const SidebarAlerts: React.FC<SidebarAlertsProps> = ({
  alerts,
  onDismiss,
}) => {
  if (alerts.length === 0) return null;

  return (
    <>
      {alerts.map(({ id, type }) => {
        const label = ALERT_LABEL[type];
        return (
          <Styled.Banner key={id}>
            <Styled.Dot />
            <Styled.Text>{label}</Styled.Text>
            <Styled.DismissButton
              type="button"
              aria-label={`Dismiss: ${label}`}
              onClick={() => onDismiss(id)}
            >
              <XIcon />
            </Styled.DismissButton>
          </Styled.Banner>
        );
      })}
    </>
  );
};
