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

import { useUsMaTranslations } from "~@jii/translation";
import { Icon } from "~design-system";

import { ChevronButton, Fade, Wrapper } from "./ScrollCue.styles";

// Animates the scroll, unless the resident has asked their device to reduce
// motion.
const scrollToBottom = () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
};

export const ScrollCue = () => {
  const { t } = useUsMaTranslations();

  return (
    <Wrapper>
      <Fade aria-hidden />
      <ChevronButton
        type="button"
        aria-label={t(($) => $.reentry.questionnaire.footer.showMore)}
        onClick={scrollToBottom}
      >
        <Icon kind="ChevronDown" size={20} />
      </ChevronButton>
    </Wrapper>
  );
};
