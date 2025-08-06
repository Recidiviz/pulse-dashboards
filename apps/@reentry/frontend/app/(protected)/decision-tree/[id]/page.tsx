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
import { useEffect, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import Breadcrumb from "~@reentry/frontend/components/base/Breadcrumb";
import { useAuth } from "~@reentry/frontend/lib/auth";

// Important to use dynamic import for client-side rendering
const MermaidVisualizer = dynamic(
  () => import("~@reentry/frontend/components/DecisionTrees/MermaidVisualizer"),
  { ssr: false },
);

const ShowDecisionTree = () => {
  const [textAreaValue, setTextAreaValue] = useState<null | string>(null);
  const { id } = useParams();

  const { data } = $api.useQuery("get", "/decision-trees/{decision_tree_id}", {
    params: {
      path: {
        decision_tree_id: id as string,
      },
    },
    headers: {
      Authorization: `Bearer ${useAuth().getAccessToken()}`,
      "Content-Type": "application/json",
    },
  });

  const breadcrumbRoutes = [
    { label: "Home", href: "/" },
    { label: "Decision Trees", href: "/decision-tree" },
    { label: `Show ${data?.name}`, href: "#" },
  ];

  useEffect(() => {
    if (!data) return;
    if (data.revisions.length > 0) {
      const currentRevision = data.revisions.find(
        (rev) => rev.id === data.current_revision_id,
      );
      if (currentRevision) {
        setTextAreaValue(currentRevision.mermaid_content);
      }
    }
  }, [data]);

  return (
    <div className={"flex flex-row w-full min-h-screen bg-white"}>
      <div className={"w-full"}>
        <Breadcrumb routes={breadcrumbRoutes} />
        <MermaidVisualizer chart={textAreaValue || ""} />
      </div>
    </div>
  );
};

export default ShowDecisionTree;
