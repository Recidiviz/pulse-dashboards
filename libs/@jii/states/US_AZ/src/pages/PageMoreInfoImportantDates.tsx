// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { captureException } from "@sentry/react";

import { usePageTitle } from "~@jii/common-ui";
import { HeadingsAggregator } from "~@jii/layout";
import { useUsAzTranslations } from "~@jii/translation";

import { DefinitionView } from "../components/DefinitionView";
import { ImportantDatesCopyWrapper } from "../components/ImportantDatesCopyWrapper";

// captures some additional nested headings for the TOC;
// we only want a certain subset of the h3s to be included in addition to the h2s
// (specifically the ones in the section about TPR)
const importantDateHeadingsAggregator: HeadingsAggregator = (elements) => {
  const mainHeadings = elements.filter((e) => e.type === "h2");
  // we are expecting this distinctive section nesting here; if we don't find it,
  // the worst that should happen is that we'll be missing the second level of TOC
  const tprSection = elements.find(
    (e) => e.type === "section" && e.props.class === "tpr",
  );
  const tprHeadings: Array<JSX.Element> = [];
  // we can't rely on types here so we'll just bail out invisibly if anything goes wrong
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tprSection?.props.children.forEach((el: any) => {
      if (typeof el === "object" && el.type === "h3") {
        tprHeadings.push(el);
      }
    });
  } catch (e) {
    captureException(e);
  }

  return mainHeadings.map((mainHeading, i) => ({
    target: mainHeading,
    // another assumption we are making here: TPR is the first section
    children: i === 0 ? tprHeadings.map((h) => ({ target: h })) : undefined,
  }));
};

export function PageMoreInfoImportantDates() {
  const { t } = useUsAzTranslations();

  const { heading, body } = t(($) => $.importantDates.moreInfo, {
    returnObjects: true,
  });

  usePageTitle(heading);

  return (
    <DefinitionView
      heading={heading}
      body={body}
      CopyWrapperOverride={ImportantDatesCopyWrapper}
      tocHeadingsAggregatorOverride={importantDateHeadingsAggregator}
    />
  );
}
