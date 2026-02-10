# Config Management - User Guide

**Last Updated:** January 29, 2026

---

## Overview

The Config Management module allows you to create, edit, and manage assessment and output configurations directly from the Reentry dashboard—no technical knowledge required.

**Key Benefits:**
- Create and modify configs without developer involvement
- Test configurations in staging before deploying to production
- Track all changes with a complete audit history
- Move configurations between environments easily

---

## Getting Started

### Accessing Config Management

1. Log in to the Reentry dashboard with your Recidiviz account
2. Click **"Config I/O"** in the top navigation bar
3. You'll see two sections: **Assessment Configs** and **Output Configs**

### Understanding Config Types

| Type | Purpose | Example |
|------|---------|---------|
| **Assessment Config** | Defines how intake conversations work | Utah Community Correctional Center Intake |
| **Output Config** | Defines how reports are generated | Action Plan, Intake Summary |

---

## Config Lifecycle

Each configuration goes through a simple lifecycle:

```
DRAFT → ACTIVE → INACTIVE
```

| Status | What It Means | Can Edit? | In Use? |
|--------|---------------|-----------|---------|
| **Draft** | Work in progress | Yes | No |
| **Active** | Currently used by the application | No | Yes |
| **Inactive** | Previously active, now replaced | No | No |

**Key Rules:**
- Only **one version** of a config can be active at a time
- When you activate a new version, the previous version automatically becomes inactive
- You can reactivate an inactive version if needed (rollback scenario)

---

## Common Tasks

### Viewing Configs

1. Go to **Config** in the navigation
2. By default, you'll see **Active** configs
3. Use the **Status filter** to see Draft or Inactive configs
4. Use the **State filter** (for assessments) to filter by state

### Creating a New Version

When you want to modify an active config:

1. Open the active config you want to change
2. Click **"Create New Version"**
3. A new draft is created with the same content
4. Make your changes in the YAML editor
5. Click **"Save Draft"** to save your work
6. When ready, click **"Activate"** to make it live

### Editing a Draft

1. Open the draft config
2. Edit the YAML content in the editor
3. The system validates your changes in real-time:
   - Green checkmark = Valid
   - Red X with errors = Fix the issues listed
4. Click **"Save Draft"** when done
5. Click **"Activate"** when ready to go live

### Activating a Config

1. Open the draft or inactive config
2. Click **"Activate"** (or **"Reactivate"** for inactive configs)
3. The config becomes active immediately
4. The previously active version (if any) becomes inactive

### Deactivating a Config (Emergency Only)

Use this only to disable a problematic configuration:

1. Open the active config
2. Click **"Deactivate"**
3. Review the warning message carefully
4. Click **"Yes, Deactivate"** to confirm

**Warning:** This leaves no active config for this config code. New intakes won't have a configuration to use until you activate another version.

---

## Moving Configs Between Environments

To deploy a config from Staging to Production (or vice versa):

### Step 1: Export from Source Environment

1. Open the config you want to export
2. Click **"Export YAML"**
3. A file downloads to your computer (e.g., `assessment-UT-CCCI-v2.yaml`)

### Step 2: Import to Target Environment

1. Switch to the target environment (e.g., Production)
2. Go to **Config** → Click **"Import YAML"**
3. Select the config type (Assessment or Output)
4. Drag and drop the YAML file (or click to browse)
5. Review the validation results
6. Choose an import option:
   - **Import as draft** - Review before activating
   - **Import and activate immediately** - Goes live right away
7. Click **"Import Config"**

---

## Tips & Best Practices

### Before Activating in Production

1. **Test in Staging first** - Always test new configs in staging
2. **Review the changes** - Make sure you understand what changed
3. **Check references** - Ensure all output configs referenced exist

### Working with YAML

- The editor has **syntax highlighting** to help you spot errors
- Use the **Copy button** (top-right) to copy the YAML content
- **Tab key** inserts proper indentation (2 spaces)
- **Real-time validation** shows errors as you type

### Version Numbers

- Version numbers are managed automatically
- When you create a new version, the number increments (v1 → v2)
- The version in the YAML metadata is updated automatically

### Audit Trail

- Every action is logged (create, edit, activate, export, import)
- View the history at the bottom of any config detail page
- Useful for tracking who made changes and when

---

## Troubleshooting

### "Missing output configs in database"

This error means the assessment config references output configs that don't exist in this environment. You need to import the missing output configs first.

### "Version X already exists"

When importing, the version number in the YAML must not already exist. Edit the YAML file and increment the version number before importing.

### Can't Save Draft

Make sure there are no validation errors (red messages above the editor). Fix all errors before saving.

### Config Not Showing Up

Check the status filter. The default view shows only "Active" configs. Switch to "All" or the specific status you're looking for.

---

## Quick Reference

| Action | How To |
|--------|--------|
| View all configs | Config → Status filter: All |
| Create new version | Open config → "Create New Version" |
| Save changes | Edit YAML → "Save Draft" |
| Go live | Open draft → "Activate" |
| Rollback | Open inactive version → "Reactivate" |
| Export | Open config → "Export YAML" |
| Import | Config → "Import YAML" → Upload file |
| Emergency disable | Open active → "Deactivate" |

---

## Need Help?

Contact the engineering team if you:
- Encounter unexpected errors
- Need to recover from a mistake
- Have questions about YAML structure
- Need access to config management
