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

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  headingsPlugin,
  InsertThematicBreak,
  type JsxComponentDescriptor,
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
import { useEffect } from "react";
import {
  MdLink,
  MdOutlineLocalPhone,
  MdOutlineLocationOn,
} from "react-icons/md";

import styles from "../ActionPlanViewer/markdown.module.css";

interface MdxEditorProps {
  markDownPlan: string;
  internalMarkdown: string;
  setInternalMarkdown: (internalMarkdown: string) => void;
}

export const NotesEditor = (props) => {
  const mdastChildren = props.mdastNode?.children || [];

  const renderMdastContent = (nodes) => {
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return <div className="no-content">No content available</div>;
    }
    return nodes.map((node, index) => {
      if (!node) return null;
      if (node.type === "paragraph") {
        return (
          <p key={index} className="mb-2">
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
    <div className={`${styles["annotations"]} p-3 border rounded-lg`}>
      <div className="annotations-header mb-2">
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

export const AnnotationEditor = (props) => {
  const getNodeProps = () => {
    if (props.mdastNode?.attributes) {
      return props.mdastNode.attributes.reduce((acc, attr) => {
        if (attr.type === "mdxJsxAttribute") {
          acc[attr.name] = attr.value;
        }
        return acc;
      }, {});
    }
    return {};
  };

  const nodeProps = getNodeProps();
  const { source, location, text } = nodeProps;

  return (
    <div
      className={`${styles["annotation"]} p-3 border-l-4 border-gray-300 mb-3 bg-gray-50 rounded`}
    >
      <div className="annotation-content">
        <q className="block text-gray-700 italic mb-2">
          {text || "Citation text"}
        </q>
        {(source || location) && (
          <div className="text-sm text-gray-500">
            (Extract from the {location || "[location]"} in the{" "}
            {source || "[source]"})
          </div>
        )}
      </div>
    </div>
  );
};

export const ResourcesEditor = () => {
  return (
    <div className="resources-content">
      <NestedLexicalEditor
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getContent={(node) => (node as { children: any[] }).children}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getUpdatedMdastNode={(mdastNode: any, children: any) => {
          return { ...mdastNode, children };
        }}
      />
    </div>
  );
};

export const ResourceEditor = (props) => {
  const getNodeProps = () => {
    if (props.mdastNode?.attributes) {
      return props.mdastNode.attributes.reduce((acc, attr) => {
        if (attr.type === "mdxJsxAttribute") {
          acc[attr.name] = attr.value;
        }
        return acc;
      }, {});
    }
    return {};
  };

  const nodeProps = getNodeProps();
  const { type, name, address, website, phones, emails } = nodeProps;

  return (
    <div
      className={`${styles["resource"]} flex flex-col p-3 border rounded-md mb-2`}
    >
      <div className="resource-header mb-2">
        <h3 className="font-bold">{name || "Resource"}</h3>
        {type && <div className="text-sm text-gray-500">Type: {type}</div>}
      </div>

      <div className="resource-content flex flex-col gap-2">
        {address && (
          <div className="flex items-center gap-2">
            <MdOutlineLocationOn />
            <span>{address}</span>
          </div>
        )}

        {phones && (
          <div className="flex items-center gap-2">
            <MdOutlineLocalPhone />
            <span>{phones}</span>
          </div>
        )}

        {website && website !== "None" && (
          <div className="flex items-center gap-2">
            <MdLink />
            <span>{website}</span>
          </div>
        )}

        {emails && (
          <div className="flex items-center gap-2">
            <span>📧</span>
            <span>{emails}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ReadOnlyLinkEditor = (props) => {
  const getNodeProps = () => {
    if (props.mdastNode?.attributes) {
      return props.mdastNode.attributes.reduce((acc, attr) => {
        if (attr.type === "mdxJsxAttribute") {
          acc[attr.name] = attr.value;
        }
        return acc;
      }, {});
    }
    return {};
  };

  const nodeProps = getNodeProps();
  const { href } = nodeProps;

  const linkText = props.mdastNode?.children?.[0]?.value || "Link";

  return (
    <a className="markdown-edit-content-link" href={href || "#"}>
      {linkText}
    </a>
  );
};

export const jsxComponentDescriptors: JsxComponentDescriptor[] = [
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
    props: [],
    hasChildren: true,
    Editor: ResourcesEditor,
  },
  {
    name: "resource",
    kind: "flow",
    hasChildren: false,
    source: "./components",
    props: [
      { name: "id", type: "string" },
      { name: "type", type: "string" },
      { name: "name", type: "string" },
      { name: "address", type: "string" },
      { name: "website", type: "string" },
      { name: "phones", type: "string" },
      { name: "emails", type: "string" },
    ],
    Editor: ResourceEditor,
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
  {
    name: "readonlylink",
    kind: "flow",
    source: "./components",
    props: [{ name: "href", type: "string" }],
    hasChildren: true,
    Editor: ReadOnlyLinkEditor,
  },
];

const MdxEditor = ({
  markDownPlan,
  internalMarkdown,
  setInternalMarkdown,
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

  useEffect(() => {
    setInternalMarkdown(markDownPlan);
  }, [markDownPlan]);

  const handleChange = (newMarkdown) => {
    // clean up the markdown
    const pureMarkdown = newMarkdown.replace(/^import\s+.*?[;\n]/gm, "").trim();
    setInternalMarkdown(pureMarkdown);
  };

  function preprocessMarkdown(markdown) {
    // replacing <a> with <readonlylink> to be able to make it read-only with a custom directive
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/gi;
    const processedMarkdown = markdown.replaceAll(
      linkRegex,
      (match, text, url) => {
        return `<readonlylink href='${url}'>${text}</readonlylink>`;
      },
    );
    return processedMarkdown;
  }

  return (
    <div className="w-full my-4" data-color-mode="light">
      <MDXEditor
        contentEditableClassName={"markdown-edit-content"}
        className={`${styles["markdown"]}`}
        markdown={preprocessMarkdown(internalMarkdown)}
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
