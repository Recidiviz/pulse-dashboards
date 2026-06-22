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

const LINK_TOKEN_RE = /\[\[link:([^\]|]+)\|([^\]]+)\]\]/g;

function buildSegments(text: string): React.ReactNode[] {
  const renderedSegments: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(LINK_TOKEN_RE)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      renderedSegments.push(text.slice(lastIndex, matchIndex));
    }

    const href = match[1];
    const linkText = match[2];

    let safeHref: string | undefined;
    try {
      const url = new URL(href);
      if (url.protocol === "https:") safeHref = href;
    } catch {
      // not a valid https URL — render link text as plain text
    }

    renderedSegments.push(
      safeHref ? (
        <a key={matchIndex} href={safeHref} target="_blank" rel="noreferrer">
          {linkText}
        </a>
      ) : (
        linkText
      ),
    );

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    renderedSegments.push(text.slice(lastIndex));
  }

  return renderedSegments;
}

/**
 * Parses [[link:url|text]] tokens produced by the `link_to` Handlebars helper
 * and renders them as anchor elements. Only https URLs are linked; anything
 * else falls back to plain text.
 */
export function renderWithLinks(text: string): React.ReactNode {
  const segments = buildSegments(text);
  return segments.length === 0 ? text : <>{segments}</>;
}

/**
 * Same as renderWithLinks, but appends trailingNode to the output and wraps
 * the last segment + trailingNode in Wrapper (e.g. a nowrap span) to prevent
 * the trailing element from orphaning on its own line.
 */
export function renderWithLinksAndTrailing(
  text: string,
  trailingNode: React.ReactNode,
  Wrapper: React.ComponentType<{ children: React.ReactNode }>,
): React.ReactNode {
  const segments = buildSegments(text);

  const last = segments.pop();

  if (last === undefined) {
    return <Wrapper>{trailingNode}</Wrapper>;
  }

  if (typeof last === "string") {
    const spaceIdx = last.lastIndexOf(" ");
    if (spaceIdx !== -1 && spaceIdx < last.length - 1) {
      // Multiple words: keep only the last word together with trailing
      segments.push(last.slice(0, spaceIdx + 1));
      segments.push(
        <Wrapper key="trailing">
          {last.slice(spaceIdx + 1)}
          {trailingNode}
        </Wrapper>,
      );
    } else {
      // Single word: keep the whole segment together with trailing
      segments.push(
        <Wrapper key="trailing">
          {last}
          {trailingNode}
        </Wrapper>,
      );
    }
  } else {
    // Last segment is an element (e.g. <a>) — keep it together with trailing
    segments.push(
      <Wrapper key="trailing">
        {last}
        {trailingNode}
      </Wrapper>,
    );
  }

  return <>{segments}</>;
}
