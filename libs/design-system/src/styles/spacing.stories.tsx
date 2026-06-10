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

import type { Meta, StoryObj } from "@storybook/react";
import styled from "styled-components";

import { palette } from "./palette";
import { spacing } from "./spacing";

const Table = styled.table`
  border-collapse: collapse;
  font-family: sans-serif;
  font-size: 14px;
  width: 100%;
`;

const Th = styled.th`
  border-bottom: 1px solid ${palette.slate20};
  padding: 8px 16px;
  text-align: left;
  color: ${palette.slate60};
  font-weight: 600;
`;

const Td = styled.td`
  padding: 8px 16px;
  vertical-align: middle;
`;

const TokenName = styled.span`
  font-family: monospace;
  font-weight: 600;
`;

const SpacingDemo = styled.div<{ $size: number }>`
  display: flex;
  align-items: center;
  gap: ${({ $size }) => $size}px;
`;

const Box = styled.div`
  background-color: ${palette.pine3};
  border-radius: 2px;
  height: 24px;
  width: 24px;
`;

function SpacingScale() {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Token</Th>
          <Th>Value</Th>
          <Th>Visual</Th>
        </tr>
      </thead>
      <tbody>
        {(Object.entries(spacing) as [keyof typeof spacing, number][]).map(
          ([token, value]) => (
            <tr key={token}>
              <Td>
                <TokenName>spacing.{token}</TokenName>
              </Td>
              <Td>{value}px</Td>
              <Td>
                <SpacingDemo $size={value}>
                  <Box />
                  <Box />
                </SpacingDemo>
              </Td>
            </tr>
          ),
        )}
      </tbody>
    </Table>
  );
}

const meta: Meta<typeof SpacingScale> = {
  title: "Shared/Design System/Styles/Spacing",
  component: SpacingScale,
  // this hides the individual stories in the sidebar, showing only docs
  tags: ["!dev"],
};

export default meta;

export const AllValues: StoryObj<typeof meta> = {};
