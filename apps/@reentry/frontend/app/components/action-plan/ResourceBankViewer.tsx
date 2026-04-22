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
import type { ResourceSection } from "~@reentry/frontend/hooks/resourceBank.types";
import type { components } from "~@reentry/openapi-types";

import ResourceBank from "./ResourceBank";
import styles from "./styles/ResourceBankViewer.module.css";

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

interface ResourceBankViewerProps {
  markDownPlan: string | null | undefined;
  clientName?: components["schemas"]["FullNameModel"] | null;
  allResources?: ResourceSection[];
  onResourceRemove?: (id: string, name: string, sectionTitle: string) => void;
  isLoadingResources?: boolean;
  isErrorResources?: boolean;
}

const ResourceBankViewer = ({
  markDownPlan,
  clientName,
  onResourceRemove,
  allResources,
  isLoadingResources,
  isErrorResources,
}: ResourceBankViewerProps) => {
  const fullName = clientName
    ? `${clientName.given_names} ${clientName.surname}`
    : "";
  if (!markDownPlan) return null;
  return (
    <>
      <div className={styles["planHeader"]}>
        <div className={styles["planLabel"]}>Action plan</div>
        <div className={styles["planTitle"]}>{fullName}</div>
      </div>
      <Markdown
        className={`${markdownStyles["markdown"]} ${styles["markdownWrapper"]}`}
        options={{
          overrides: {
            annotations: { component: Annotations },
            annotation: { component: Annotation },
            notes: { component: Notes },
            resources: {
              component: ResourceBank,
              props: {
                allResources,
                clientFirstName: clientName?.given_names || "the client",
                onRemove: onResourceRemove,
                isLoadingResources,
                isErrorResources,
              },
            },
          },
        }}
      >
        {markDownPlan}
      </Markdown>
    </>
  );
};

export default ResourceBankViewer;
