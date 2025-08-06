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
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import Breadcrumb from "~@reentry/frontend/components/base/Breadcrumb";
import { useAuth } from "~@reentry/frontend/lib/auth";

import { DEFAULT_TREE } from "../../../constants";

const DynamicMarkdownEditor = dynamic(
  () => import("@uiw/react-markdown-editor").then((mod) => mod.default),
  { ssr: false },
);

// Important to use dynamic import for client-side rendering
const MermaidVisualizer = dynamic(
  () => import("~@reentry/frontend/components/DecisionTrees/MermaidVisualizer"),
  { ssr: false },
);

const TreeBuilder = () => {
  const { getAccessToken } = useAuth();
  const [textAreaValue, setTextAreaValue] = useState<null | string>(null);
  const [name, setName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const breadcrumbRoutes = [
    { label: "Home", href: "/" },
    { label: "Decision Tree", href: "/decision-tree" },
    { label: "Create", href: "#" },
  ];

  useEffect(() => {
    setTextAreaValue(DEFAULT_TREE);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.name.endsWith(".mermaid")) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTextAreaValue(content);
      };

      reader.readAsText(file);
    } else {
      alert("Please upload a valid .mermaid file");
    }
  };

  const { mutateAsync: createDecisionTreeMutation } = $api.useMutation(
    "post",
    "/decision-trees",
  );
  const { mutateAsync: createRevisionMutation } = $api.useMutation(
    "post",
    "/decision-trees/{decision_tree_id}/revisions",
  );

  const saveDecisionTree = async () => {
    if (!name || !textAreaValue) {
      setErrorMessage("Name and text area are required");
      return;
    }

    try {
      const decisionTree = await createDecisionTreeMutation({
        body: {
          name,
        },
      });
      await createRevisionMutation({
        params: {
          path: { decision_tree_id: decisionTree.id },
        },
        body: {
          mermaid_content: textAreaValue,
          notes: "",
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      router.push(`/decision-tree/${decisionTree.id}/add-revision`);
    } catch (error) {
      console.error("Error saving decision tree:", error);
    }
  };

  return (
    <div className={"flex flex-row w-full min-h-screen bg-white"}>
      <div className="flex min-h-screen w-1/2 bg-[#d9d9d9]">
        <div className="w-full p-5 bg-[#d9d9d9] h-full">
          <Breadcrumb routes={breadcrumbRoutes} />
          <h2 className="text-[36px] text-[#6c6c6c]">Decision tree builder</h2>
          <div className="w-full flex flex-col">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 mt-4 border border-gray-400 rounded-lg mb-4 text-black"
              required={true}
            />
            {errorMessage && !name && (
              <p className="text-red-600 text-sm">Name is required</p>
            )}
            <DynamicMarkdownEditor
              value={textAreaValue || ""}
              height="400px"
              enablePreview={false}
              onChange={(textAreaValue) => setTextAreaValue(textAreaValue)}
            />
            <div className="flex gap-4 justify-center mt-4 ">
              <div>
                <input
                  type="file"
                  accept=".mermaid"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-48 h-12 bg-blue-600 hover:bg-blue-900 text-white font-semibold rounded-lg shadow-md"
                >
                  Import file
                </label>
              </div>
              <button
                type={"button"}
                onClick={saveDecisionTree}
                className={`${name && textAreaValue ? "bg-green-600 hover:bg-green-700" : "bg-gray-600"}  px-4 py-2 text-white font-semibold rounded-lg shadow-md`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className={"w-1/2"}>
        <MermaidVisualizer chart={textAreaValue || ""} />
      </div>
    </div>
  );
};

export default TreeBuilder;
