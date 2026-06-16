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

import { Modal, Sans24 } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";
import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
} from "~design-system";
import { Button } from "~design-system";

export const StyledModal = styled(Modal)`
  .ReactModal__Content {
    display: flex;
    width: ${rem(627)};
    padding: ${rem(40)};
    flex-direction: column;
    align-items: flex-start;
    gap: ${rem(16)};
    overflow: visible;

    border-radius: ${rem(4)};
    background: ${palette.white};
  }
`;

export const ModalSection = styled.div`
  display: flex;
  padding-bottom: ${rem(24)};
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(8)};
  align-self: stretch;
`;

export const ModalTitle = styled(Sans24)`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: ${rem(18)};
  font-style: normal;
  font-weight: 500;
  line-height: ${rem(21.6)}; /* 120% */
  letter-spacing: ${rem(-0.36)};
`;

export const StyledDropdown = styled(Dropdown)`
  display: flex;
  height: ${rem(40)};
  padding: ${rem(12)} ${rem(17)};
  justify-content: space-between;
  align-items: center;
  align-self: stretch;

  border-radius: ${rem(8)};
  border: ${rem(1)} solid ${palette.signal.links};
  background: ${palette.white};
`;

export const StyledDropdownToggle = styled(DropdownToggle)`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  border: none;

  &:hover,
  &:focus,
  &:active {
    background: transparent;
    border: none;
    outline: none;
    box-shadow: none;
  }
`;

export const NameLabel = styled.span`
  display: flex;
  height: ${rem(16)};
  align-items: flex-start;
  flex: 1 0 0;
`;

export const ChangeLabel = styled.span`
  color: ${palette.pine4};
  text-align: center;
  font-family: "Public Sans";
  font-size: ${rem(12)};
  font-style: normal;
  font-weight: 500;
  line-height: ${rem(16)}; /* 133.333% */
  letter-spacing: ${rem(-0.12)};
`;

export const StyledDropdownMenu = styled(DropdownMenu)`
  display: flex;
  width: ${rem(547)};
  padding: ${rem(8)} 0;
  flex-direction: column;
  align-items: flex-start;

  border-radius: ${rem(8)};
  background: ${palette.white};

  /* Card.Shadow */
  box-shadow:
    0 ${rem(15)} ${rem(40)} 0 rgba(53, 83, 98, 0.3),
    0 ${rem(-1)} ${rem(1)} 0 rgba(19, 44, 82, 0.2) inset;

  max-height: ${rem(200)};
  overflow-y: auto;
  top: 100%;
`;

export const StyledDropdownMenuItem = styled(DropdownMenuItem)`
  display: flex;
  padding: ${rem(2)} ${rem(16)};
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(8)};
  align-self: stretch;

  background: ${palette.white};
`;

export const ModalFooter = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${rem(8)};
  align-self: stretch;
`;

export const CancelButton = styled(Button).attrs({ kind: "link" })`
  display: flex;
  width: ${rem(160)};
  height: ${rem(40)};
  padding: ${rem(8)} ${rem(16)};
  justify-content: center;
  align-items: center;
  gap: ${rem(8)};

  border-radius: ${rem(4)};
  border: ${rem(1)} solid rgba(53, 83, 98, 0.2);

  &:hover {
    text-decoration: none;
  }
`;

export const SendButton = styled(Button)`
  display: flex;
  height: ${rem(40)};
  padding: 0 ${rem(16)};
  justify-content: center;
  align-items: center;
  gap: ${rem(10)};
  flex: 1 0 0;

  border-radius: ${rem(4)};
  background: ${palette.pine4};
`;
