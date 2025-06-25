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

import { Prisma } from "~@sentencing/prisma/client";

export type PrismaOpportunity = Prisma.OpportunityGetPayload<{
  omit: {
    id: true;
  };
}>;

export type DataSource = "internal" | "external";

export type Opportunity = Omit<PrismaOpportunity, "providerName"> & {
  providerName: PrismaOpportunity["providerName"] | null;
  source: DataSource;
};

export type AuthResponse = {
  success: boolean;
  data?: {
    user_id: number;
    token: string;
  };
};

type Office = {
  phone_number: string;
  address1: string;
};

export type Programs = {
  count: number;
  programs: {
    name: string;
    description: string;
    provider_name: string;
    website_url: string;
    offices: Office[];
    attribute_tags: string[];
    service_tags: string[];
  }[];
};

export type TaxonomyNode = {
  label: string;
  description?: string;
  children?: TaxonomyNode[];
};

export type ServiceTaxonomy = {
  nodes: TaxonomyNode[];
};
