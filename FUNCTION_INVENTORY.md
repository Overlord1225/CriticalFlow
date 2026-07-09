# CriticalFlow System — Function Inventory

> **Version:** 1.0  
> **Last Updated:** 2026-07-09  
> **Maintainer:** Development Team  
> **Changelog:**
> - **v1.0 (2026-07-09):** Initial inventory — cataloged all 95+ functions across 14 JS modules for 4 roles (Student, CI, Scheduler, Admin), 11 pages.

---

## Table of Contents

1. [How to Read This Document](#how-to-read-this-document)
2. [js/data.js — Data Layer / Supabase Operations](#1-jsdatajs--data-layer--supabase-operations)
3. [js/auth.js — Authentication & Authorization](#2-jsauthjs--authentication--authorization)
4. [js/main.js — Application Entry Point](#3-jsmainjs--application-entry-point)
5. [js/utils.js — Shared Utilities](#4-jsutilsjs--shared-utilities)
6. [js/modules/admin.js — Admin Dashboard](#5-jsmodulesadminjs--admin-dashboard)
7. [js/modules/attendance.js — Student Attendance](#6-jsmodulesattendancejs--student-attendance)
8. [js/modules/ci.js — Clinical Instructor Dashboard](#7-jsmodulescijs--clinical-instructor-dashboard)
9. [js/modules/incident.js — Incident Report](#8-jsmodulesincidentjs--incident-report)
10. [js/modules/notification.js — Notifications System](#9-jsmodulesnotificationjs--notifications-system)
11. [js/modules/scheduler.js — Scheduler Dashboard & Tools](#10-jsmodulesschedulerjs--scheduler-dashboard--tools)
12. [js/modules/student.js — Student Dashboard](#11-jsmodulesstudentjs--student-dashboard)
13. [js/modules/sidebar.js — Navigation Sidebar](#12-jsmodulessidebarjs--navigation-sidebar)
14. [js/modules/faceRecognitionUI.js — Face Recognition UI](#13-jsmodulesfacerecognitionuijs--face-recognition-ui)
15. [js/faceRecognition.js — Face Recognition Engine](#14-jsfacerecognitionjs--face-recognition-engine)
16. [js/supabaseClient.js — Supabase Client](#15-jssupabaseclientjs--supabase-client)

---

## How to Read This Document

- ✅ **Implemented** — The function is fully coded and operational.
- 🟡 **Partially Implemented** — The function exists but may have stubs, limited scope, or pending enhancements.
- ❌ **Not Implemented** — The function is planned or referenced but not yet coded.
- **Global** — Attached to `window` for access from inline HTML event handlers.

---

## 1. `js/data.js` — Data Layer / Supabase Operations

### Authentication

| Function | Status | Description |
|---|---|---|
| `signIn(email, password)` | ✅ Implemented | Authenticates via Supabase Auth, fetches user profile from `users` table, stores in `currentUser` + `sessionStorage` |
| `ensureAdminAccount()` | ✅ Implemented | Ensures default admin (`admin@sipag.com` / `password123`) exists — handles orphan rows, re-creation |
| `getCurrentUser()` | ✅ Implemented | Returns `currentUser` from memory or `sessionStorage` |
| `logout()` | ✅ Implemented | Signs out of Supabase Auth, clears session, redirects to `index.html` |

### Student & Progress

| Function | Status | Description |
|---|---|---|
| `getStudent(id)` | ✅ Implemented | Fetches student profile (name, program, year) with fallback |
| `getProgress(studentId)` | ✅ Implemented | Retrieves case library + verified progress; returns cases with completion counts & status |
| `getSchedules(studentId)` | ✅ Implemented | Returns schedules for a student (with hospital/department joins) |
| `getStudents()` | ✅ Implemented | Returns all users with role `student` |
| `getStudentsByIds(ids)` | ✅ Implemented | Returns students by array of IDs |
| `getStudentsBySection(section)` | ✅ Implemented | Returns students in a given section |
| `getSections()` | ✅ Implemented | Returns unique section names from student records |

### Schedule Management

| Function | Status | Description |
|---|---|---|
| `getAllSchedules()` | ✅ Implemented | Returns all schedules with student & CI names |
| `getUpcomingSchedule(studentId)` | ✅ Implemented | Returns next scheduled duty for a student (today or later) |
| `createSchedule(scheduleData)` | ✅ Implemented | Creates a new schedule record |
| `updateSchedule(scheduleId, updates)` | ✅ Implemented | Updates an existing schedule |
| `deleteSchedule(scheduleId)` | ✅ Implemented | Deletes a schedule by ID |

### Opportunity Board / Open Slots

| Function | Status | Description |
|---|---|---|
| `getAvailableSlots()` | ✅ Implemented | Returns all open slots (with hospital, department, CI names) |
| `getOpenSlots()` | ✅ Implemented | Alias for `getAvailableSlots()` |
| `claimSlot(slotId, studentId)` | ✅ Implemented | Claims a slot: creates schedule + slot_application, deletes open_slot, sends notification |

### Attendance

| Function | Status | Description |
|---|---|---|
| `getAttendanceHistory(studentId)` | ✅ Implemented | Returns attendance records with schedule/hospital data |
| `getAttendanceForSchedule(scheduleId, studentId)` | ✅ Implemented | Returns single attendance record for a schedule+student |
| `getAttendanceForStudent(studentId)` | ✅ Implemented | Returns all attendance records for a student |
| `recordAttendance(scheduleId, studentId, timeIn, timeOut, gpsData, faceVerified, livenessPassed, method, status)` | ✅ Implemented | Creates an attendance record |
| `updateAttendance(scheduleId, studentId, updates)` | ✅ Implemented | Updates an existing attendance record |
| `markAttendanceManually(scheduleId, studentId, status, reason)` | ✅ Implemented | CI override: marks attendance manually, triggers absence workflow if "absent" |
| `markAbsent(scheduleId, studentId)` | ✅ Implemented | Marks student absent, creates make-up open slot, sends notification |
| `verifyGPS(studentId, scheduleId)` | ✅ Implemented | Verifies student is within geo-fence radius of assigned hospital using Haversine |
| `getCurrentPosition(options)` | ✅ Implemented | Wrapper for Geolocation API (Promise-based) |
| `getGeolocationPermissionState()` | 🟡 Partially Implemented | Checks geolocation permission status (may not work across all browsers) |
| `distance(lat1, lng1, lat2, lng2)` | ✅ Implemented | Haversine distance calculation (returns meters) |
| `getHospitalCoordinates(hospitalId)` | ✅ Implemented | Gets lat/lng/radius for a hospital |

### Incident Reports

| Function | Status | Description |
|---|---|---|
| `createIncidentReport(report)` | ✅ Implemented | Creates an incident report record |
| `getIncidentReportsForUser(userId)` | ✅ Implemented | Returns reports for a specific user |
| `getAllIncidentReports()` | ✅ Implemented | Returns all reports with reporter info (join on users) |
| `updateIncidentReportStatus(id, status)` | ✅ Implemented | Updates incident report status |

### Notifications & Announcements

| Function | Status | Description |
|---|---|---|
| `getNotifications(userId)` | ✅ Implemented | Returns notifications for a user (newest first) |
| `markRead(notifId)` | ✅ Implemented | Marks a notification as read |
| `sendAnnouncement(message, senderId, targetRole)` | ✅ Implemented | Creates announcement + notifications for all users of target role |

### CI Functions

| Function | Status | Description |
|---|---|---|
| `getAssignedStudents(ciId)` | ✅ Implemented | Returns deduplicated students assigned to a CI via schedules |
| `getCIAssignedHospital(ciId)` | ✅ Implemented | Returns next upcoming hospital for a CI |
| `getCIs()` | ✅ Implemented | Returns all users with role `ci` |

### Admin CRUD — Hospitals

| Function | Status | Description |
|---|---|---|
| `getHospitals()` | ✅ Implemented | Returns all hospitals |
| `createHospital(hospital)` | ✅ Implemented | Creates a hospital |
| `updateHospital(id, updates)` | ✅ Implemented | Updates a hospital |
| `deleteHospital(id)` | ✅ Implemented | Deletes a hospital |

### Admin CRUD — Departments

| Function | Status | Description |
|---|---|---|
| `getDepartments()` | ✅ Implemented | Returns all departments with hospital name |
| `createDepartment(dept)` | ✅ Implemented | Creates a department |
| `updateDepartment(id, updates)` | ✅ Implemented | Updates a department |
| `deleteDepartment(id)` | ✅ Implemented | Deletes a department |
| `getDepartmentsByHospital(hospitalId)` | ✅ Implemented | Returns departments for a specific hospital |

### Admin CRUD — Case Library

| Function | Status | Description |
|---|---|---|
| `getCaseLibrary()` | ✅ Implemented | Returns all cases from case library |
| `createCase(caseItem)` | ✅ Implemented | Creates a case |
| `updateCase(id, updates)` | ✅ Implemented | Updates a case |
| `deleteCase(id)` | ✅ Implemented | Deletes a case (blocks if progress records exist) |

### Admin CRUD — Users

| Function | Status | Description |
|---|---|---|
| `getAllUsers()` | ✅ Implemented | Returns all users |
| `createUserByAdmin(email, password, role, name, program)` | ✅ Implemented | Creates user via Supabase Auth + stores profile |
| `deleteUser(id)` | ✅ Implemented | Deletes a user |
| `updateUser(id, updates)` | ✅ Implemented | Updates a user |

### Analytics & Recommendation Engine

| Function | Status | Description |
|---|---|---|
| `getStudentProgressSummary()` | ✅ Implemented | Aggregated student progress with absence counts |
| `getHospitalUtilization()` | ✅ Implemented | Returns utilization data per hospital (used by heatmap) |
| `getRecommendationWeights()` | ✅ Implemented | Returns configurable recommendation weights from DB |
| `updateRecommendationWeight(criterion, weight)` | ✅ Implemented | Updates a recommendation weight |
| `computeRecommendationScore(studentId, slotId)` | ✅ Implemented | Computes AI match score for a student vs a slot (multi-factor) |
| `getRecommendationsForSlot(slotId)` | ✅ Implemented | Returns top 10 ranked students for a slot |

---

## 2. `js/auth.js` — Authentication & Authorization

| Function | Status | Description |
|---|---|---|
| `getCurrentUser()` | ✅ Implemented | Delegates to `data.getCurrentUser()` |
| `getDefaultDashboard(role)` | ✅ Implemented | Maps role → default page URL (student → student-dashboard, etc.) |
| `redirectToRoleDashboard(role)` | ✅ Implemented | Redirects user to their role-appropriate dashboard |
| `requireAuth()` | ✅ Implemented | Redirects to `index.html` if not logged in |
| `logout()` | ✅ Implemented | Calls `data.logout()` |
| `requireRole(allowedRoles)` | ✅ Implemented | Checks if user has one of the allowed roles; redirects on failure |

---

## 3. `js/main.js` — Application Entry Point

| Function | Status | Description |
|---|---|---|
| `window.logoutUser()` | ✅ Implemented (Global) | Global logout function (called from sidebar onclick) |
| `handleLogin()` | ✅ Implemented | Handles login form submission (email/password validation + sign-in) |
| `DOMContentLoaded` handler | ✅ Implemented | Routes page URL → module initializer; enforces role-based page access |

---

## 4. `js/utils.js` — Shared Utilities

| Function | Status | Description |
|---|---|---|
| `showToast(message, type, duration)` | ✅ Implemented | Shows a toast notification (success ✅ / error ❌ / warning ⚠️ / info ℹ️) |
| `showLoading(containerId, message)` | ✅ Implemented | Shows a loading spinner in a container |
| `hideLoading(containerId)` | ✅ Implemented | Removes loading spinner from a container |
| `formatDate(dateStr)` | ✅ Implemented | Formats date string for PH locale |
| `formatTime(dateStr)` | ✅ Implemented | Formats time string for PH locale |

---

## 5. `js/modules/admin.js` — Admin Dashboard

| Function | Status | Description |
|---|---|---|
| `initAdminAnalytics()` | ✅ Implemented | Loads admin dashboard stats & tables (students, slots, schedules, lacking/nearing/excessive absences) |
| `initAdminManagement()` | ✅ Implemented | Initializes admin CRUD tabs (hospitals, departments, cases, users) |
| `setupAdminForms()` | ✅ Implemented | Binds event listeners for all admin CRUD forms + inline edit/delete delegation |
| `resetHospitalForm()` | ✅ Implemented | Resets hospital form to add mode |
| `resetDeptForm()` | ✅ Implemented | Resets department form to add mode |
| `resetCaseForm()` | ✅ Implemented | Resets case form to add mode |
| `resetUserForm()` | ✅ Implemented | Resets user form to add mode |
| `loadHospitals()` | ✅ Implemented | Loads hospital table |
| `loadHospitalSelects()` | ✅ Implemented | Loads hospital dropdown for department form |
| `loadDepartments()` | ✅ Implemented | Loads department table |
| `loadCases()` | ✅ Implemented | Loads case library table |
| `loadUsers()` | ✅ Implemented | Loads users table |
| `editHospital(id)` | ✅ Implemented | Populates hospital form for editing |
| `editDept(id)` | ✅ Implemented | Populates department form for editing |
| `editCase(id)` | ✅ Implemented | Populates case form for editing |
| `editUser(id)` | ✅ Implemented | Populates user form for editing |
| `deleteHospitalRecord(id)` | ✅ Implemented | Deletes hospital with confirmation |
| `deleteDeptRecord(id)` | ✅ Implemented | Deletes department with confirmation |
| `deleteCaseRecord(id)` | ✅ Implemented | Deletes case with confirmation |
| `deleteUserRecord(id)` | ✅ Implemented | Deletes user with confirmation |

---

## 6. `js/modules/attendance.js` — Student Attendance

| Function | Status | Description |
|---|---|---|
| `initAttendance()` | ✅ Implemented | Loads upcoming duty, face scanner, attendance UI & history table |
| `renderGpsMap(schedule, userId)` | ✅ Implemented | Renders OpenStreetMap embed with current location vs hospital marker |
| `requestLocationAccess(schedule, userId)` | ✅ Implemented | Requests GPS location & renders map |
| `requestLocationPermission(schedule, userId)` | ✅ Implemented | Checks/requests geolocation permission gracefully |
| `renderAttendanceHistory(userId)` | ✅ Implemented | Renders attendance history table |
| `performTimeIn()` | ✅ Implemented | Handles Time In: GPS verification, records attendance with `on_time`/`late` status |
| `performTimeOut()` | ✅ Implemented | Handles Time Out: GPS verification, updates attendance record |
| `window.performTimeIn` | ✅ Implemented (Global) | Exposed for inline onclick |
| `window.performTimeOut` | ✅ Implemented (Global) | Exposed for inline onclick |
| `window.refreshBtn` click handler | ✅ Implemented | Refresh GPS button — re-acquires location and re-renders map |

---

## 7. `js/modules/ci.js` — Clinical Instructor Dashboard

| Function | Status | Description |
|---|---|---|
| `loadCIIncidents()` | ✅ Implemented | Loads 5 most recent incident reports for CI view |
| `initCIDashboard()` | ✅ Implemented | Loads CI dashboard: assigned students, hospital, incidents, absence marking + announcement |
| `initAbsenceMarking()` | ✅ Implemented | Loads upcoming duties table with Present/Late/Absent buttons for CI to mark attendance |

---

## 8. `js/modules/incident.js` — Incident Report

| Function | Status | Description |
|---|---|---|
| `initIncidentReport()` | ✅ Implemented | Initializes form + report list; handles submission, creates notifications + opens email draft for schedulers/admins |
| `loadUserReports()` (inner) | ✅ Implemented | Loads current user's submitted reports |

---

## 9. `js/modules/notification.js` — Notifications System

| Function | Status | Description |
|---|---|---|
| `subscribeToNotifications(userId)` | ✅ Implemented | Sets up real-time Supabase `postgres_changes` subscription for new notifications |
| `markNotifRead(notifId)` | ✅ Implemented | Marks notification as read, decrements badge |
| `initNotifications()` | ✅ Implemented | Loads all notifications, sets up badge & subscription |
| `window.markNotifRead` | ✅ Implemented (Global) | Exposed for inline onclick |
| `updateNotifBadge(count)` (re-export) | ✅ Implemented | Delegates to sidebar badge update |

> **Note:** `notifications.js` simply re-exports everything from `notification.js`.

---

## 10. `js/modules/scheduler.js` — Scheduler Dashboard & Tools

| Function | Status | Description |
|---|---|---|
| `initSchedulerDashboard()` | ✅ Implemented | Loads scheduler dashboard: stats, all schedules table, section filter, verified case summary |
| `renderVerifiedCaseSummary()` | ✅ Implemented | Renders table of verified case progress |
| `setupSectionFilter()` | ✅ Implemented | Adds section filter dropdown to scheduler dashboard dynamically |
| `initHeatmap()` | ✅ Implemented | Generates hospital utilization heatmap (color-coded by completion %) |
| `initCaseVerification()` | ✅ Implemented | Loads & manages pending case verifications (verify/reject with reason) |
| `initSendAnnouncement()` | ✅ Implemented | Initializes announcement form to broadcast to students |
| `initAIMatchmaker()` | ✅ Implemented | Loads AI matchmaker: slot tabs, recommendation scores, assign buttons |
| `generateExplanation(details)` | ✅ Implemented | Generates human-readable explanation of matchmaker score factors |
| `initScheduleManagement()` | ✅ Implemented | Initializes schedule CRUD page |
| `loadDropdowns()` | ✅ Implemented | Loads student/CI/hospital dropdowns for schedule form |
| `loadScheduleList()` | ✅ Implemented | Loads schedules table |
| `buildSchedulePayload()` | ✅ Implemented | Builds schedule data object from form fields |
| `validateSchedulePayload(p)` | ✅ Implemented | Validates schedule form data |
| `createNewSchedule()` | ✅ Implemented | Creates a new schedule |
| `loadScheduleIntoForm(id)` | ✅ Implemented | Loads existing schedule into form for editing |
| `resetEditMode()` | ✅ Implemented | Resets schedule form to create mode |
| `toggleEditForm(id, show)` | ✅ Implemented | Toggles inline edit form visibility |
| `saveEdit(id)` | ✅ Implemented | Saves edited schedule |

---

## 11. `js/modules/student.js` — Student Dashboard

| Function | Status | Description |
|---|---|---|
| `initStudentDashboard()` | ✅ Implemented | Loads student dashboard: profile, case progress, upcoming duties, calendar, themes, attendance history, notifications |
| `initCasePassport()` | ✅ Implemented | Loads case passport: list of required cases with completion status + submit button |
| `showCaseSubmissionModal(studentId, caseLibraryId)` | ✅ Implemented | Shows prompt for date + notes, then submits |
| `submitCase(studentId, caseLibraryId, date, notes)` | ✅ Implemented | Inserts `case_progress` record with `status: 'pending'` |
| `initOpportunityBoard()` | ✅ Implemented | Loads available slots with claim buttons |
| `renderDashboardCalendar(schedules)` | ✅ Implemented | Renders monthly calendar with duty markers |
| `renderCurrentThemes(progress, notifs, nextSchedule)` | ✅ Implemented | Renders theme cards on student dashboard |

---

## 12. `js/modules/sidebar.js` — Navigation Sidebar

| Function | Status | Description |
|---|---|---|
| `renderSidebar(activePage)` | ✅ Implemented | Renders role-based sidebar navigation with active page highlighting and notification badge |
| `updateNotifBadge(count)` | ✅ Implemented | Updates notification badge count on sidebar |

---

## 13. `js/modules/faceRecognitionUI.js` — Face Recognition UI

| Function | Status | Description |
|---|---|---|
| `initFaceScanner()` | ✅ Implemented | Initializes face recognition scanner with webcam + mode badge (CI/Student) |
| `initFaceAttendance()` | ✅ Implemented | Alias for `initFaceScanner()` |
| `initStudentFaceMode(user, container)` | ✅ Implemented | Renders face registration/verification UI for students with register/verify/re-register buttons |

---

## 14. `js/faceRecognition.js` — Face Recognition Engine

| Function | Status | Description |
|---|---|---|
| `loadFaceApiModels()` | ✅ Implemented | Loads face-api.js models (tiny face detector, landmark 68, face recognition) from local `/js/face-api-models/` |
| `initFaceApi()` | ✅ Implemented | Verifies `faceapi` library is loaded, then loads models |
| `captureFaceDescriptor(videoElement)` | ✅ Implemented | Captures face descriptor from webcam video |
| `registerFace(userId, userName, videoElement)` | ✅ Implemented | Registers face descriptor to `localStorage` (`clinicalflow_faces`) |
| `getRegisteredFaces()` | ✅ Implemented | Retrieves all registered faces from `localStorage` |
| `recognizeFace(videoElement, threshold)` | ✅ Implemented | Matches a face against registered faces; returns sorted matches with confidence |
| `detectAllFaces(videoElement, threshold)` | 🟡 Partially Implemented | Detects & recognizes multiple faces (CI bulk scan) — UI integration pending |
| `hasRegisteredFace(userId)` | ✅ Implemented | Checks if user has registered face |
| `deleteRegisteredFace(userId)` | ✅ Implemented | Deletes a registered face |
| `startWebcam(videoElement)` | ✅ Implemented | Starts webcam stream (640×480, user-facing) |
| `stopWebcam(videoElement)` | ✅ Implemented | Stops all webcam tracks |
| `drawFaceBox(canvas, detection, label, color)` | ✅ Implemented | Draws bounding box + label on canvas |
| `clearCanvas(canvas)` | ✅ Implemented | Clears canvas |

---

## 15. `js/supabaseClient.js` — Supabase Client

| Function | Status | Description |
|---|---|---|
| *(None — initialization only)* | ✅ Implemented | Creates and exports a pre-configured Supabase client instance with URL + anon key |

---

## Summary Statistics

| Metric | Count |
|---|---|
| **Total Functions** | **95+** |
| ✅ Fully Implemented | ~90 |
| 🟡 Partially Implemented | 2 (detectAllFaces UI integration, geolocationPermissionState browser variance) |
| ❌ Not Implemented | 0 |
| Modules | 14 |
| Roles Served | 4 (Student, CI, Scheduler, Admin) |
| Pages | 11 |
| Database Tables/Views | ~30 |

---

## Changelog

| Date | Version | Author | Changes |
|---|---|---|---|
| 2026-07-09 | v1.0 | System | Initial inventory — cataloged all functions across 14 JS modules for 4 roles, 11 pages |

*This document should be updated whenever a function is added, removed, or significantly modified. Update the version number and add a new row to the changelog table.*