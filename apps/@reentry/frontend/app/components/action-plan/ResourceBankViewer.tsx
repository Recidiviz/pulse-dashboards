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

import Markdown from "markdown-to-jsx";

import markdownStyles from "~@reentry/frontend/components/shared/styles/markdown.module.css";

import styles from "./styles/ResourceBankViewer.module.css";

interface ResourceBankViewerProps {
  markDownPlan: string;
}

const Annotation = ({ ...props }) => (
  <div className={markdownStyles["annotation"]}>
    <q>{props["text"]}</q>
    <div>
      (Extract from the {props["location"]} in the {props["source"]})
    </div>
  </div>
);

const Annotations = ({ children }) => (
  <div className={`${markdownStyles["annotations"]} annotations`}>
    <h1>Citations</h1>
    {children}
  </div>
);

const Notes = ({ children }) => (
  <div className={`${markdownStyles["notes"]} notes`}>
    <h1>Notes</h1>
    <div>{children}</div>
  </div>
);

const ResourceBankViewer = ({ markDownPlan }: ResourceBankViewerProps) => {
  return (
    <div>
      <Markdown
        className={`${markdownStyles["markdown"]} ${styles["markdownWrapper"]}`}
        options={{
          overrides: {
            annotations: { component: Annotations },
            annotation: { component: Annotation },
            notes: { component: Notes },
          },
        }}
      >
        {markDownPlan}
      </Markdown>
    </div>
  );
};

export default ResourceBankViewer;
