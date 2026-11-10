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

import styled from "styled-components";

import { BodyM1, BodyS1, palette, spacing } from "../../../../styles";

export const PanelRoot = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0 ${spacing[4]};
  width: 100%;
`;

export const PanelBody = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[6]};
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0 ${spacing[4]} ${spacing[4]} ${spacing[4]};
  width: 100%;
`;

/* ── Address row ───────────────────────────────────────── */

export const AddressBlock = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: ${spacing[4]};
  width: 100%;
`;

export const AddressRow = styled.div`
  align-items: center;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  min-height: 2rem;
  width: 100%;
`;

export const AddressRowLeft = styled.div`
  align-items: center;
  justify-content: space-between;
  display: flex;
  flex-direction: row;
  flex: 1;
  gap: ${spacing[2]};
  min-width: 0;
`;

export const AddressLabelWrapper = styled.div`
  align-items: center;
  justify-content: flex-start;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[2]};
`;

export const AddressIconWrapper = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  height: 1.25rem;
  justify-content: center;
  width: 1.25rem;

  & svg {
    height: 1.25rem;
    width: 1.25rem;

    path {
      stroke: ${palette.foreground.tertiary};
    }
  }
`;

export const AddressLabel = styled(BodyS1)`
  color: ${palette.foreground.secondary};
  flex: none;
  white-space: nowrap;
`;

export const AddressValue = styled(BodyS1)`
  color: ${palette.foreground.primary};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const HomePlanButtonGroup = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[2]};
`;

/* ── Shared divider ────────────────────────────────────── */

export const Divider = styled.hr`
  align-self: stretch;
  border: none;
  border-top: 0.0625rem solid ${palette.border.subtle};
  height: 0;
  margin: 0;
  width: 100%;
`;

/* ── Provider info section (spec 10) ──────────────────── */

export const ProviderSection = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  width: 100%;
`;

export const ProviderHeaderBlock = styled.div`
  display: flex;
  flex-direction: column;
  flex: none;
  justify-content: center;
`;

export const ProviderName = styled(BodyM1)`
  color: ${palette.foreground.primary};
`;

export const ProviderUpdatedAt = styled(BodyS1)`
  color: ${palette.foreground.secondary};
`;

export const ContactItem = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  min-height: 1.25rem;
  width: 100%;
`;

export const ContactLeft = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: row;
  gap: ${spacing[2]};
  min-width: 0;
`;

export const ContactIconWrapper = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  height: 1.25rem;
  justify-content: center;
  width: 1.25rem;
`;

export const ContactUserIconWrapper = styled(ContactIconWrapper)`
  svg {
    width: 17px;
    height: 17px;
  }

  svg path {
    fill: ${palette.foreground.tertiary};
  }
`;

export const ContactLabel = styled(BodyS1)`
  color: ${palette.foreground.secondary};
  flex: none;
`;

export const ContactRight = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[1]};
`;

export const ContactValue = styled(BodyS1)`
  color: ${palette.foreground.primary};
`;
