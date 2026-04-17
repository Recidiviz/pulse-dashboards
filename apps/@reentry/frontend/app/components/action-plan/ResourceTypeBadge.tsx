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

import React from "react";

import styles from "./styles/ResourceTypeBadge.module.css";

type ResourceTypeBadgeProps = {
  category: string;
  subcategory?: string | null;
};

// Map ResourceCategory enum values to CSS module classes
// Subcategories will inherit the color from their parent category
const CATEGORY_STYLES: Record<string, string> = {
  // New categories
  Housing: styles["housing"],
  Employment: styles["employment"],
  "Basic Needs": styles["basicNeeds"],
  "Mental Health": styles["mentalHealth"],
  "Substance Use": styles["substanceUse"],
  "Physical Health": styles["physicalHealth"],
  "Legal Aid & Rights Restoration": styles["legalAid"],
  "Education & Vocational Training": styles["education"],
  "Family Reconnection & Parenting": styles["familyReconnection"],
  "Peer Support & Community Integration": styles["peerSupport"],

  // Legacy categories
  "Employment and Career Support": styles["employment"],
  Education: styles["education"],
  "Behavioral Health Services": styles["mentalHealth"],
  "Medical and Health Services": styles["physicalHealth"],
  "Legal and Financial Assistance": styles["legalAid"],
  "Family and Community Support": styles["familyReconnection"],
  Transportation: styles["transportation"],
  "Specialized Services": styles["specializedServices"],
  "Community and Social Reintegration": styles["peerSupport"],
  Unknown: styles["unknown"],
};

const ResourceTypeBadge: React.FC<ResourceTypeBadgeProps> = ({
  category,
  subcategory,
}) => {
  // Display subcategory if available, otherwise display category
  const displayText = subcategory || category;

  // Color is always derived from category, so subcategories inherit parent color
  const colorStyle = CATEGORY_STYLES[category] ?? CATEGORY_STYLES["Unknown"];

  return (
    <div className={`${styles["badge"]} ${colorStyle}`}>
      <div className={styles["label"]}>{displayText}</div>
    </div>
  );
};

export default ResourceTypeBadge;
