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

import { ReactNode, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

import { animation, Button, Icon, IconSVG } from "~design-system";

import { semantics } from "../../theme";

const { radius, space, status, surface, type } = semantics;

export type CalloutTone = "info" | "success" | "warning" | "error";

export type CalloutLayout = "inline" | "strip";

type ToneStyle = {
  /** The fill, a semantic status surface. */
  background: string;
  /** The text and icon colour, the matching semantic status tone. */
  text: string;
  icon: keyof typeof IconSVG;
};

// The semantic status tone on its own status surface. Each pair passes WCAG AA,
// which semantics.test.ts and the Callout tests both check.
export const CALLOUT_TONE_STYLES: Record<CalloutTone, ToneStyle> = {
  info: { background: surface.info, text: status.info, icon: "Info" },
  success: {
    background: surface.success,
    text: status.success,
    icon: "Success",
  },
  warning: {
    background: surface.warning,
    text: status.warning,
    icon: "Alert",
  },
  error: { background: surface.error, text: status.error, icon: "Error" },
};

const Wrapper = styled.div<{
  $tone: CalloutTone;
  $layout: CalloutLayout;
  $dismissing: boolean;
}>`
  ${type.Sans14}
  display: flex;
  align-items: center;
  gap: ${space.md}px;
  box-sizing: border-box;
  background-color: ${({ $tone }) => CALLOUT_TONE_STYLES[$tone].background};
  color: ${({ $tone }) => CALLOUT_TONE_STYLES[$tone].text};
  opacity: ${({ $dismissing }) => ($dismissing ? 0 : 1)};
  transition: opacity ${animation.defaultDurationMs}ms;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  ${({ $layout }) =>
    $layout === "strip"
      ? css`
          width: 100%;
          padding: ${space.md}px ${space.lg}px;
        `
      : css`
          border-radius: ${radius.control};
          padding: ${space.md}px;
        `}
`;

const ToneIcon = styled.span`
  display: flex;
  flex-shrink: 0;
`;

// A white label in the tone's colour. status tones pass AA on white too.
const Tag = styled.span`
  ${type.Sans12}
  flex-shrink: 0;
  background-color: ${surface.bg};
  padding: ${space.xs}px ${space.sm}px;
  border-radius: ${radius.control};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space.xs}px;
  min-width: 0;
`;

// One DS step up from the message, since the type scale has no bold token.
const Title = styled.div`
  ${type.Sans16}
`;

const Detail = styled.div`
  ${type.Sans12}
`;

// The trailing buttons keep the focus ring ~design-system's GlobalStyle gives
// every element, which is border.focus.
const Trailing = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: ${space.sm}px;
  margin-left: auto;
`;

type CalloutProps = {
  tone: CalloutTone;
  /** A bold first line. Used alone, it is the whole message. */
  title?: ReactNode;
  /** The message. Rendered as React children, never as HTML. */
  children?: ReactNode;
  /** A smaller line under the message, such as who published. */
  detail?: ReactNode;
  /** A control on the right, usually a ~design-system Button. */
  action?: ReactNode;
  /**
   * Shows a dismiss button. It fades the callout out, then calls this, so
   * the caller removes the callout once it is invisible.
   */
  onDismiss?: () => void;
  /** "strip" spans the full width with no radius, for page status banners. */
  layout?: CalloutLayout;
  /** A short label on the left, such as "Draft". Replaces the tone icon. */
  tag?: string;
  /**
   * When true (the default), warning and error tones get role="alert" and
   * info and success get role="status", so screen readers announce them.
   * Pass false for a banner that is part of the page rather than news.
   */
  live?: boolean;
  className?: string;
};

// TODO(CO-935): Waiting on ~design-system to add a Callout component. Replace this one with it once it lands.
/**
 * A tinted strip or box for a page status, an inline error or a dismissible
 * notice, such as the DRAFT and UPLOAD COMPLETE strips on the Public Calendar
 * screen in the Calendar Unit Dashboard design. Colours, type, spacing and
 * radius come from the semantic theme, so it follows the design system's
 * look rather than the mock's.
 */
export function Callout({
  tone,
  title,
  children,
  detail,
  action,
  onDismiss,
  layout = "inline",
  tag,
  live = true,
  className,
}: CalloutProps) {
  const [dismissing, setDismissing] = useState(false);
  // A ref, so a parent re-rendering mid-fade with a new onDismiss doesn't
  // restart the timer.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!dismissing) return undefined;
    // Repeat clicks during the fade only set dismissing again, which doesn't
    // rerun this effect, so onDismiss fires once. The delay also applies
    // under reduced motion, where the callout disappears without a fade.
    const timer = setTimeout(
      () => onDismissRef.current?.(),
      animation.defaultDurationMs,
    );
    return () => clearTimeout(timer);
  }, [dismissing]);

  let role: "alert" | "status" | undefined;
  if (live) role = tone === "warning" || tone === "error" ? "alert" : "status";

  return (
    <Wrapper
      role={role}
      className={className}
      $tone={tone}
      $layout={layout}
      $dismissing={dismissing}
    >
      {tag != null ? (
        <Tag>{tag}</Tag>
      ) : (
        <ToneIcon aria-hidden>
          <Icon kind={CALLOUT_TONE_STYLES[tone].icon} size={16} />
        </ToneIcon>
      )}
      <Content>
        {title != null && <Title>{title}</Title>}
        {children != null && <div>{children}</div>}
        {detail != null && <Detail>{detail}</Detail>}
      </Content>
      {(action || onDismiss) && (
        <Trailing>
          {action}
          {onDismiss && (
            <Button
              kind="borderless"
              shape="block"
              icon="Close"
              aria-label="Dismiss"
              onClick={() => setDismissing(true)}
            />
          )}
        </Trailing>
      )}
    </Wrapper>
  );
}
