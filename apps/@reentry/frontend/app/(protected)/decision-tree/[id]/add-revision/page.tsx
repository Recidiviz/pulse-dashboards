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
import { useParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import Breadcrumb from "~@reentry/frontend/components/base/Breadcrumb";
import RevisionsTable from "~@reentry/frontend/components/DecisionTrees/RevisionsTable";
import { useAuth } from "~@reentry/frontend/lib/auth";

const DynamicMarkdownEditor = dynamic(
  () => import("@uiw/react-markdown-editor").then((mod) => mod.default),
  { ssr: false },
);
// Important to use dynamic import for client-side rendering
const MermaidVisualizer = dynamic(
  () => import("~@reentry/frontend/components/DecisionTrees/MermaidVisualizer"),
  { ssr: false },
);

const AddRevision = () => {
  const { getAccessToken } = useAuth();
  const [textAreaValue, setTextAreaValue] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const { id } = useParams();

  const { mutateAsync: createRevisionMutation } = $api.useMutation(
    "post",
    "/decision-trees/{decision_tree_id}/revisions",
  );

  const { data: decisionTree, refetch: refetchDecisionTree } = $api.useQuery(
    "get",
    "/decision-trees/{decision_tree_id}",
    {
      params: {
        path: {
          decision_tree_id: id as string,
        },
      },
      headers: {
        Authorization: `Bearer ${useAuth().getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
  );

  const currentRevision = decisionTree?.revisions.find(
    (rev) => rev.id === decisionTree.current_revision_id,
  );

  const breadcrumbRoutes = [
    { label: "Home", href: "/" },
    { label: "Decision Tree", href: "/decision-tree" },
    { label: `Edit ${decisionTree?.name}`, href: "#" },
  ];

  useEffect(() => {
    if (!currentRevision) return;
    setTextAreaValue(currentRevision.mermaid_content);
    setNotes(currentRevision.notes);
  }, [currentRevision]);

  const saveRevision = async () => {
    await createRevisionMutation({
      params: {
        path: {
          decision_tree_id: id as string,
        },
      },
      body: {
        mermaid_content: textAreaValue || "",
        notes: notes || "",
      },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    });
    refetchDecisionTree();
  };

  const handleSetNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };
  return (
    <div className={"flex flex-row w-full min-h-screen bg-white"}>
      <div className="flex min-h-screen w-1/2 bg-[#d9d9d9]">
        <div className="w-full p-5 bg-[#d9d9d9] h-full">
          <Breadcrumb routes={breadcrumbRoutes} />
          <h2 className="text-[36px] text-[#6c6c6c]">
            {decisionTree?.name || "Decision tree builder"}
          </h2>
          <div className="w-full flex flex-col">
            <DynamicMarkdownEditor
              value={textAreaValue || ""}
              height="350px"
              enablePreview={false}
              onChange={(textAreaValue) => setTextAreaValue(textAreaValue)}
            />
            <div className="w-full mt-4">
              <span className="text-black text-xl font-semibold mb-4">
                Notes
              </span>
              <span className="text-[#6c6c6c] text-sm font-semibold ">
                {" "}
                (optional)
              </span>
              <textarea
                className="w-full h-28 p-2 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Write your notes here..."
                value={notes}
                onChange={handleSetNotes}
              />
            </div>
            <div className="flex gap-4 justify-center mt-4 ">
              <button
                type={"button"}
                onClick={saveRevision}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md"
              >
                Save Revision
              </button>
            </div>
          </div>
          <RevisionsTable revisions={decisionTree?.revisions} />
        </div>
      </div>
      <div className={"w-1/2"}>
        <MermaidVisualizer chart={textAreaValue} />
      </div>
    </div>
  );
};

export default AddRevision;
