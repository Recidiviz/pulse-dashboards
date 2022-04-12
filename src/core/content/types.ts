/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import { MetricId } from "../models/types";
import { CoreOrPathwaysPage, PathwaysPage, PathwaysSection } from "../views";

export type PageContent = {
  title: string;
  summary: string;
  sections?: Sections;
  methodology?: string;
};

export type Sections = {
  [key in PathwaysSection]: string;
};

export type PageCopy = {
  [key in PathwaysPage]: PageContent;
};

export type StateSpecificPageCopy = {
  [key in CoreOrPathwaysPage]?: Partial<PageContent>;
};

export type MetricContent = {
  title: string;
  note?: string;
  chartXAxisTitle?: string;
  chartYAxisTitle?: string;
  methodology?: string;
};

export type MetricCopy = {
  [key in MetricId]: MetricContent;
};

export type StateSpecificMetricCopy = {
  [key in MetricId]?: Partial<MetricContent>;
};
