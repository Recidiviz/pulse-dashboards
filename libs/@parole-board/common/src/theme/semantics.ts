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

// TODO(CO-935): Waiting on ~design-system to export semantic tokens. Replace this layer with the DS exports once they land.

import { rem, rgba } from "polished";

import { palette, spacing, typography } from "~design-system";

/**
 * Semantic names for the Parole Board calendar UI's colours, spacing, type and
 * radius, following the groups in the Figma System v2 file (text, icon,
 * surface, border, action, status, radius). Every value aliases an existing
 * ~design-system token; none is a new colour.
 *
 * Components in the Parole Board libraries read colours, type, spacing and
 * radius only from here, never from palette or a hex or rgb literal, so one
 * change here (or the DS export that replaces it) restyles every screen.
 *
 * Where ds001Semantics in libs/design-system/src/styles/ds001-tokens.ts names
 * the same role, the alias follows it when palette exports that colour. Text
 * and status colours pass WCAG AA (4.5:1) on white and on the surfaces they
 * sit on; semantics.test.ts checks every pairing.
 */

export const text = {
  // DS001 textPrimary is pine2.
  primary: palette.pine2,
  // DS001 textMuted80.
  secondary: palette.slate80,
  // Disabled text is exempt from WCAG contrast (1.4.3), so it stays lighter.
  disabled: palette.slate60,
  // A disabled option's name, a step lighter than its disabled caption, as
  // the Add a month design draws "Already added" months.
  disabledSubtle: palette.slate40,
  link: palette.signal.links,
  onColor: palette.white,
} as const;

// TODO(CO-935): Waiting on ~design-system to export status tones. Replace with the DS export once it lands.
export const status = {
  // DS001 statusInfo, signal.notification, is 4.0:1 on its own 10% tint, so
  // info text takes the darker blue data.indigo2.
  info: palette.data.indigo2,
  // DS001 statusSuccess, signal.highlight, is 2.5:1 on white, so success
  // takes pine3.
  success: palette.pine3,
  // TODO(CO-935): Waiting on ~design-system to export a dark amber that passes AA as text. Use it for status.warning and icon.alert once it lands.
  // Palette's amber, signal.important, is 2.1:1 on white, so warning text is
  // pine2 on the amber surface.warning tint. signal.warning is a red and reads
  // as an error.
  warning: palette.pine2,
  error: palette.signal.error,
} as const;

export const icon = {
  // DS001 iconDefault is pine2.
  default: palette.pine2,
  subtle: palette.slate60,
  critical: status.error,
  success: status.success,
  // Matches status.warning: signal.important is 2.1:1 on white, under the 3:1
  // an icon needs, so the amber tint behind it carries the tone.
  alert: palette.pine2,
} as const;

export const surface = {
  bg: palette.white,
  page: palette.marble2,
  card: palette.white,
  muted: palette.marble3,
  // DS001 surfaceHover is slate20.
  hover: palette.slate20,
  // A selected option drawn as a solid fill, such as the chosen day. The
  // design's #0099FF has no token and is 3.0:1 under white text;
  // signal.notification is the nearest palette blue that passes AA (4.6:1).
  selected: palette.signal.notification,
  callout: palette.slate05,
  // DS001 surfaceBadge is slate10.
  badge: palette.slate10,
  // TODO(CO-935): Waiting on ~design-system to export status backgrounds. Replace with the DS export once it lands.
  // Each is a DS001-style status*Bg, a tone at 10% opacity: info, success and
  // error use DS001's tones. Warning tints palette's amber, signal.important,
  // at 20% so it reads as amber next to the error tint.
  info: rgba(palette.signal.notification, 0.1),
  success: rgba(palette.signal.highlight, 0.1),
  warning: rgba(palette.signal.important, 0.2),
  error: rgba(palette.signal.error, 0.1),
} as const;

export const border = {
  default: palette.slate20,
  faint: palette.slate10,
  // DS001 borderFocus is signal.notification.
  focus: palette.signal.notification,
  // DS001 borderAction is pine4.
  action: palette.pine4,
  // The ring around a selected tile. signal.selected is the palette blue
  // nearest the design's #0099FF and shows at 3.2:1 on white.
  selected: palette.signal.selected,
} as const;

export const action = {
  // The DS Button's primary background (libs/design-system/src/components/
  // Button/Button.styles.tsx, primaryButtonStyles). DS001 actionPrimary is
  // pine3, but the calendar uses the DS Button as it looks.
  primary: palette.signal.links,
  destructive: status.error,
} as const;

// TODO(CO-935): Waiting on ~design-system to export radius tokens. Replace with the DS export once it lands.
export const radius = {
  // The DS Button's block radius and DS001 radiusButton and radiusInput.
  control: rem(4),
  // The DS Card's radius and DS001 radiusCard.
  card: rem(8),
  // The DS Button's default pill shape and DS001 radiusPill.
  pill: rem(999),
  // The design's tile corner, the same 2px the DS Checkbox draws its box with.
  // TODO(CO-935): Waiting on ~design-system to export a 2px radius token. Alias it here once it lands.
  tile: rem(2),
} as const;

// TODO(CO-935): Waiting on ~design-system to export stroke tokens. Replace with the DS export once it lands.
export const stroke = {
  // DS001 strokeDefault.
  default: rem(spacing.xxs),
  // The focus outline's width and its gap from the control, as the DS
  // Checkbox and Radio draw theirs.
  focus: rem(2),
  focusOffset: rem(2),
} as const;

// TODO(CO-935): Waiting on ~design-system to add a selectable tile (a checkbox or radio drawn as a bordered card) with its own spacing and type steps. Use them and delete this group once they land.
/**
 * The checkbox and radio tiles' measurements from the Calendar Unit Dashboard
 * design. Each falls between two DS spacing or type steps, so they stay
 * together here rather than in space or type.
 */
export const tile = {
  // One-line tiles (meeting types, facilities) are padded 11px by 10px and
  // two-line tiles (months) 12px by 10px.
  padding: `${rem(11)} ${rem(10)}`,
  paddingDescribed: `${rem(12)} ${rem(10)}`,
  // Day tiles are 34px by 32px with a 6px gap, which fits 13 days per row in
  // the 524px Add a hearing dialog.
  compactWidth: rem(34),
  compactHeight: rem(32),
  compactGap: rem(6),
  // A one-line tile's name, between Sans12 and Sans14.
  nameSize: rem(13),
  // The line that gives a one-line tile the design's 36px height.
  nameLineHeight: rem(12),
  // The caption under a month's name: 9.5px uppercase on a 13px line.
  captionSize: rem(9.5),
  captionLineHeight: rem(13),
  captionTracking: "0.08em",
} as const;

export const space = spacing;

export const type = typography;
