-- Colorado Parole Board calendar seed data: the PAROLE_BOARD_PUBLIC calendar,
-- its 2 resource types, 3 entry kinds, 37 hearing locations and 39 patterns at
-- version 1 (37 HEARING, FULL_BOARD every Friday and BUSINESS_MEETING on the
-- 3rd Friday). The Calendar row and the kind rows hold only identity,
-- labels and order: the calendar's settings and each kind's behaviour are code
-- in libs/@modules/Calendar/rules/src/us_co/parole_board.
--
-- This is seed data, not a migration. Run it by hand against Colorado's
-- Calendar database (CALENDAR__US_CO) only, after prisma migrate deploy has
-- created the tables:
--
--   psql -v ON_ERROR_STOP=1 -f 20261030120000_us_co_parole_board_calendar.sql
--
-- with the connection details in psql's environment, so the connection string
-- is never printed. Until it runs, the Calendar API answers NOT_FOUND
-- "Calendar not found".
--
-- It is safe to re-run. The file is one transaction, so a failed run leaves
-- nothing behind, and every INSERT skips rows that already exist, so it never
-- overwrites a row, including one edited in the app since. It does insert again
-- any of these rows deleted since.
--
-- Seed files are named and applied like migrations: <timestamp>_<name>.sql, in
-- name order. Never edit a file once it has been run against staging or prod;
-- a data change is a new file. US_CO_REFERENCE_DATA in the rules library is a
-- typed test fixture and may drift from this data.
--
-- Child rows find their calendar, resource type, kind and resource by code,
-- so this file never repeats an id. Ids are cuid-shaped ("c" and 24 hex
-- characters) and derived from each row's natural key, so every environment
-- gets the same ids. Audit columns name "system:reference-data", never a
-- person.

BEGIN;

-- Calendar
INSERT INTO "public"."Calendar"
  ("id", "code", "name", "createdByEmail", "updatedAt", "updatedByEmail")
VALUES
  ('c' || left(md5('US_CO/PAROLE_BOARD_PUBLIC'), 24), 'PAROLE_BOARD_PUBLIC', 'Colorado Parole Board hearing calendar',
   'system:reference-data', CURRENT_TIMESTAMP, 'system:reference-data')
ON CONFLICT DO NOTHING;

-- Resource types
INSERT INTO "public"."CalendarResourceType" ("id", "calendarId", "code", "label", "sortOrder")
SELECT 'c' || left(md5('US_CO/PAROLE_BOARD_PUBLIC/resourceType/' || v.code), 24), calendar."id", v.code, v.label, v.sort_order
FROM (VALUES
  ('FACILITY', 'Facility', 1),
  ('COMMUNITY', 'Community', 2)
) AS v (code, label, sort_order)
JOIN "public"."Calendar" AS calendar
  ON calendar."code" = 'PAROLE_BOARD_PUBLIC'
ON CONFLICT DO NOTHING;

-- Entry kinds
INSERT INTO "public"."CalendarEntryKind" ("id", "calendarId", "code", "label", "sortOrder")
SELECT 'c' || left(md5('US_CO/PAROLE_BOARD_PUBLIC/kind/' || v.code), 24), calendar."id", v.code, v.label, v.sort_order
FROM (VALUES
  ('HEARING', 'Hearing', 1),
  ('FULL_BOARD', 'Full Board', 2),
  ('BUSINESS_MEETING', 'Business Mtg', 3)
) AS v (code, label, sort_order)
JOIN "public"."Calendar" AS calendar
  ON calendar."code" = 'PAROLE_BOARD_PUBLIC'
ON CONFLICT DO NOTHING;

-- Hearing locations
INSERT INTO "public"."CalendarResource"
  ("id", "calendarId", "typeId", "code", "label", "name", "sortOrder", "isActive",
   "createdByEmail", "updatedAt", "updatedByEmail")
SELECT 'c' || left(md5('US_CO/PAROLE_BOARD_PUBLIC/resource/' || v.code), 24), calendar."id", type."id", v.code, v.label, v.name, v.sort_order, v.is_active,
  'system:reference-data', CURRENT_TIMESTAMP, 'system:reference-data'
FROM (VALUES
  ('FCF', 'FACILITY', 'FCF', 'Fremont Correctional Facility', 10, true),
  ('CTCF', 'FACILITY', 'CTCF', 'Colorado Territorial Correctional Facility', 20, true),
  ('SCCF', 'FACILITY', 'SCCF', 'San Carlos Correctional Facility', 30, true),
  ('ACC', 'FACILITY', 'ACC', 'Arrowhead Correctional Center', 40, true),
  ('CSP', 'FACILITY', 'CSP', 'Colorado State Penitentiary', 50, true),
  ('FMCC', 'FACILITY', 'FMCC', 'Four Mile Correctional Center', 60, true),
  ('AVCF', 'FACILITY', 'AVCF', 'Arkansas Valley Correctional Facility', 70, true),
  ('LVCF', 'FACILITY', 'LVCF', 'La Vista Correctional Facility', 80, true),
  ('CCF', 'FACILITY', 'CCF', 'Centennial Correctional Facility', 90, true),
  ('SCF', 'FACILITY', 'SCF', 'Sterling Correctional Facility', 100, true),
  ('ICC/FED', 'FACILITY', 'ICC/FED', 'Federal Transfer / Interstate Compact Transfer', 110, true),
  ('YOS', 'FACILITY', 'YOS', 'Youthful Offender System', 120, true),
  ('BVCF', 'FACILITY', 'BVCF', 'Buena Vista Correctional Facility', 130, true),
  ('BVMC', 'FACILITY', 'BVMC', 'Buena Vista Minimum Center', 140, true),
  ('CCCF', 'FACILITY', 'CCCF', 'Crowley County Correctional Facility', 150, true),
  ('BCCF', 'FACILITY', 'BCCF', 'Bent County Correctional Facility', 160, true),
  ('LCF', 'FACILITY', 'LCF', 'Limon Correctional Facility', 170, true),
  ('DCC', 'FACILITY', 'DCC', 'Delta Correctional Center', 180, true),
  ('DRDC', 'FACILITY', 'DRDC', 'Denver Reception & Diagnostic Center', 190, true),
  ('SCC', 'FACILITY', 'SCC', 'Skyline Correctional Center', 200, true),
  ('RCC', 'FACILITY', 'RCC', 'Rifle Correctional Center', 210, true),
  ('TCF', 'FACILITY', 'TCF', 'Trinidad Correctional Facility', 220, true),
  ('DWCF', 'FACILITY', 'DWCF', 'Denver Women''s Correctional Facility', 230, true),
  ('DENCOM WTM BDY', 'COMMUNITY', 'DENCOM WTM BDY', 'Denver Community Westminster', 240, true),
  ('BOULDER', 'COMMUNITY', 'Boulder', 'Boulder', 250, true),
  ('HILLTOP', 'COMMUNITY', 'Hilltop', 'Hilltop', 260, true),
  ('ISP FREMONT', 'COMMUNITY', 'ISP Fremont', 'Fremont', 270, true),
  ('ISP/MONTROSE', 'COMMUNITY', 'ISP/Montrose', 'Montrose', 280, true),
  ('ISPGRFLD/MESA', 'COMMUNITY', 'ISP Grfld/Mesa', 'Garfield/Mesa', 290, true),
  ('LAMAR', 'COMMUNITY', 'Lamar', 'Lamar', 300, true),
  ('SLV', 'COMMUNITY', 'SLV', 'San Luis Valley', 310, true),
  ('STERCOM', 'COMMUNITY', 'STERCOM', 'Sterling', 320, true),
  ('ISP/DEN ENG', 'COMMUNITY', 'ISP/DEN ENG', 'Denver Community Englewood', 330, true),
  ('COSCOM', 'COMMUNITY', 'COSCOM', 'Colorado Springs', 340, true),
  ('FT. COLLINS', 'COMMUNITY', 'Ft. Collins', 'Ft. Collins', 350, true),
  ('GREELEY', 'COMMUNITY', 'Greeley', 'Greeley', 360, true),
  ('ICCS/PUEBLO', 'COMMUNITY', 'ICCS/Pueblo', 'Pueblo', 370, true)
) AS v (code, type_code, label, name, sort_order, is_active)
JOIN "public"."Calendar" AS calendar
  ON calendar."code" = 'PAROLE_BOARD_PUBLIC'
JOIN "public"."CalendarResourceType" AS type
  ON type."calendarId" = calendar."id" AND type."code" = v.type_code
ON CONFLICT DO NOTHING;

-- Patterns, all at version 1
INSERT INTO "public"."CalendarEntryPattern"
  ("id", "calendarId", "kindId", "resourceId", "slotKey", "version", "rules", "startTime", "endTime", "createdByEmail")
SELECT 'c' || left(md5('US_CO/PAROLE_BOARD_PUBLIC/pattern/' || v.slot_key || '/1'), 24), calendar."id", kind."id", resource."id", v.slot_key, 1,
  v.rules::jsonb, v.start_time, v.end_time, 'system:reference-data'
FROM (VALUES
  ('HEARING', 'FCF', 'HEARING:FCF', '[{"type":"weekOfMonth","week":1,"weekday":"MONDAY"},{"type":"weekOfMonth","week":2,"weekday":"MONDAY"}]', '08:00', NULL),
  ('HEARING', 'CTCF', 'HEARING:CTCF', '[{"type":"weekOfMonth","week":1,"weekday":"MONDAY"}]', '08:00', NULL),
  ('HEARING', 'SCCF', 'HEARING:SCCF', '[{"type":"weekOfMonth","week":1,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'ACC', 'HEARING:ACC', '[{"type":"weekOfMonth","week":1,"weekday":"TUESDAY"}]', '08:00', NULL),
  ('HEARING', 'CSP', 'HEARING:CSP', '[{"type":"weekOfMonth","week":1,"weekday":"WEDNESDAY"}]', '08:00', NULL),
  ('HEARING', 'FMCC', 'HEARING:FMCC', '[{"type":"weekOfMonth","week":1,"weekday":"WEDNESDAY"}]', '08:00', NULL),
  ('HEARING', 'AVCF', 'HEARING:AVCF', '[{"type":"weekOfMonth","week":2,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'LVCF', 'HEARING:LVCF', '[{"type":"weekOfMonth","week":2,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'CCF', 'HEARING:CCF', '[{"type":"weekOfMonth","week":2,"weekday":"TUESDAY"},{"type":"weekOfMonth","week":2,"weekday":"WEDNESDAY"}]', '08:00', NULL),
  ('HEARING', 'SCF', 'HEARING:SCF', '[{"type":"weekOfMonth","week":2,"weekday":"TUESDAY"},{"type":"weekOfMonth","week":2,"weekday":"WEDNESDAY"}]', '08:00', NULL),
  ('HEARING', 'ICC/FED', 'HEARING:ICC/FED', '[{"type":"weekOfMonth","week":3,"weekday":"THURSDAY"}]', '10:00', NULL),
  ('HEARING', 'YOS', 'HEARING:YOS', '[{"type":"weekOfMonth","week":3,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'BVCF', 'HEARING:BVCF', '[{"type":"weekOfMonth","week":3,"weekday":"TUESDAY"}]', '08:00', NULL),
  ('HEARING', 'BVMC', 'HEARING:BVMC', '[{"type":"weekOfMonth","week":3,"weekday":"TUESDAY"}]', '08:00', NULL),
  ('HEARING', 'CCCF', 'HEARING:CCCF', '[{"type":"weekOfMonth","week":3,"weekday":"WEDNESDAY"},{"type":"weekOfMonth","week":3,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'BCCF', 'HEARING:BCCF', '[{"type":"weekOfMonth","week":4,"weekday":"MONDAY"},{"type":"weekOfMonth","week":4,"weekday":"TUESDAY"}]', '08:00', NULL),
  ('HEARING', 'LCF', 'HEARING:LCF', '[{"type":"weekOfMonth","week":4,"weekday":"MONDAY"}]', '08:00', NULL),
  ('HEARING', 'DCC', 'HEARING:DCC', '[{"type":"weekOfMonth","week":4,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'DRDC', 'HEARING:DRDC', '[{"type":"weekOfMonth","week":4,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'SCC', 'HEARING:SCC', '[{"type":"weekOfMonth","week":4,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'RCC', 'HEARING:RCC', '[{"type":"weekOfMonth","week":4,"weekday":"TUESDAY"},{"type":"weekOfMonth","week":4,"weekday":"WEDNESDAY"}]', '08:00', NULL),
  ('HEARING', 'TCF', 'HEARING:TCF', '[{"type":"weekOfMonth","week":4,"weekday":"TUESDAY"}]', '08:00', NULL),
  ('HEARING', 'DWCF', 'HEARING:DWCF', '[{"type":"weekOfMonth","week":4,"weekday":"WEDNESDAY"}]', '08:00', NULL),
  ('HEARING', 'DENCOM WTM BDY', 'HEARING:DENCOM WTM BDY', '[{"type":"weekOfMonth","week":2,"weekday":"MONDAY"}]', '08:00', NULL),
  ('HEARING', 'BOULDER', 'HEARING:BOULDER', '[{"type":"weekOfMonth","week":3,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'HILLTOP', 'HEARING:HILLTOP', '[{"type":"weekOfMonth","week":3,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'ISP FREMONT', 'HEARING:ISP FREMONT', '[{"type":"weekOfMonth","week":3,"weekday":"THURSDAY"}]', '09:00', NULL),
  ('HEARING', 'ISP/MONTROSE', 'HEARING:ISP/MONTROSE', '[{"type":"weekOfMonth","week":3,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'ISPGRFLD/MESA', 'HEARING:ISPGRFLD/MESA', '[{"type":"weekOfMonth","week":3,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'LAMAR', 'HEARING:LAMAR', '[{"type":"weekOfMonth","week":3,"weekday":"THURSDAY"}]', '11:00', NULL),
  ('HEARING', 'SLV', 'HEARING:SLV', '[{"type":"weekOfMonth","week":3,"weekday":"THURSDAY"}]', '10:00', NULL),
  ('HEARING', 'STERCOM', 'HEARING:STERCOM', '[{"type":"weekOfMonth","week":3,"weekday":"THURSDAY"}]', '13:00', NULL),
  ('HEARING', 'ISP/DEN ENG', 'HEARING:ISP/DEN ENG', '[{"type":"weekOfMonth","week":3,"weekday":"WEDNESDAY"}]', '08:00', NULL),
  ('HEARING', 'COSCOM', 'HEARING:COSCOM', '[{"type":"weekOfMonth","week":1,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('HEARING', 'FT. COLLINS', 'HEARING:FT. COLLINS', '[{"type":"weekOfMonth","week":1,"weekday":"THURSDAY"}]', '10:00', NULL),
  ('HEARING', 'GREELEY', 'HEARING:GREELEY', '[{"type":"weekOfMonth","week":1,"weekday":"TUESDAY"}]', '10:00', NULL),
  ('HEARING', 'ICCS/PUEBLO', 'HEARING:ICCS/PUEBLO', '[{"type":"weekOfMonth","week":4,"weekday":"THURSDAY"}]', '08:00', NULL),
  ('FULL_BOARD', NULL, 'FULL_BOARD', '[{"type":"everyWeekday","weekday":"FRIDAY"}]', NULL, NULL),
  ('BUSINESS_MEETING', NULL, 'BUSINESS_MEETING', '[{"type":"weekOfMonth","week":3,"weekday":"FRIDAY"}]', NULL, NULL)
) AS v (kind_code, resource_code, slot_key, rules, start_time, end_time)
JOIN "public"."Calendar" AS calendar
  ON calendar."code" = 'PAROLE_BOARD_PUBLIC'
JOIN "public"."CalendarEntryKind" AS kind
  ON kind."calendarId" = calendar."id" AND kind."code" = v.kind_code
LEFT JOIN "public"."CalendarResource" AS resource
  ON resource."calendarId" = calendar."id" AND resource."code" = v.resource_code
ON CONFLICT DO NOTHING;

COMMIT;
