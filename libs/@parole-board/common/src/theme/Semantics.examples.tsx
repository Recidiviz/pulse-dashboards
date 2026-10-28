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
import styled from "styled-components";

import * as semantics from "./semantics";

const { border, space, stroke, surface, text, type } = semantics;

const colorGroups = {
  text: semantics.text,
  icon: semantics.icon,
  surface: semantics.surface,
  border: semantics.border,
  action: semantics.action,
  status: semantics.status,
};

const Table = styled.table`
  ${type.Sans14}
  border-collapse: collapse;
  margin: ${rem(space.lg)};
  color: ${text.primary};
  background: ${surface.bg};

  th,
  td {
    padding: ${rem(space.xs)} ${rem(space.md)};
    border-bottom: ${stroke.default} solid ${border.faint};
    text-align: left;
  }

  th {
    color: ${text.secondary};
  }
`;

// The swatch sits on white with a hairline, so white and translucent values
// still show as a shape.
const Swatch = styled.span<{ $color: string }>`
  display: block;
  width: ${rem(space.xl)};
  height: ${rem(space.lg)};
  background: ${({ $color }) => $color};
  border: ${stroke.default} solid ${border.default};
  border-radius: ${semantics.radius.control};
`;

export default {};

export const Colors = () => (
  <Table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Swatch</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      {Object.entries(colorGroups).flatMap(([group, values]) =>
        Object.entries(values).map(([name, value]) => (
          <tr key={`${group}.${name}`}>
            <td>
              {group}.{name}
            </td>
            <td>
              <Swatch $color={value} />
            </td>
            <td>{value}</td>
          </tr>
        )),
      )}
    </tbody>
  </Table>
);

export const RadiusStrokeAndSpace = () => (
  <Table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      {[
        ...Object.entries(semantics.radius).map(([n, v]) => [`radius.${n}`, v]),
        ...Object.entries(semantics.stroke).map(([n, v]) => [`stroke.${n}`, v]),
        ...Object.entries(space).map(([n, v]) => [`space.${n}`, String(v)]),
      ].map(([name, value]) => (
        <tr key={name}>
          <td>{name}</td>
          <td>{value}</td>
        </tr>
      ))}
    </tbody>
  </Table>
);
