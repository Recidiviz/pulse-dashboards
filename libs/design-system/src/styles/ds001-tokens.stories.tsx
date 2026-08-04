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

import { Description, Stories, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react";
import { parseToRgb, rem } from "polished";
import styled from "styled-components";

import { palette, spacing } from "../";
import { DS001_TOKENS, type DS001Token } from "./ds001-tokens";

/* ------------------------------------------------------------------ layout */

const Table = styled.table`
  border-collapse: collapse;
  width: 100%;
  font-size: ${rem("13px")};
  margin-bottom: ${rem(spacing.lg)};

  th,
  td {
    text-align: left;
    padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
    border-bottom: 1px solid ${palette.slate10};
    vertical-align: middle;
  }

  th {
    font-weight: 600;
    color: ${palette.slate85};
    border-bottom: 1px solid ${palette.slate30};
    white-space: nowrap;
  }
`;

const GroupHeading = styled.h3`
  font-size: ${rem("15px")};
  margin: ${rem(spacing.lg)} 0 ${rem(spacing.sm)};
  color: ${palette.pine2};
`;

const Note = styled.p`
  font-size: ${rem("13px")};
  color: ${palette.slate85};
  background: ${palette.marble3};
  border-left: 3px solid ${palette.slate30};
  padding: ${rem(spacing.sm)};
  margin-bottom: ${rem(spacing.md)};
`;

const Chip = styled.div<{ $color: string }>`
  background-color: ${(props) => props.$color};
  background-image: linear-gradient(
      45deg,
      ${palette.slate10} 25%,
      transparent 25%
    ),
    linear-gradient(-45deg, ${palette.slate10} 25%, transparent 25%);
  background-size: 8px 8px;
  border: 1px solid ${palette.slate20};
  border-radius: 3px;
  height: 32px;
  width: 48px;
  flex: 0 0 auto;
`;

/** Renders the color over a checkerboard so alpha is visible. */
const Swatch = ({ color }: { color: string }) => (
  <div style={{ position: "relative", height: 32, width: 48 }}>
    <Chip $color="transparent" style={{ position: "absolute", inset: 0 }} />
    <Chip
      $color={color}
      style={{ position: "absolute", inset: 0, backgroundImage: "none" }}
    />
  </div>
);

const Mono = styled.code`
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.95em;
`;

/** For values that need to be present but shouldn't draw the eye. */
const Subtle = styled.span`
  color: ${palette.slate60};
`;

const Flag = styled.span`
  display: inline-block;
  font-size: ${rem("11px")};
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  background: ${palette.signal.error};
  color: ${palette.white};
  white-space: nowrap;
`;

/* ------------------------------------------------------------- token utils */

const byCollection = (collection: DS001Token["collection"]) =>
  DS001_TOKENS.filter((t) => t.collection === collection);

/** Groups tokens by their `group` field, preserving first-seen order. */
function groupTokens(tokens: DS001Token[]) {
  const groups = new Map<string, DS001Token[]>();
  for (const token of tokens) {
    const existing = groups.get(token.group);
    if (existing) existing.push(token);
    else groups.set(token.group, [token]);
  }
  return [...groups.entries()];
}

const startsWith = (tokens: DS001Token[], prefix: string) =>
  tokens.filter((t) => t.group.startsWith(prefix));

/** 0.2 -> "20%", 0.06 -> "6%", 0.855 -> "85.5%" */
function formatAlpha(alpha: number) {
  return `${Number((alpha * 100).toFixed(1))}%`;
}

/**
 * Opacity is shown as its own column because Figma stores the hex and the
 * alpha separately: to reproduce a transparent token you set the base hex as
 * the fill, then set the opacity. A single `rgba()` string hides that.
 */
function ColorRows({ tokens }: { tokens: DS001Token[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <th aria-label="swatch" />
          <th>Token</th>
          <th>Hex</th>
          <th>Opacity</th>
          <th>Aliases</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((t) => {
          const alpha = t.alpha ?? 1;
          const isTransparent = alpha < 1;
          return (
            <tr key={t.path}>
              <td>
                <Swatch color={String(t.value)} />
              </td>
              <td>
                <Mono>{t.name}</Mono>
                {t.unset && (
                  <>
                    {" "}
                    <Flag>unset in this mode</Flag>
                  </>
                )}
              </td>
              <td>
                <Mono>{t.baseHex ?? String(t.value)}</Mono>
              </td>
              <td>
                {isTransparent ? (
                  <Mono>
                    <strong>{formatAlpha(alpha)}</strong>
                  </Mono>
                ) : (
                  <Subtle>100%</Subtle>
                )}
              </td>
              <td>{t.aliasOf ? <Mono>{t.aliasOf}</Mono> : "—"}</td>
              <td>{t.description ?? "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function ValueRows({ tokens }: { tokens: DS001Token[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <th>Token</th>
          <th>Value</th>
          <th>Aliases</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((t) => (
          <tr key={t.path}>
            <td>
              <Mono>{t.name}</Mono>
              {t.unset && (
                <>
                  {" "}
                  <Flag>unset in this mode</Flag>
                </>
              )}
            </td>
            <td>
              <Mono>{String(t.value)}</Mono>
            </td>
            <td>{t.aliasOf ? <Mono>{t.aliasOf}</Mono> : "—"}</td>
            <td>{t.description ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function ColorGroups({ tokens }: { tokens: DS001Token[] }) {
  return (
    <>
      {groupTokens(tokens).map(([group, groupTokenList]) => (
        <div key={group}>
          <GroupHeading>{group}</GroupHeading>
          <ColorRows tokens={groupTokenList} />
        </div>
      ))}
    </>
  );
}

function ValueGroups({ tokens }: { tokens: DS001Token[] }) {
  return (
    <>
      {groupTokens(tokens).map(([group, groupTokenList]) => (
        <div key={group}>
          <GroupHeading>{group}</GroupHeading>
          <ValueRows tokens={groupTokenList} />
        </div>
      ))}
    </>
  );
}

/* --------------------------------------------- legacy palette comparison */

/** Normalizes any CSS color string to "r,g,b,a" so values can be compared. */
function normalizeColor(value: string): string | null {
  try {
    const { red, green, blue, alpha } = parseToRgb(value) as {
      red: number;
      green: number;
      blue: number;
      alpha?: number;
    };
    return `${red},${green},${blue},${Number(alpha ?? 1).toFixed(3)}`;
  } catch {
    return null;
  }
}

/** Flattens the legacy `palette` export into "palette.a.b" -> color string. */
function flattenLegacyPalette(
  node: Record<string, unknown> = palette as unknown as Record<string, unknown>,
  label = "palette",
  out: Record<string, string> = {},
): Record<string, string> {
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === "string") out[`${label}.${key}`] = value;
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenLegacyPalette(
        value as Record<string, unknown>,
        `${label}.${key}`,
        out,
      );
    }
  }
  return out;
}

const ds001ColorTokens = DS001_TOKENS.filter((t) => t.type === "color");

/** Index of normalized DS001 color -> token paths sharing that value. */
const ds001ByValue = ds001ColorTokens.reduce<Record<string, DS001Token[]>>(
  (acc, token) => {
    const key = normalizeColor(String(token.value));
    if (key) (acc[key] ??= []).push(token);
    return acc;
  },
  {},
);

const legacyComparison = Object.entries(flattenLegacyPalette())
  .map(([key, value]) => {
    const normalized = normalizeColor(value);
    const matches = normalized ? ds001ByValue[normalized] ?? [] : [];
    return { key, value, matches };
  })
  .sort((a, b) => a.key.localeCompare(b.key));

const matchedCount = legacyComparison.filter(
  (r) => r.matches.length > 0,
).length;

/* ----------------------------------------------------------------- stories */

/**
 * Explains what this page is for, since the tokens are not wired into anything
 * yet and would otherwise be confusing to come across.
 */
const Intro = () => (
  <Note>
    <strong>Reference only — nothing here is wired up yet.</strong> These are
    the DS001 design tokens as they exist in{" "}
    <a
      href="https://www.figma.com/design/qkH6i43t5w27PjX2f6zdLx/DS001"
      target="_blank"
      rel="noreferrer"
    >
      Figma
    </a>
    , published here so the design system in Figma can be compared against the
    one in code. They are not exported from <Mono>~design-system</Mono> and{" "}
    <Mono>palette</Mono> does not use them, so no component renders with these
    values today. Until that changes, keep using <Mono>palette</Mono>.
  </Note>
);

const meta = {
  title: "Shared/Design System/Styles/DS001 Tokens",
  // hides the individual stories in the sidebar, showing only the docs page
  tags: ["!dev"],
  parameters: {
    docs: {
      page: () => (
        <>
          <Title />
          <Intro />
          <Description />
          <Stories />
        </>
      ),
    },
  },
} satisfies Meta;

export default meta;

type TokenStory = StoryObj<typeof meta>;

/**
 * The semantic layer is what product code should consume. Each token records
 * the primitive it aliases, so a value change in the primitive propagates here.
 */
export const SemanticColors: TokenStory = {
  render: () => (
    <ColorGroups
      tokens={startsWith(byCollection("Semantics"), "Color").filter(
        (t) => t.type === "color",
      )}
    />
  ),
};

/** Spacing, typography, radii and stroke from the semantic layer. */
export const SemanticValues: TokenStory = {
  render: () => (
    <ValueGroups
      tokens={byCollection("Semantics").filter((t) => t.type !== "color")}
    />
  ),
};

/**
 * Primitives are the raw ramp. Product code should generally not reference
 * these directly — prefer a semantic token that aliases them.
 */
export const PrimitiveColors: TokenStory = {
  render: () => (
    <ColorGroups
      tokens={startsWith(byCollection("Primitives"), "Color").filter(
        (t) => t.type === "color",
      )}
    />
  ),
};

/** Raw spacing, sizing, typography and stroke primitives. */
export const PrimitiveValues: TokenStory = {
  render: () => (
    <ValueGroups
      tokens={byCollection("Primitives").filter((t) => t.type !== "color")}
    />
  ),
};

/**
 * Variables with no value set in the `default value v1 (system v2 + staging)`
 * mode. Figma exports these as a fallback zero, black or white, which is why
 * a links color reads as white and several font sizes read as 0. These need
 * a value in Figma before the mode can be treated as complete.
 */
export const UnsetInThisMode: TokenStory = {
  render: () => {
    const unset = DS001_TOKENS.filter((t) => t.unset);
    return (
      <>
        <Note>
          {unset.length} tokens have no value in this mode. The
          &ldquo;Repo&nbsp;·&nbsp;closest&rdquo; column shows what the other
          mode holds, as a hint at the intended value. Note that{" "}
          <Mono>Spacer/space-0</Mono> and <Mono>Color/Backgrounds/black</Mono>{" "}
          may be legitimately 0 and black respectively — the detection compares
          modes and cannot tell intent.
        </Note>
        <Table>
          <thead>
            <tr>
              <th aria-label="swatch" />
              <th>Token</th>
              <th>default value v1</th>
              <th>Repo · closest</th>
            </tr>
          </thead>
          <tbody>
            {unset.map((t) => (
              <tr key={t.path}>
                <td>
                  {t.type === "color" ? (
                    <Swatch color={String(t.value)} />
                  ) : null}
                </td>
                <td>
                  <Mono>{t.path}</Mono>
                </td>
                <td>
                  <Mono>{String(t.value)}</Mono> <Flag>unset</Flag>
                </td>
                <td>
                  <Mono>{String(t.repoClosestValue ?? "—")}</Mono>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </>
    );
  },
};

/**
 * Every color on the legacy `palette` export, matched against DS001 by exact
 * value. Rows with no match are colors DS001 has no equivalent for — each one
 * is a decision to make before `palette` can be repointed at DS001.
 */
export const LegacyPaletteComparison: TokenStory = {
  render: () => (
    <>
      <Note>
        {matchedCount} of {legacyComparison.length} legacy palette colors have
        an exact value match in DS001. Matching is by resolved RGBA value, not
        by name, so a match confirms the color exists in DS001 but not that the
        name agrees. <strong>pine</strong> is the clearest example: legacy{" "}
        <Mono>palette.pine1</Mono> is <Mono>#012322</Mono>, which DS001 calls{" "}
        <Mono>Color/Main/pine-deep</Mono>, so the whole ramp is offset by one.
      </Note>
      <Table>
        <thead>
          <tr>
            <th aria-label="swatch" />
            <th>Legacy token</th>
            <th>Value</th>
            <th>DS001 equivalent (by value)</th>
          </tr>
        </thead>
        <tbody>
          {legacyComparison.map(({ key, value, matches }) => (
            <tr key={key}>
              <td>
                <Swatch color={value} />
              </td>
              <td>
                <Mono>{key}</Mono>
              </td>
              <td>
                <Mono>{value}</Mono>
              </td>
              <td>
                {matches.length === 0 ? (
                  <Flag>no DS001 equivalent</Flag>
                ) : (
                  matches.map((m) => (
                    <div key={m.path}>
                      <Mono>{m.path}</Mono>
                    </div>
                  ))
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  ),
};
