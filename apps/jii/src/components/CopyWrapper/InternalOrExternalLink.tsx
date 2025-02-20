// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Icon } from "@recidiviz/design-system";
import { AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

const InlineIcon = styled(Icon).attrs({ size: 13, kind: "Arrow" })`
  display: inline-block;
  margin-left: 0.4em;
  margin-bottom: -0.1em;
`;

/**
 * `a` tag handler for {@link https://www.npmjs.com/package/markdown-to-jsx|markdown-to-jsx}
 * that renders local URL paths using react-router's Link to preserve application state.
 * (If we let Markdown parse the local nav links to plain <a> elements, those links are likely to break)
 */
export function InternalOrExternalLink({
  icon,
  children,
  ...props
}: AnchorHTMLAttributes<unknown> & { icon?: boolean }) {
  let isExternalUrl: boolean;
  try {
    // this will either be true (if href is a fully qualified URL) or throw
    isExternalUrl = !!(
      // URL constructor cannot handle protocol-less links without a base URL,
      // but if we pass a base that will prevent us from throwing on local path URLs
      (props.href?.startsWith("//") || new URL(props.href ?? ""))
    );
  } catch {
    isExternalUrl = false;
  }

  if (isExternalUrl) {
    return (
      <a {...props}>
        {children}
        {icon && <InlineIcon />}
      </a>
    );
  }

  return (
    <Link to={props.href ?? ""}>
      {children}
      {icon && <InlineIcon />}
    </Link>
  );
}
