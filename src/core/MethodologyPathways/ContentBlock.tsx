// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import Markdown from "markdown-to-jsx";
import React from "react";
import ScrollableAnchor from "react-scrollable-anchor";

import { convertToSlug } from "../../utils/navigation";
import { MethodologyContent } from "../models/types";

type Props = {
  content: MethodologyContent;
  subBlock?: boolean;
};

const ContentBlock: React.FC<Props> = ({ content, subBlock = false }) => {
  return (
    <ScrollableAnchor
      id={convertToSlug(content.title)}
      // The key is necessary here to force the ScrollableAnchor to remount
      // when there is new content to ensure the correct #id for TOC navigation
      key={convertToSlug(content.title)}
    >
      <div className="Methodology__block">
        {subBlock ? (
          <h4 className="Methodology__sub-block--title ">{content.title}</h4>
        ) : (
          <>
            <h3 className="Methodology__block--title ">{content.title}</h3>
            <hr />
          </>
        )}
        <div className="Methodology__block--content">
          <Markdown>{content.methodology || ""}</Markdown>
        </div>
      </div>
    </ScrollableAnchor>
  );
};

export default ContentBlock;
