# UI_UX.md

```yaml
document:
  id: DOC-013
  title: UI_UX
  version: 1.0
  status: Frozen

purpose: Define the complete user interface and user experience of SSRL ERP Version 1.

depends_on:
  - FEATURE_SPECIFICATIONS.md
  - MODULES.md
  - API.md

used_by:
  - Frontend
  - QA
  - Antigravity IDE

last_updated: 2026-08-05
```

---

# 1. Design Philosophy

The SSRL ERP interface shall prioritize:

- Speed
- Productivity
- Keyboard-first operation
- Data density
- Readability
- Consistency

Visual appearance shall never reduce operational efficiency.

---

# 2. Design Principles

## UX-001

Every screen shall be usable without a mouse whenever practical.

---

## UX-002

Frequently used actions shall require the minimum possible clicks.

---

## UX-003

Business information shall take priority over decorative elements.

---

## UX-004

Animations shall be subtle and shall never delay interaction.

---

## UX-005

The UI shall remain consistent across all modules.

---

## UX-006

All tables shall support:

- Search
- Sorting
- Filtering
- Pagination
- Keyboard Navigation

---

## UX-007

Forms shall clearly distinguish:

- Required Fields
- Optional Fields
- Read-only Fields

---

# 3. Navigation

## Layout

Desktop application layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Bar                                                    │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│ Left Sidebar │ Main Content                                │
│              │                                              │
│              │                                              │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│ Status Bar                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Left Sidebar

Contains:

- Dashboard
- Trips
- Parties
- Vehicle Directory
- Own Fleet
- Billing
- Submissions
- Payments
- Reports
- Users
- Settings
- Activity Logs

Sidebar shall support:

- Collapse
- Expand
- Active Module Highlight
- Keyboard Navigation

---

## Top Bar

Displays:

- Current Financial Year
- Logged-in User
- Global Search
- Theme Toggle
- Notifications
- User Menu

---

## Status Bar

Displays:

- Application Version
- Database Status
- Current User Role

---

# 4. Dashboard Screen

## Purpose

Provide an operational summary immediately after login.

---

## Layout

The dashboard shall display:

### KPI Cards

- Today's Trips
- Pending PODs
- Bills Pending Submission
- Outstanding Payments
- Monthly Revenue
- Monthly Expense
- Monthly Profit

---

### Alert Panel

Displays:

- Vehicle Document Expiry
- Pending POD
- Other operational alerts

---

### Recent Activity

Displays the latest Activity Log entries.

---

### Quick Actions

Buttons for:

- New Trip
- Generate Bill
- Record Payment
- Create Submission

---

# 5. Trips Screen

## Purpose

Manage transportation trips.

---

## Main Layout

Upper Section:

Search & Filters

↓

Trip Table

↓

Details Panel

---

## Filters

- Financial Year
- Party
- Vehicle
- Status
- Customer Type
- Vehicle Type
- Date Range

---

## Table Columns

- Trip Number
- Loading Date
- Party
- From City
- To City
- Vehicle Number
- Status
- Freight
- Bill Status

---

## Row Actions

- View
- Edit
- Upload POD
- View Documents
- View Expenses
- Delete

---

## Details Panel

Displays:

- Timeline
- Financial Information
- POD Status
- Trip Documents
- Expenses
- Activity History

---

# 6. Forms

Every form shall follow the same layout.

```
Header

↓

Basic Information

↓

Business Information

↓

Additional Information

↓

Action Buttons
```

---

## Buttons

Primary

- Save

Secondary

- Save & New
- Cancel

Danger

- Delete

---

## Validation

Validation shall occur:

- During input where appropriate.
- Before submission.
- After API response.

Validation messages shall appear beside the relevant field.

---

# 7. Keyboard Shortcuts

| Shortcut    | Action         |
| ----------- | -------------- |
| Ctrl + N    | New Record     |
| Ctrl + S    | Save           |
| Ctrl + F    | Search         |
| Esc         | Cancel         |
| Tab         | Next Field     |
| Shift + Tab | Previous Field |

Additional module-specific shortcuts may be defined where beneficial.

---

# End of Part 1

Part 2 continues with:

- Billing Screen
- Submission Screen
- Payments Screen
- Reports Screen
- Users Screen
- Settings Screen
- Activity Logs
- Dark Mode
- Responsive Behaviour
- Empty States
- Loading States
- Error States

---

# 8. Billing Screen

## Purpose

Generate, preview, print and manage customer bills.

Supports:

- Individual Billing
- Consolidated Billing

---

## Layout

```
Header

↓

Search & Filters

↓

Bills Table

↓

Bill Preview Panel
```

---

## Filters

- Financial Year
- Party
- Bill Number
- Bill Type
- Bill Status
- Bill Date Range

---

## Bills Table Columns

- Bill Number
- Bill Date
- Party
- Bill Type
- Total Amount
- Status
- Submission Status

---

## Row Actions

- View
- Print
- Export PDF
- Cancel Bill

---

## Generate Bill Dialog

### Required Fields

- Company
- Bill Type

---

### Trip Selection

The ERP shall display only eligible trips.

Trips already billed shall not appear.

For Consolidated Billing:

- Only trips belonging to the selected company shall be listed.

---

### Options

Checkbox

```
Apply Digital Signature
```

---

### Buttons

- Generate Bill
- Cancel

---

## Bill Preview

Displays the exact approved company format.

The ERP shall never redesign the layout.

Preview shall exactly match printed output.

---

# 9. Submission Screen

## Purpose

Manage submission of generated bills.

---

## Layout

```
Header

↓

Search & Filters

↓

Submission Table

↓

Submission Details
```

---

## Filters

- Financial Year
- Company
- Submission Number
- Date Range

---

## Table Columns

- Submission Number
- Submission Date
- Company
- Total Bills
- Total Amount

---

## Row Actions

- View
- Print Submission
- Reissue Submission

---

## Create Submission Dialog

Displays:

- Company
- Eligible Bills

The user selects one or more bills.

The ERP generates:

- Submission Number
- Submission Record

---

# 10. Payments Screen

## Purpose

Record customer payments.

---

## Layout

```
Header

↓

Search & Filters

↓

Payment Table

↓

Payment Details
```

---

## Filters

- Company
- Payment Date
- Payment Number
- Payment Type

---

## Table Columns

- Payment Number
- Company
- Payment Date
- Amount
- Reference Number

---

## Row Actions

- View

Payments shall not support editing or deletion.

---

## Record Payment Dialog

### Required Fields

- Company
- Amount
- Payment Date
- Reference Number

Optional

- Remarks

---

The ERP shall automatically determine:

- Standard Payment

or

- Bulk Payment

based on the Company configuration.

Users shall not manually choose the payment type.

---

# 11. Reports Screen

## Purpose

Generate business reports.

---

## Layout

```
Report Categories

↓

Report Filters

↓

Report Preview

↓

Export Buttons
```

---

## Categories

Trips

Billing

Payments

Financial

Operational

Analytics

---

## Export Buttons

- Excel
- PDF

---

Reports shall open without modifying business data.

---

# 12. Users Screen

## Purpose

Manage ERP users.

---

## Table Columns

- Name
- Username
- Role
- Status

---

## Row Actions

- Edit
- Reset Password
- Activate
- Deactivate

---

Only Super Admin may modify users.

---

# 13. Settings Screen

## Categories

- Company
- Numbering
- Documents
- Appearance
- System

---

Only Super Admin may edit settings.

---

ImageKit credentials shall never appear in this screen.

---

# 14. Activity Logs

## Purpose

Display ERP audit history.

---

## Filters

- User
- Module
- Date
- Entity
- Action

---

## Table Columns

- Date
- User
- Module
- Action
- Entity
- Description

---

Activity Logs are read-only.

---

# 15. Empty States

Every screen shall display meaningful empty-state messages.

Example:

Trips

```
No trips found.
Create your first trip to begin.
```

Bills

```
No bills generated yet.
```

Reports

```
No data available for the selected filters.
```

---

# 16. Loading States

Long-running operations shall display loading indicators.

Examples:

- Report Generation
- Bill Generation
- Payment Recording
- File Upload

Users shall receive clear progress feedback.

---

# 17. Error States

Validation errors shall appear beside the relevant input fields.

Unexpected system errors shall display a clear message with an option to retry.

Raw technical error messages shall never be shown to users.

---

# 18. Accessibility

The interface shall support:

- Full keyboard navigation
- Visible keyboard focus
- High contrast text
- Clear validation messages
- Consistent navigation order

---

# 19. Responsive Behaviour

Primary target:

- Desktop (Windows)

Minimum supported width:

```
1366 × 768
```

The application shall remain usable on larger resolutions.

Version 1 is not required to optimize for tablets or mobile devices.

---

# 20. General UX Rules

- Minimize unnecessary clicks.
- Preserve user-entered data until explicitly cancelled.
- Confirm destructive actions.
- Maintain consistent layouts across modules.
- Prioritize speed and productivity over decorative visuals.
- Keep navigation predictable and stable.

---

# Related Documents

- FEATURE_SPECIFICATIONS.md
- MODULES.md
- API.md
- DATABASE.md
- BUSINESS_WORKFLOWS.md

---

# Document Status

**Status:** Frozen

This document defines the user interface and user experience specification for SSRL ERP Version 1.

Frontend implementation shall follow this specification while preserving all approved business workflows and rules.
