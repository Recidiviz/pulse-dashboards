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
} as const;

// TODO(CO-935): Waiting on ~design-system to export stroke tokens. Replace with the DS export once it lands.
export const stroke = {
  // DS001 strokeDefault.
  default: rem(spacing.xxs),
} as const;

export const space = spacing;

export const type = typography;
