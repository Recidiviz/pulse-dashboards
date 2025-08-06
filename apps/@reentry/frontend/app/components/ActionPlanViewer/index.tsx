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

import "@mdxeditor/editor/style.css";

import Markdown from "markdown-to-jsx";
import Image from "next/image";
import { useEffect } from "react";
import {
  MdLink,
  MdOutlineLocalPhone,
  MdOutlineLocationOn,
} from "react-icons/md";

import MdxEditor from "~@reentry/frontend/components/mdxEditor/MdxEditor";

import styles from "./markdown.module.css";

interface ActionPlanViewerProps {
  markDownPlan: string;
  update: boolean;
  internalMarkdown: string;
  setInternalMarkdown: (internalMarkdown: string) => void;
  handleSelectResource: (resourceName: string) => void;
}

const Annotation = ({ ...props }) => {
  return (
    <div className={styles["annotation"]}>
      <q>{props["text"]}</q>
      <div>
        (Extract from the {props["location"]} in the {props["source"]})
      </div>
    </div>
  );
};
const Annotations = ({ children }) => {
  return (
    <div className={` ${styles["annotations"]} annotations`}>
      <h1>Citations</h1>
      {children}
    </div>
  );
};
const Notes = ({ children }) => {
  return (
    <div className={` ${styles["notes"]} notes`}>
      <h1>Notes</h1>
      <div>{children}</div>
    </div>
  );
};

const Resources = ({ children }) => {
  return <div className={styles["resources"]}>{children}</div>;
};

const Resource = ({ ...props }) => {
  return (
    <div className={`${styles["resource"]} flex flex-col`}>
      <h3 id={props["id"].replace(/^#/, "")} data-resource-type={props["type"]}>
        {props["name"]}
      </h3>
      <div className="flex flex-col gap-2">
        {props["address"] && (
          <div className="flex items-center gap-2">
            <MdOutlineLocationOn />
            {props["address"]}
          </div>
        )}
        {props["phones"] && (
          <div className="flex items-center gap-2">
            <MdOutlineLocalPhone />
            {props["phones"]}
          </div>
        )}
        {props["website"] && props["website"] !== "None" && (
          <div className="flex items-center gap-2">
            <MdLink />
            {props["website"]}
          </div>
        )}
      </div>
    </div>
  );
};

const customLink = ({ children, handleSelectResource, ...props }) => {
  const uuidRegex = /^#.+$/;
  const urlRegex = /^https?:\/\/.+$/i;

  const identifyString = (input) => {
    if (!input) return "Invalid";
    if (uuidRegex.test(input)) {
      return "UUID";
    }
    if (urlRegex.test(input)) {
      return "URL";
    }
    return "Unknown";
  };

  const linkType = identifyString(props["href"]);

  if (linkType === "UUID") {
    return (
      <button
        type="button"
        {...props}
        onClick={() => handleSelectResource(props["href"].replace(/^#/, ""))}
        className="border-b-[3px] border-dashed border-[#f08c00] custom-link"
      >
        <div className="flex flex-row items-center gap-2">
          {children}
          <Image
            src="/images/edit.png"
            alt="edit icon"
            width={13}
            height={13}
            priority
          />
        </div>
      </button>
    );
  }

  if (linkType === "URL") {
    return (
      <a
        {...props}
        className="text-blue-600 underline hover:text-blue-800 visited:text-purple-600"
        target="_blank"
        rel="noopener noreferrer" // to improve security and privacy
      >
        <div className="flex flex-row items-center gap-2">{children}</div>
      </a>
    );
  }

  return <span>{children}</span>;
};

const ActionPlanViewer = ({
  markDownPlan,
  update,
  internalMarkdown,
  setInternalMarkdown,
  handleSelectResource,
}: ActionPlanViewerProps) => {
  useEffect(() => {
    setInternalMarkdown(markDownPlan);
  }, [markDownPlan, setInternalMarkdown]);

  return (
    <>
      {update ? (
        <div className="w-full my-4" data-color-mode="light">
          <MdxEditor
            markDownPlan={markDownPlan}
            internalMarkdown={internalMarkdown}
            setInternalMarkdown={setInternalMarkdown}
          />
        </div>
      ) : (
        <div>
          <Markdown
            className={`${styles["markdown"]} my-4`}
            options={{
              overrides: {
                annotations: { component: Annotations },
                annotation: { component: Annotation },
                notes: { component: Notes },
                resources: { component: Resources },
                resource: { component: Resource },
                a: {
                  component: customLink,
                  props: {
                    handleSelectResource,
                  },
                },
              },
            }}
          >
            {markDownPlan}
          </Markdown>
        </div>
      )}
    </>
  );
};

export default ActionPlanViewer;
