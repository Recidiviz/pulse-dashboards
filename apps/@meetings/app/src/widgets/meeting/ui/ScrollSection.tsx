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

import { ReactNode, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { Platform, ScrollView, View } from "react-native";

import { Tab } from "./MeetingTabs";

const isWeb = Platform.OS === "web";

const sectionId = (tab: Tab) => `meeting-section-${tab.replace(/\s+/g, "-")}`;

export const scrollToSection = (tab: Tab) => {
  if (!isWeb) return;
  document
    .getElementById(sectionId(tab))
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

type Props = {
  tab: Tab;
  scrollView: ScrollView | null;
  onVisible: (tab: Tab) => void;
  children: ReactNode;
};

export const ScrollSection = ({
  tab,
  scrollView,
  onVisible,
  children,
}: Props) => {
  const scrollRoot: Element | null = isWeb
    ? scrollView?.getScrollableNode() ?? null
    : null;

  const { ref: observeElement } = useInView({
    root: scrollRoot,
    skip: !scrollRoot,
    rootMargin: "0px 0px -80% 0px",
    onChange: (inView) => {
      if (inView) onVisible(tab);
    },
  });

  const ref = useCallback(
    (view: View | null) => observeElement(view as unknown as Element | null),
    [observeElement],
  );

  return (
    <View id={sectionId(tab)} ref={ref}>
      {children}
    </View>
  );
};
