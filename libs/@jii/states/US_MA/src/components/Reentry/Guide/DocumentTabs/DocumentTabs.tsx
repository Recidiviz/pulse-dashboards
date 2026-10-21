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

import { Tabs } from "@recidiviz/design-system";

import { GuideCopy } from "../Guide.styles";
import { GuideCallout, GuideCalloutCopy } from "../GuideCallout/GuideCallout";
import {
  DocumentTab,
  DocumentTabList,
  DocumentTabPanel,
  PanelHeading,
} from "./DocumentTabs.styles";

export type GuideDocument = {
  tabLabel: string;
  heading: string;
  body: string;
  howTo: GuideCalloutCopy;
};

type DocumentTabsProps = {
  documents: Record<string, GuideDocument>;
};

export const DocumentTabs = ({ documents }: DocumentTabsProps) => {
  const documentEntries = Object.entries(documents);

  return (
    <Tabs>
      <DocumentTabList>
        {documentEntries.map(([documentId, { tabLabel }]) => (
          <DocumentTab key={documentId}>{tabLabel}</DocumentTab>
        ))}
      </DocumentTabList>

      {documentEntries.map(([documentId, { heading, body, howTo }]) => (
        <DocumentTabPanel key={documentId}>
          <PanelHeading>{heading}</PanelHeading>
          <GuideCopy>{body}</GuideCopy>
          <GuideCallout {...howTo} />
        </DocumentTabPanel>
      ))}
    </Tabs>
  );
};
