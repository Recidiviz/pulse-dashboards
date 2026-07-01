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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect } from "react";
import styled from "styled-components";

import { Button, Loading, palette, spacing } from "~design-system";

import { useTypesenseStore } from "../../../../components/StoreProvider";
import {
  SectionCard,
  SectionCardBody,
  SectionCardHeader,
} from "../../../SectionCard";

const Body = styled(SectionCardBody)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.md)};
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

const StatusDot = styled.div<{ $color: string }>`
  width: ${rem(16)};
  height: ${rem(16)};
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const StatusLabel = styled.span<{ $color: string }>`
  font-size: ${rem(16)};
  font-weight: 600;
  color: ${({ $color }) => $color};
`;

const EnvBadge = styled.div`
  width: 100%;
  min-width: 0;
  background: ${palette.slate10};
  border-radius: ${rem(4)};
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  display: flex;
  flex-direction: column;
  gap: ${rem(2)};
`;

const EnvLabel = styled.span`
  font-weight: 600;
  color: ${palette.slate};
`;

const EnvHost = styled.span`
  font-size: ${rem(12)};
  color: ${palette.slate};
  overflow-wrap: anywhere;
  word-break: break-word;
`;

function envLabel(host: string): string {
  if (host.includes("localhost")) return "Offline Mode";
  if (host.includes("staging")) return "Staging";
  return "Production";
}

function getStatusDotColor(status: string) {
  return status === "success" ? palette.pine3 : palette.signal.error;
}

function getStatusLabel(status: string) {
  return status === "success" ? "Healthy" : "Unhealthy";
}

export const StatusCard = observer(function StatusCard() {
  const store = useTypesenseStore();

  useEffect(() => {
    void store.fetchHealth();
  }, [store]);

  const { status, error, isFetching, checkedAt, host } = store.health;

  if (status === "pending") {
    return (
      <SectionCard>
        <SectionCardHeader>Status</SectionCardHeader>
        <Body>
          <Loading message="Loading..." />
        </Body>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <SectionCardHeader>Status</SectionCardHeader>
      <Body>
        <StatusRow>
          <StatusDot $color={getStatusDotColor(status)} />
          <StatusLabel $color={getStatusDotColor(status)}>
            {getStatusLabel(status)}
          </StatusLabel>
        </StatusRow>

        {error && <span>{error.message}</span>}

        {host && (
          <EnvBadge>
            <EnvLabel>Environment: {envLabel(host)}</EnvLabel>
            <EnvHost>{host}</EnvHost>
          </EnvBadge>
        )}

        {checkedAt && (
          <span>Last checked: {checkedAt.toLocaleTimeString()}</span>
        )}

        <Button
          kind="secondary"
          shape="pill"
          onClick={() => store.refreshHealth()}
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </Body>
    </SectionCard>
  );
});
