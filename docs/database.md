GRYPHON HUB DATABASE DOCUMENTATION
Project: Gryphon Railways Hub
Supabase project ID/ref: gvkonjdbwafntxspmxiu
Last updated from ChatGPT context: 2026-04-29

PURPOSE
=======
This database supports Gryphon Hub, an installable PWA for Gryphon Railways. The app is intended as an internal operations platform for the team, covering:

1. User accounts, roles, and sub-team membership
2. Team announcements and dashboard information
3. Fault reporting and fault tracking
4. Testing logbook and validation evidence
5. Safety/document hub with version-controlled PDFs and acknowledgements
6. Competition, testing, safety, and onboarding checklists
7. Push notification preferences and device subscriptions
8. Notification event logging for future OneSignal/Supabase Edge Function integration
9. Future telemetry sessions, points, and telemetry event logging

The database is designed for a Next.js/TypeScript/Tailwind PWA using Supabase Auth, Supabase Postgres, Supabase Storage, Supabase Realtime, and later OneSignal push notifications.


HIGH-LEVEL DESIGN PRINCIPLES
============================
- Supabase Auth owns authentication.
- public.profiles extends auth.users with application-specific data.
- Row Level Security is enabled on all application tables.
- Application roles are stored in public.profiles.role.
- Sub-team ownership is stored using the app_subteam enum.
- Files are stored in Supabase Storage buckets, while metadata lives in relational tables.
- Safety-critical documents are version-controlled through documents + document_versions.
- Push notifications are not sent directly by the database yet. The schema stores subscriptions/preferences/events for later OneSignal integration.
- Telemetry tables exist now as a future-proof foundation, but real telemetry ingestion still needs separate hardware/gateway/API design.


ENUM TYPES
==========
The following Postgres enum types exist in the public schema.

public.app_role
---------------
Values:
- admin
- exec
- team_lead
- member
- viewer

Meaning:
- admin: highest app/database management role.
- exec: executive board role; broad management access.
- team_lead: can manage records relevant to leadership workflows.
- member: normal active team member.
- viewer: read-only/light-access user.

public.app_subteam
------------------
Values:
- structures
- powertrain
- vehicle_systems
- manufacturing_testing
- systems_engineering
- business_ops

These map to the Gryphon Railways sub-team structure.

public.priority_level
---------------------
Values:
- low
- medium
- high
- critical

Used for announcements, faults, observations, etc.

public.fault_status
-------------------
Values:
- open
- investigating
- fixed
- verified_closed
- rejected

Used by public.faults.

public.test_result
------------------
Values:
- planned
- in_progress
- passed
- failed
- partial
- cancelled

Used by public.test_runs.

public.document_type
--------------------
Values:
- method_statement
- risk_assessment
- operating_procedure
- isolation_procedure
- jacking_lifting_procedure
- fire_procedure
- competition_checklist
- onboarding_document
- general

Used by public.documents.

public.approval_status
----------------------
Values:
- draft
- in_review
- approved
- archived
- rejected

Used by public.document_versions.

public.checklist_type
---------------------
Values:
- competition
- testing
- safety
- onboarding
- general

Used by public.checklists.

public.checklist_item_state
---------------------------
Values:
- not_started
- in_progress
- complete
- blocked
- not_applicable

Used by public.checklist_item_status.

public.notification_event_type
------------------------------
Values:
- fault_created
- fault_assigned
- fault_updated
- fault_fixed
- fault_closed
- test_scheduled
- test_cancelled
- document_updated
- checklist_critical_incomplete
- announcement_created

Used by notification preferences/events.

public.telemetry_event_type
---------------------------
Values:
- info
- warning
- fault
- safety
- run_marker

Used by public.telemetry_events.


UTILITY FUNCTIONS
=================
public.set_updated_at()
-----------------------
Trigger function used to automatically update updated_at timestamps.

public.handle_new_user()
------------------------
Auth trigger function. When a Supabase Auth user is created, it inserts a matching row into public.profiles.

public.is_active_member()
-------------------------
Returns true if auth.uid() belongs to an active profile.
Used heavily in RLS policies.

public.has_role(required_roles public.app_role[])
--------------------------------------------------
Returns true if the current active user has one of the required roles.
Used heavily in RLS policies.

public.is_admin_or_exec()
-------------------------
Returns true if the current active user has role admin or exec.

public.is_team_lead_for(team public.app_subteam)
------------------------------------------------
Returns true if the current active user is admin, exec, or a team_lead for the specified sub-team.

public.claim_initial_admin()
----------------------------
Temporary bootstrap function. Allows the first authenticated user to make themselves admin, but only if no admin or exec user exists yet.

IMPORTANT SECURITY NOTE:
This function should be removed or locked down after the first admin account is created. The Supabase security advisor currently flags this function because signed-in users can execute it. That is intentional only for first-user setup.

Suggested post-bootstrap SQL:
  revoke execute on function public.claim_initial_admin() from authenticated;
  drop function if exists public.claim_initial_admin();


CORE TABLES
===========

public.profiles
---------------
Purpose:
Application profile linked 1:1 with Supabase Auth users.

Important columns:
- id uuid primary key references auth.users(id)
- email text
- full_name text
- preferred_name text
- avatar_url text
- role app_role default 'member'
- subteam app_subteam
- is_active boolean default true
- phone text
- last_seen_at timestamptz
- created_at timestamptz
- updated_at timestamptz

Notes:
- All app permissions depend on this table.
- Profiles are automatically created by handle_new_user().
- Admin/exec users should manage roles and sub-teams.


public.announcements
--------------------
Purpose:
Dashboard/team announcements.

Important columns:
- id uuid primary key
- title text
- body text
- priority priority_level
- target_subteam app_subteam nullable
- pinned boolean
- expires_at timestamptz
- created_by uuid references profiles(id)
- created_at / updated_at

Use:
- Home dashboard announcements
- Targeted sub-team announcements
- Pinned important notices


FAULT REPORTING TABLES
======================

public.faults
-------------
Purpose:
Main fault/defect report table.

Important columns:
- id uuid primary key
- title text
- description text
- subsystem app_subteam
- severity priority_level
- status fault_status
- blocks_testing boolean
- safety_critical boolean
- reported_by uuid references profiles(id)
- assigned_to uuid references profiles(id)
- due_at timestamptz
- fixed_at timestamptz
- fixed_by uuid references profiles(id)
- verified_closed_at timestamptz
- verified_closed_by uuid references profiles(id)
- linked_test_run_id uuid references test_runs(id)
- created_at / updated_at

Constraint:
- If status = verified_closed, verified_closed_by must not be null.

Use:
- Members report faults.
- Team leads/admin/exec manage faults.
- Faults can be linked to tests.
- High/critical or blocks_testing faults should later trigger push notifications.

public.fault_comments
---------------------
Purpose:
Discussion/comments under a fault.

Important columns:
- id uuid primary key
- fault_id uuid references faults(id)
- author_id uuid references profiles(id)
- body text
- created_at / updated_at

public.fault_attachments
------------------------
Purpose:
Metadata for files uploaded against faults.

Important columns:
- id uuid primary key
- fault_id uuid references faults(id)
- uploaded_by uuid references profiles(id)
- storage_bucket text
- storage_path text
- file_name text
- mime_type text
- size_bytes bigint
- created_at

Storage bucket:
- fault-attachments

public.fault_status_history
---------------------------
Purpose:
Audit trail for fault status changes.

Important columns:
- id uuid primary key
- fault_id uuid references faults(id)
- old_status fault_status
- new_status fault_status
- changed_by uuid references profiles(id)
- note text
- created_at

Important note:
A trigger for automatically writing to this table was planned. If future development needs full audit automation, verify whether the trigger exists before relying on automatic history rows. The table itself exists.


TESTING LOGBOOK TABLES
======================

public.test_runs
----------------
Purpose:
Main testing/validation logbook table.

Important columns:
- id uuid primary key
- title text
- objective text
- location text
- scheduled_start timestamptz
- scheduled_end timestamptz
- actual_start timestamptz
- actual_end timestamptz
- runtime_minutes numeric
- vehicle_configuration text
- weather_conditions text
- track_conditions text
- result test_result
- notes text
- created_by uuid references profiles(id)
- lead_id uuid references profiles(id)
- created_at / updated_at

Use:
- Workshop tests
- Track tests
- Reliability running evidence
- Validation evidence
- Links to faults and attachments

public.test_run_members
-----------------------
Purpose:
People involved in a test run.

Important columns:
- id uuid primary key
- test_run_id uuid references test_runs(id)
- profile_id uuid references profiles(id)
- role_description text
- created_at

Unique:
- test_run_id + profile_id

public.test_observations
------------------------
Purpose:
Observations/notes recorded during or after tests.

Important columns:
- id uuid primary key
- test_run_id uuid references test_runs(id)
- author_id uuid references profiles(id)
- observation text
- severity priority_level
- observed_at timestamptz
- created_at

public.test_attachments
-----------------------
Purpose:
Metadata for files uploaded against test runs.

Important columns:
- id uuid primary key
- test_run_id uuid references test_runs(id)
- uploaded_by uuid references profiles(id)
- storage_bucket text
- storage_path text
- file_name text
- mime_type text
- size_bytes bigint
- created_at

Storage bucket:
- test-attachments

public.test_fault_links
-----------------------
Purpose:
Many-to-many relationship between test runs and faults.

Important columns:
- id uuid primary key
- test_run_id uuid references test_runs(id)
- fault_id uuid references faults(id)
- created_by uuid references profiles(id)
- created_at

Unique:
- test_run_id + fault_id


DOCUMENT / SAFETY HUB TABLES
============================

public.documents
----------------
Purpose:
Main index for safety docs, method statements, risk assessments, procedures, onboarding docs, and general internal PDFs.

Important columns:
- id uuid primary key
- title text
- description text
- document_type document_type
- owner_subteam app_subteam
- owner_id uuid references profiles(id)
- current_version_id uuid references document_versions(id)
- requires_acknowledgement boolean
- is_safety_critical boolean
- review_due_at date
- created_by uuid references profiles(id)
- created_at / updated_at

Use:
- One logical document record, multiple versions in document_versions.
- current_version_id points to the current approved/current file.

public.document_versions
------------------------
Purpose:
Version-controlled file records for documents.

Important columns:
- id uuid primary key
- document_id uuid references documents(id)
- version_label text, e.g. v1.0, v1.1
- status approval_status
- storage_bucket text
- storage_path text
- file_name text
- mime_type text default application/pdf
- size_bytes bigint
- notes text
- uploaded_by uuid references profiles(id)
- approved_by uuid references profiles(id)
- approved_at timestamptz
- created_at

Constraint:
- If status = approved, approved_by and approved_at must not be null.

Storage bucket:
- document-files

public.document_acknowledgements
--------------------------------
Purpose:
Records that a user has acknowledged/read a specific document version.

Important columns:
- id uuid primary key
- document_version_id uuid references document_versions(id)
- profile_id uuid references profiles(id)
- acknowledged_at timestamptz

Unique:
- document_version_id + profile_id

Use:
- Safety-critical procedures
- Method statements
- Onboarding documents


CHECKLIST TABLES
================

public.checklists
-----------------
Purpose:
Checklist templates for competition, testing, safety, onboarding, and general workflows.

Important columns:
- id uuid primary key
- title text
- description text
- checklist_type checklist_type
- owner_subteam app_subteam
- is_template boolean default true
- created_by uuid references profiles(id)
- created_at / updated_at

public.checklist_items
----------------------
Purpose:
Items within a checklist template.

Important columns:
- id uuid primary key
- checklist_id uuid references checklists(id)
- title text
- description text
- sort_order integer
- critical boolean
- assigned_subteam app_subteam
- assigned_to uuid references profiles(id)
- linked_document_id uuid references documents(id)
- created_at / updated_at

Use:
- Before-run checklist
- Packing checklist
- Scrutineering checklist
- Onboarding steps
- Safety workflow steps

public.checklist_runs
---------------------
Purpose:
An actual instance/run of a checklist.

Important columns:
- id uuid primary key
- checklist_id uuid references checklists(id)
- title text
- context text
- started_by uuid references profiles(id)
- started_at timestamptz
- completed_at timestamptz
- created_at / updated_at

public.checklist_item_status
----------------------------
Purpose:
State of each checklist item within a specific checklist run.

Important columns:
- id uuid primary key
- checklist_run_id uuid references checklist_runs(id)
- checklist_item_id uuid references checklist_items(id)
- state checklist_item_state
- note text
- completed_by uuid references profiles(id)
- completed_at timestamptz
- updated_by uuid references profiles(id)
- created_at / updated_at

Unique:
- checklist_run_id + checklist_item_id


NOTIFICATION TABLES
===================

public.notification_preferences
-------------------------------
Purpose:
Per-user preferences for notification event types.

Important columns:
- id uuid primary key
- profile_id uuid references profiles(id)
- event_type notification_event_type
- push_enabled boolean
- email_enabled boolean
- created_at / updated_at

Unique:
- profile_id + event_type

Use:
- Frontend preferences page
- Edge Function logic before sending notifications

public.push_subscriptions
-------------------------
Purpose:
Stores PWA push notification subscription/device records. Intended for OneSignal initially.

Important columns:
- id uuid primary key
- profile_id uuid references profiles(id)
- provider text default 'onesignal'
- external_user_id text
- subscription_id text
- device_label text
- platform text
- enabled boolean
- last_seen_at timestamptz
- created_at / updated_at

Unique:
- provider + subscription_id

Use:
- Store OneSignal IDs or future push provider subscription IDs.

public.notification_events
--------------------------
Purpose:
Audit log / future queue for notification events.

Important columns:
- id uuid primary key
- event_type notification_event_type
- actor_id uuid references profiles(id)
- target_profile_id uuid references profiles(id)
- target_subteam app_subteam
- entity_table text
- entity_id uuid
- payload jsonb
- delivered_at timestamptz
- created_at

Use:
- Edge Function can write/consume these.
- Useful for debugging notification delivery.

Important:
The database does not yet send notifications by itself. OneSignal and Supabase Edge Functions still need implementing.


TELEMETRY TABLES
================
These tables are future-facing. They exist so the app can later support live/mock telemetry without redesigning the database.

public.telemetry_sessions
-------------------------
Purpose:
One telemetry recording/display session.

Important columns:
- id uuid primary key
- vehicle_id text default 'gryphon_01'
- title text
- test_run_id uuid references test_runs(id)
- started_at timestamptz
- ended_at timestamptz
- source text
- notes text
- created_by uuid references profiles(id)
- created_at / updated_at

Use:
- A test run may have one or more telemetry sessions.
- Source could later be mock, base_station, upload, gateway, etc.

public.telemetry_points
-----------------------
Purpose:
Time-series telemetry datapoints.

Important columns:
- id bigserial primary key
- session_id uuid references telemetry_sessions(id)
- recorded_at timestamptz
- sequence_number bigint
- speed_kmh numeric
- battery_percent numeric
- recovered_energy_wh numeric
- traction_demand numeric
- brake_demand numeric
- brakes_applied boolean
- emergency_brake_active boolean
- auto_stop_active boolean
- latitude double precision
- longitude double precision
- motor_temp_c numeric
- controller_temp_c numeric
- payload jsonb

Use:
- Live dashboard
- Test logs
- Future graphs
- Raw payload preserves signals not yet modelled as columns

public.telemetry_events
-----------------------
Purpose:
Event markers inside telemetry sessions.

Important columns:
- id uuid primary key
- session_id uuid references telemetry_sessions(id)
- event_type telemetry_event_type
- title text
- description text
- recorded_at timestamptz
- payload jsonb
- created_at

Use:
- Fault events
- Safety events
- Run markers
- Test milestones


STORAGE BUCKETS
===============
Three private Supabase Storage buckets were created:

1. document-files
   - For PDFs and formal documents.

2. fault-attachments
   - For photos, videos, PDFs, or evidence files attached to faults.

3. test-attachments
   - For test evidence, data files, CSV/JSON exports, images, videos, PDFs.

Storage access is controlled through RLS policies on storage.objects.
Authenticated active members can select and insert files in these buckets.
Admin/exec users can update/delete app files.

Note:
The app should store file metadata in the matching public table after upload:
- document_versions for document-files
- fault_attachments for fault-attachments
- test_attachments for test-attachments


ROW LEVEL SECURITY SUMMARY
==========================
RLS is enabled on all public application tables:
- profiles
- announcements
- faults
- fault_comments
- fault_attachments
- fault_status_history
- test_runs
- test_run_members
- test_observations
- test_attachments
- test_fault_links
- documents
- document_versions
- document_acknowledgements
- checklists
- checklist_items
- checklist_runs
- checklist_item_status
- notification_preferences
- push_subscriptions
- notification_events
- telemetry_sessions
- telemetry_points
- telemetry_events

General access model:
- Active members can read most internal content.
- Members can create faults, comments, observations, acknowledgements, own push subscriptions, and checklist runs/status updates.
- Team leads/admin/exec can manage leadership workflows such as announcements, test runs, checklists, documents, and telemetry sessions.
- Admin/exec can delete sensitive objects and manage higher-risk records.
- Notification preferences and push subscriptions are user-owned, with admin/exec visibility.
- Storage objects are private but accessible to active authenticated members according to policies.

Important caveat:
During development, RLS is intentionally practical rather than ultra-restrictive. Before rolling out to the full team, test these workflows with real accounts for member, team_lead, exec, and admin.


KNOWN CURRENT CAVEATS / TODOs
=============================
1. Bootstrap admin function
---------------------------
claim_initial_admin() exists to allow the first authenticated user to become admin. Remove it after first admin setup.

2. Fault status audit trigger
-----------------------------
fault_status_history table exists. A trigger was intended for automatic status audit history. Verify whether the trigger exists before relying on it. If missing, add a trigger during a future migration.

3. Push notifications are not implemented yet
---------------------------------------------
Tables exist for push subscriptions, preferences, and events. Actual notification sending requires:
- OneSignal project setup
- OneSignal app ID/API key
- Supabase Edge Function
- Backend event routing rules

4. PDF viewing is app-level
--------------------------
The database/storage supports PDF storage and metadata. The frontend still needs:
- Upload flow
- PDF viewer or signed URL opening
- Version approval workflow
- Current-version display
- Acknowledgement UI

5. Telemetry ingestion is not implemented yet
---------------------------------------------
Telemetry tables are ready, but the hardware/gateway/API path still needs designing. Recommended architecture:
Locomotive controller -> gateway/base station -> telemetry API/MQTT/WebSocket bridge -> Supabase/Realtime or dedicated telemetry service -> PWA dashboard.

6. Seed data is not yet installed
---------------------------------
Future migrations should add starter/checklist templates, such as:
- Before-run checklist
- After-run checklist
- Competition packing checklist
- Scrutineering checklist
- Onboarding checklist
- Safety document acknowledgement checklist

7. TypeScript types should be generated
---------------------------------------
After schema stabilisation, generate Supabase TypeScript types and commit them to the frontend repo.


RECOMMENDED FRONTEND ARCHITECTURE
=================================
Expected stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui if wanted
- React Hook Form + Zod for forms
- Supabase client for auth/database/storage
- OneSignal Web SDK for PWA push notifications
- Vercel hosting

Suggested modules/pages:
- Auth/login
- Dashboard
- Faults
- Fault detail
- New fault report
- Testing logbook
- Test run detail
- Documents / safety hub
- PDF viewer page
- Checklists / competition mode
- Onboarding
- Admin user management
- Notification settings
- Telemetry mock/live dashboard later


RECOMMENDED NEXT DATABASE MIGRATIONS
====================================
After the first admin is created:

1. Remove/lock bootstrap function:
   drop function if exists public.claim_initial_admin();

2. Add seed checklists:
   - before_run
   - after_run
   - static_scrutineering
   - tools_and_spares
   - onboarding

3. Add stricter document visibility if needed:
   For example, normal members only see approved/current safety docs, while team leads/admin see drafts.

4. Add Edge Functions for notifications:
   - notify_fault_created
   - notify_fault_assigned
   - notify_document_updated

5. Add generated TypeScript types to app repo.


IMPORTANT CODING NOTES FOR CODEX / FUTURE CHATS
================================================
- Do not bypass RLS in frontend code.
- Never expose Supabase service role key in the browser.
- Use the normal Supabase anon/publishable key on the client.
- Use service role only inside secure server-side routes or Edge Functions.
- For file uploads, upload to Storage first, then create the relevant metadata row.
- For safety docs, do not overwrite old files. Always create a new document_versions row.
- For telemetry, do not assume Bluetooth is the primary architecture. Treat the app as receiving telemetry from a backend/gateway service.
- For push notifications, do not send notifications directly from the frontend. The frontend should create/update app records, then backend logic should decide who gets notified.
- For role checks in UI, use profiles.role and profiles.subteam, but remember the database RLS is the real authority.
- Keep all future schema changes as migrations, not random dashboard edits.


END OF DOCUMENT
===============
