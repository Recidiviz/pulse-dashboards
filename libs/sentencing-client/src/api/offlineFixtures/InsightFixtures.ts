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

import { Insight, SARInsight } from "../APIClient";

export const InsightFixture: Insight = {
  gender: "MALE",
  offense: "Sample Offense",
  offenseCategory: null,
  assessmentScoreBucketStart: 0,
  assessmentScoreBucketEnd: 0,
  rollupGender: null,
  rollupAssessmentScoreBucketStart: null,
  rollupAssessmentScoreBucketEnd: null,
  rollupOffenseName: "Sample Offense",
  rollupRecidivismNumRecords: 100,
  rollupOffenseDescription: "Sample Offense offenses",
  rollupRecidivismSeries: [
    {
      recommendationType: "Probation",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      dataPoints: [
        { cohortMonths: 0, eventRate: 0.0, lowerCI: 0.0, upperCI: 0.002 },
        { cohortMonths: 6, eventRate: 0.008, lowerCI: 0.004, upperCI: 0.013 },
        { cohortMonths: 12, eventRate: 0.025, lowerCI: 0.019, upperCI: 0.032 },
        { cohortMonths: 24, eventRate: 0.064, lowerCI: 0.055, upperCI: 0.075 },
        { cohortMonths: 36, eventRate: 0.115, lowerCI: 0.102, upperCI: 0.129 },
      ],
    },
    {
      recommendationType: "Incarceration",
      sentenceLengthBucketStart: 1,
      sentenceLengthBucketEnd: 2,
      dataPoints: [
        { cohortMonths: 0, eventRate: 0.0, lowerCI: 0.0, upperCI: 0.015 },
        { cohortMonths: 6, eventRate: 0.042, lowerCI: 0.02, upperCI: 0.075 },
        { cohortMonths: 12, eventRate: 0.125, lowerCI: 0.086, upperCI: 0.174 },
        { cohortMonths: 24, eventRate: 0.213, lowerCI: 0.163, upperCI: 0.27 },
        { cohortMonths: 36, eventRate: 0.28, lowerCI: 0.216, upperCI: 0.332 },
      ],
    },
    {
      recommendationType: "Incarceration",
      sentenceLengthBucketStart: 3,
      sentenceLengthBucketEnd: 5,
      dataPoints: [
        { cohortMonths: 0, eventRate: 0.0, lowerCI: 0.0, upperCI: 0.011 },
        { cohortMonths: 6, eventRate: 0.03, lowerCI: 0.015, upperCI: 0.055 },
        { cohortMonths: 12, eventRate: 0.061, lowerCI: 0.038, upperCI: 0.093 },
        { cohortMonths: 24, eventRate: 0.143, lowerCI: 0.105, upperCI: 0.183 },
        { cohortMonths: 36, eventRate: 0.267, lowerCI: 0.226, upperCI: 0.318 },
      ],
    },
    {
      recommendationType: "Incarceration",
      sentenceLengthBucketStart: 6,
      sentenceLengthBucketEnd: -1,
      dataPoints: [
        { cohortMonths: 0, eventRate: 0.0, lowerCI: 0.0, upperCI: 0.009 },
        { cohortMonths: 6, eventRate: 0.02, lowerCI: 0.01, upperCI: 0.04 },
        { cohortMonths: 12, eventRate: 0.055, lowerCI: 0.032, upperCI: 0.085 },
        { cohortMonths: 24, eventRate: 0.16, lowerCI: 0.12, upperCI: 0.21 },
        { cohortMonths: 36, eventRate: 0.31, lowerCI: 0.25, upperCI: 0.37 },
      ],
    },
    {
      recommendationType: "Treatment_in_prison",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      dataPoints: [
        { cohortMonths: 0, eventRate: 0.0, lowerCI: 0.0, upperCI: 0.012 },
        { cohortMonths: 6, eventRate: 0.035, lowerCI: 0.018, upperCI: 0.06 },
        { cohortMonths: 12, eventRate: 0.09, lowerCI: 0.065, upperCI: 0.12 },
        { cohortMonths: 24, eventRate: 0.18, lowerCI: 0.145, upperCI: 0.22 },
        { cohortMonths: 36, eventRate: 0.24, lowerCI: 0.2, upperCI: 0.285 },
      ],
    },
  ],
  dispositionNumRecords: 120,
  dispositionData: [
    {
      recommendationType: "Probation",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      percentage: 0.72,
    },
    {
      recommendationType: "Incarceration",
      sentenceLengthBucketStart: 1,
      sentenceLengthBucketEnd: 2,
      percentage: 0.1,
    },
    {
      recommendationType: "Incarceration",
      sentenceLengthBucketStart: 3,
      sentenceLengthBucketEnd: 5,
      percentage: 0.1,
    },
    {
      recommendationType: "Incarceration",
      sentenceLengthBucketStart: 6,
      sentenceLengthBucketEnd: -1,
      percentage: 0.02,
    },
    {
      recommendationType: "Treatment_in_prison",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      percentage: 0.06,
    },
  ],
};

// MO-appropriate SAR insight fixture: uses sentence-length buckets and MO-specific
// disposition types (Court-Ordered Treatment) instead of PSI types
// (Rider, Term). rollupRecidivismSeries uses 12/24/36-month cohorts per MO data schema.
export const SARInsightFixture: NonNullable<SARInsight> = {
  gender: "MALE",
  offense: "Theft",
  offenseCategory: "Property",
  assessmentScoreBucketStart: 1,
  assessmentScoreBucketEnd: 1,
  rollupGender: "MALE",
  rollupAssessmentScoreBucketStart: 1,
  rollupAssessmentScoreBucketEnd: 1,
  rollupOffenseName: "Theft",
  rollupOffenseDescription: "Theft offenses",
  rollupRecidivismNumRecords: 374,
  rollupRecidivismSeries: [
    {
      recommendationType: "Probation",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      dataPoints: [
        { cohortMonths: 12, eventRate: 0.12, lowerCI: 0.09, upperCI: 0.15 },
        { cohortMonths: 24, eventRate: 0.22, lowerCI: 0.18, upperCI: 0.27 },
        { cohortMonths: 36, eventRate: 0.31, lowerCI: 0.26, upperCI: 0.36 },
      ],
    },
    {
      recommendationType: "Court Ordered Treatment",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      dataPoints: [
        { cohortMonths: 12, eventRate: 0.1, lowerCI: 0.07, upperCI: 0.13 },
        { cohortMonths: 24, eventRate: 0.19, lowerCI: 0.15, upperCI: 0.24 },
        { cohortMonths: 36, eventRate: 0.27, lowerCI: 0.22, upperCI: 0.33 },
      ],
    },
    {
      recommendationType: null,
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: 1,
      dataPoints: [
        { cohortMonths: 12, eventRate: 0.15, lowerCI: 0.1, upperCI: 0.2 },
        { cohortMonths: 24, eventRate: 0.28, lowerCI: 0.22, upperCI: 0.35 },
        { cohortMonths: 36, eventRate: 0.38, lowerCI: 0.3, upperCI: 0.46 },
      ],
    },
    {
      recommendationType: null,
      sentenceLengthBucketStart: 1,
      sentenceLengthBucketEnd: 3,
      dataPoints: [
        { cohortMonths: 12, eventRate: 0.18, lowerCI: 0.13, upperCI: 0.24 },
        { cohortMonths: 24, eventRate: 0.32, lowerCI: 0.25, upperCI: 0.4 },
        { cohortMonths: 36, eventRate: 0.43, lowerCI: 0.34, upperCI: 0.52 },
      ],
    },
    {
      recommendationType: null,
      sentenceLengthBucketStart: 3,
      sentenceLengthBucketEnd: -1,
      dataPoints: [
        { cohortMonths: 12, eventRate: 0.2, lowerCI: 0.14, upperCI: 0.27 },
        { cohortMonths: 24, eventRate: 0.35, lowerCI: 0.28, upperCI: 0.43 },
        { cohortMonths: 36, eventRate: 0.46, lowerCI: 0.37, upperCI: 0.55 },
      ],
    },
    {
      recommendationType: "Treatment_in_prison",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      dataPoints: [
        { cohortMonths: 12, eventRate: 0.14, lowerCI: 0.09, upperCI: 0.2 },
        { cohortMonths: 24, eventRate: 0.25, lowerCI: 0.19, upperCI: 0.32 },
        { cohortMonths: 36, eventRate: 0.34, lowerCI: 0.27, upperCI: 0.42 },
      ],
    },
  ],
  dispositionNumRecords: 847,
  dispositionData: [
    {
      recommendationType: "Probation",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      percentage: 0.38,
    },
    {
      recommendationType: "Court Ordered Treatment",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      percentage: 0.12,
    },
    {
      recommendationType: null,
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: 1,
      percentage: 0.11,
    },
    {
      recommendationType: null,
      sentenceLengthBucketStart: 1,
      sentenceLengthBucketEnd: 3,
      percentage: 0.18,
    },
    {
      recommendationType: null,
      sentenceLengthBucketStart: 3,
      sentenceLengthBucketEnd: -1,
      percentage: 0.15,
    },
    {
      recommendationType: "Treatment_in_prison",
      sentenceLengthBucketStart: 0,
      sentenceLengthBucketEnd: -1,
      percentage: 0.06,
    },
  ],
  avgSentenceLengthYears: null,
  avgPctServed: null,
  timeServedNumRecords: null,
};
