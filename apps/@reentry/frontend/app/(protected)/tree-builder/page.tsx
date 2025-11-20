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

"use client";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Chip,
  CssBaseline,
  Drawer,
  Stack,
  Toolbar,
  Tooltip,
} from "@mui/material";
import mermaid from "mermaid";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { DEFAULT_TREE } from "~@reentry/frontend/constants";

import TopAppBar from "../../components/TopAppBar";
import { generateKey } from "../../utils";

const DynamicMarkdownEditor = dynamic(
  () => import("@uiw/react-markdown-editor").then((mod) => mod.default),
  { ssr: false },
);
mermaid.initialize({});
const drawerWidth = "40%";
enum NodeType {
  Action = 0,
  Decision = 1,
}

interface Node {
  label: string;
  edges: string[];
  type: NodeType;
}

const TreeBuilder = () => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [graphType, setGraphType] = useState<string>("");
  const [nodes, setNodes] = useState<{ [key: string]: Node }>({});
  const [source, setSource] = useState<null | string>(null);
  const [textAreaValue, setTextAreaValue] = useState<null | string>(null);
  useEffect(() => {
    setSource(DEFAULT_TREE);
    setTextAreaValue(DEFAULT_TREE);
  }, []);
  useEffect(() => {
    const initializeMermaid = async () => {
      setLoading(true);
      if (mermaidRef.current && source) {
        mermaidRef.current.innerHTML = source;
        const { svg, bindFunctions } = await mermaid.render(
          `mermaid-diagram-${"mermaid-graph"}`,
          source,
        );
        mermaidRef.current.innerHTML = svg;
        bindFunctions?.(mermaidRef.current);
        setLoading(false);
      }
    };

    initializeMermaid();

    // Clean up mermaid instance when unmounting; doing nothing at the momemt
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }, [source]);
  const getMermaidJson = async () => {
    const mermaidData = await mermaid.mermaidAPI.getDiagramFromText(
      textAreaValue || "",
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (mermaidData.parser as any).yy.getData() as {
      nodes: { id: string; label: string; shape: string }[];
      edges: { start: string; end: string }[];
    };
    const nodes = {} as { [key: string]: Node };
    // eslint-disable-next-line array-callback-return
    data.nodes.map((e) => {
      nodes[e.id] = {
        label: e.label,
        type: e.shape === "diamond" ? NodeType.Decision : NodeType.Action,
        edges: data.edges
          .filter((edge) => edge.start === e.id)
          .map((edge) => edge.end),
      };
    });
    setNodes(nodes);
    setSource(textAreaValue);
    setGraphType(mermaidData.getType());
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <TopAppBar />
      <CssBaseline />
      <TopAppBar />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <div className="flex h-full">
          <div className="w-full p-5 bg-[#d9d9d9] h-full">
            <h2 className="text-[36px] text-[#6c6c6c]">
              Decission tree builder
            </h2>
            <div className="w-full flex flex-col">
              <DynamicMarkdownEditor
                value={textAreaValue || ""}
                height="200px"
                enablePreview={false}
                onChange={(textAreaValue) => setTextAreaValue(textAreaValue)}
              />
              <LoadingButton onClick={getMermaidJson}>
                Generate new diagram
              </LoadingButton>
              {Object.keys(nodes).length > 0 && (
                <div>
                  <p>
                    Graph type: <span className="font-bold">{graphType}</span>
                  </p>
                  <p>Nodes: </p>
                  <Stack direction="column" spacing={1}>
                    {Object.keys(nodes).map((key, _idx) => (
                      <div key={generateKey(`node-info-${_idx}`)}>
                        <Tooltip title={`${nodes[key].label}`} arrow>
                          <Chip
                            className="w-[35px]"
                            label={key}
                            color={
                              nodes[key].type === NodeType.Decision
                                ? "warning"
                                : "primary"
                            }
                          />
                        </Tooltip>
                        <div className="flex flex-col">
                          {nodes[key].edges.map((edge, _edix) => (
                            <div
                              key={generateKey(`edge-info-${_idx}-${_edix}`)}
                            >
                              {nodes[key].label} {"-->"} {nodes[edge].label}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </Stack>
                </div>
              )}
            </div>
          </div>
        </div>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <div className={`w-1/2 ${loading && "invisible"}`}>
          <div id={"mermaid-graph"} ref={mermaidRef} />
        </div>
      </Box>
    </Box>
  );
};

export default TreeBuilder;
