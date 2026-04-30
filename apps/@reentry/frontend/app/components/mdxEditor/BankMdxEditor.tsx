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
"use client";

import "@mdxeditor/editor/style.css";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  headingsPlugin,
  InsertThematicBreak,
  type JsxComponentDescriptor,
  JsxEditorProps,
  jsxPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  NestedLexicalEditor,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import { useEffect, useMemo } from "react";

import { ResourceSection } from "~@reentry/frontend/hooks/resourceBank.types";

import ResourceBank from "../action-plan/ResourceBank";
import styles from "../shared/styles/markdown.module.css";
import bankStyles from "./BankMdxEditor.module.css";

interface MdxEditorProps {
  internalMarkdown: string;
  setInternalMarkdown: (internalMarkdown: string) => void;
  allResources?: ResourceSection[];
  onResourceRemove: (id: string, name: string, sectionTitle: string) => void;
  clientFirstName: string;
}

export const NotesEditor = (props: JsxEditorProps) => {
  const mdastChildren = props.mdastNode?.children || [];

  const renderMdastContent = (
    nodes: JsxEditorProps["mdastNode"]["children"],
  ) => {
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return <div className="no-content">No content available</div>;
    }
    return nodes.map((node, index) => {
      if (!node) return null;
      if (node.type === "paragraph") {
        return (
          <p key={index} className={bankStyles["paragraph"]}>
            {node.children?.map((textNode, i) => {
              if (textNode.type === "text") {
                return <span key={i}>{textNode.value}</span>;
              }
              return null;
            })}
          </p>
        );
      }
      if (node.type === "text") {
        return <span key={index}>{node.value}</span>;
      }
      return null;
    });
  };

  return (
    <div className={`${styles["notes"]} notes`}>
      <div className="notes-header">
        <h1>Notes</h1>
      </div>
      <div className="notes-content">{renderMdastContent(mdastChildren)}</div>
    </div>
  );
};

export const AnnotationsEditor = () => {
  return (
    <div
      className={`${styles["annotations"]} ${bankStyles["annotationsWrapper"]}`}
    >
      <div className={`annotations-header ${bankStyles["annotationsHeader"]}`}>
        <h1>Citations</h1>
      </div>
      <div className="annotations-content">
        <NestedLexicalEditor
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getContent={(node) => (node as { children: any[] }).children}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getUpdatedMdastNode={(mdastNode: any, children: any) => {
            return { ...mdastNode, children };
          }}
        />
      </div>
    </div>
  );
};

const getNodeProps = (
  props: JsxEditorProps,
): Record<string, string | undefined> => {
  if (props.mdastNode?.attributes) {
    return props.mdastNode.attributes.reduce<
      Record<string, string | undefined>
    >((acc, attr) => {
      if (attr.type === "mdxJsxAttribute") {
        acc[attr.name] = attr.value as string | undefined;
      }
      return acc;
    }, {});
  }
  return {};
};

export const AnnotationEditor = (props: JsxEditorProps) => {
  const nodeProps = getNodeProps(props);
  const { source, location, text } = nodeProps;

  return (
    <div
      className={`${styles["annotation"]} ${bankStyles["annotationWrapper"]}`}
    >
      <div className="annotation-content">
        <q className={bankStyles["citationText"]}>{text || "Citation text"}</q>
        {(source || location) && (
          <div className={bankStyles["citationSource"]}>
            (Extract from the {location || "[location]"} in the{" "}
            {source || "[source]"})
          </div>
        )}
      </div>
    </div>
  );
};

const MdxEditor = ({
  internalMarkdown,
  setInternalMarkdown,
  allResources,
  clientFirstName,
  onResourceRemove,
}: MdxEditorProps) => {
  useEffect(() => {
    const resetScroll = () => {
      const scrollContainer = document.querySelector(".actionPlanSide");
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    };
    const timeoutId = setTimeout(resetScroll, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleChange = (newMarkdown) => {
    // clean up the markdown
    const pureMarkdown = newMarkdown.replace(/^import\s+.*?[;\n]/gm, "").trim();
    setInternalMarkdown(pureMarkdown);
  };

  const jsxComponentDescriptors: JsxComponentDescriptor[] = useMemo(() => {
    const ResourcesEditor = (props: JsxEditorProps) => {
      const nodeProps = getNodeProps(props);
      const { section } = nodeProps;
      return (
        <div className="resources-content">
          <ResourceBank
            sectionTitle={section ?? ""}
            clientFirstName={clientFirstName}
            onRemove={onResourceRemove}
            allResources={allResources ?? []}
          />
        </div>
      );
    };

    return [
      {
        name: "notes",
        kind: "flow",
        source: "./components",
        props: [],
        hasChildren: true,
        Editor: NotesEditor,
      },
      {
        name: "resources",
        kind: "flow",
        source: "./components",
        props: [{ name: "section", type: "string" }],
        hasChildren: false,
        Editor: ResourcesEditor,
      },
      {
        name: "annotations",
        kind: "flow",
        source: "./components",
        props: [],
        hasChildren: true,
        Editor: AnnotationsEditor,
      },
      {
        name: "annotation",
        kind: "flow",
        hasChildren: false,
        source: "./components",
        props: [
          { name: "source", type: "string" },
          { name: "location", type: "string" },
          { name: "text", type: "string" },
        ],
        Editor: AnnotationEditor,
      },
    ];
  }, [allResources, clientFirstName, onResourceRemove]);

  return (
    <div className={bankStyles["editorWrapper"]} data-color-mode="light">
      <MDXEditor
        contentEditableClassName={"markdown-edit-content"}
        className={`${styles["markdown"]}`}
        markdown={internalMarkdown}
        onChange={handleChange}
        plugins={[
          // basic plugins
          headingsPlugin(), // for markdown support
          listsPlugin(),
          linkPlugin(),
          quotePlugin(),
          jsxPlugin({ jsxComponentDescriptors }), //jsx embedded components
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          tablePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <BlockTypeSelect />
                <ListsToggle />
                <InsertThematicBreak />
              </>
            ),
            toolbarClassName: "larger-toolbar",
          }),
        ]}
      />
    </div>
  );
};

export default MdxEditor;
