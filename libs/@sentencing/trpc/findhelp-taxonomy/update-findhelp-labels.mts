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

import { NeedToBeAddressed } from "@prisma/sentencing/client";
import axios from "axios";

import {
  ServiceTaxonomy,
  TaxonomyNode,
} from "~@sentencing/trpc/routes/opportunity/types";
import { refreshAuthToken } from "~@sentencing/trpc/routes/opportunity/utils";

async function getTaxonomy() {
  const token = await refreshAuthToken();

  const taxonomy = await axios.get<ServiceTaxonomy>(
    `https://api.auntberthaqa.com/v2/taxonomy`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return taxonomy.data;
}

const FINDHELP_SERVICE_TAXONOMY = await getTaxonomy();

function getAllLabelsForNode(node: TaxonomyNode) {
  const labels = [node.label.toLowerCase()];
  for (const child of node.children ?? []) {
    labels.push(...getAllLabelsForNode(child));
  }
  return labels;
}

// TODO(https://github.com/Recidiviz/recidiviz-data/issues/39327): Labels can appear multiple times throughout the tree, so we need to handle that case
// NOTE: We assume the labels are in mutually exclusive parts of the tree for this algorithm.
function getLabelsForNodesAndTheirChildren(...labels: string[]) {
  const nodesToSearch: TaxonomyNode[] = FINDHELP_SERVICE_TAXONOMY.nodes.slice();
  const labelsLeft = new Set(labels);

  const matchingNodes = [];
  while (labelsLeft.size > 0 && nodesToSearch.length > 0) {
    const currentNode = nodesToSearch.pop();
    if (!currentNode) {
      break;
    }

    const isMatchingLabel = labelsLeft.has(currentNode.label);

    // If we found the label, add it to the list of matching nodes, remove it from the list of labels we're looking for, and don't add its children to the search since we assume the labels we are searching are in mutually exclusive parts of the tree
    if (isMatchingLabel) {
      matchingNodes.push(currentNode);
      labelsLeft.delete(currentNode.label);
      continue;
    }

    nodesToSearch.unshift(...(currentNode.children ?? []));
  }

  return matchingNodes.flatMap(getAllLabelsForNode);
}

function main() {
  const labelsByNeed: Partial<Record<NeedToBeAddressed, string[]>> = {
    [NeedToBeAddressed.AngerManagement]:
      getLabelsForNodesAndTheirChildren("Anger Management"),
    [NeedToBeAddressed.CaseManagement]:
      getLabelsForNodesAndTheirChildren("One-on-One Support"),
    [NeedToBeAddressed.ClothingAndToiletries]:
      getLabelsForNodesAndTheirChildren("Goods"),
    [NeedToBeAddressed.Education]:
      getLabelsForNodesAndTheirChildren("Education"),
    [NeedToBeAddressed.FamilyServices]: getLabelsForNodesAndTheirChildren(
      "Daytime Care",
      "Family Services",
    ),
    [NeedToBeAddressed.FoodInsecurity]: getLabelsForNodesAndTheirChildren(
      "Help Pay for Food",
      "Emergency Food",
      "Food",
    ),
    [NeedToBeAddressed.FinancialAssistance]: getLabelsForNodesAndTheirChildren(
      "Financial Assistance",
      "Government Benefits",
      "Loans",
    ),
    [NeedToBeAddressed.Healthcare]: getLabelsForNodesAndTheirChildren(
      "Dental Care",
      "Help Pay for Healthcare",
      "Vision Care",
      "Medical Care",
    ),
    [NeedToBeAddressed.GeneralReEntrySupport]:
      getLabelsForNodesAndTheirChildren(
        "Navigating the System",
        "Daily Life Skills",
        "Support Network",
      ),
    [NeedToBeAddressed.HousingOpportunities]: getLabelsForNodesAndTheirChildren(
      "Housing",
      "Help Find Housing",
    ),
    [NeedToBeAddressed.JobTrainingOrOpportunities]:
      getLabelsForNodesAndTheirChildren("Work", "Help Finding Work"),
    [NeedToBeAddressed.MentalHealth]: getLabelsForNodesAndTheirChildren(
      "Mental Health Care",
      "Counseling",
      "Medication Management",
      "Psychiatric Emergency Services",
      "Understand Mental Health",
    ),
    [NeedToBeAddressed.SubstanceUse]: getLabelsForNodesAndTheirChildren(
      "Addiction & Recovery",
      "12-Step",
      "Residential Treatment",
    ),
    [NeedToBeAddressed.Transportation]:
      getLabelsForNodesAndTheirChildren("Transit"),
  };

  console.log(JSON.stringify(labelsByNeed, null, 2));
}

main();
