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

/****************************
 * State Agnostic Constants *
 ****************************/
export const MAX_RETRY_ATTEMPTS = 3;
export const BQ_DATASET_ID = "twilio_webhook_requests";
export const BQ_REPLIES_VIEW_ID = "jii_texting_incoming_messages";

/****************************
 * Idaho LSU Constants *
 ****************************/
export const US_ID_LSU_VISIT_LINK =
  "\n\nSee all requirements at rviz.co/id_lsu.";
export const US_ID_LSU_LEARN_MORE = "\n\nLearn more at rviz.co/id_lsu.";
export const EARLIEST_LSU_MESSAGE_SEND_UTC_HOURS = 18;
