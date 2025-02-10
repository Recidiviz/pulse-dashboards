// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

export const TEST_BUCKET_ID = "test-bucket";

export const caseBody = {
  bucketId: TEST_BUCKET_ID,
  objectId: "US_ID/sentencing_case_record.json",
};

export const clientBody = {
  bucketId: TEST_BUCKET_ID,
  objectId: "US_ID/sentencing_client_record.json",
};

export const staffBody = {
  bucketId: TEST_BUCKET_ID,
  objectId: "US_ID/sentencing_staff_record.json",
};

export const opportunityBody = {
  bucketId: TEST_BUCKET_ID,
  objectId: "US_ID/sentencing_community_opportunity_record.json",
};

export const insightBody = {
  bucketId: TEST_BUCKET_ID,
  objectId: "US_ID/case_insights_record.json",
};

export const offenseBody = {
  bucketId: TEST_BUCKET_ID,
  objectId: "US_ID/sentencing_charge_record.json",
};

export const countiesAndDistrictsBody = {
  bucketId: TEST_BUCKET_ID,
  objectId: "US_ID/sentencing_counties_and_districts.json",
};
