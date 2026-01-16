# Notes Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Daily Notes System](#daily-notes-system)
4. [Data Storage](#data-storage)
5. [UI Features](#ui-features)

---

## Overview

The **Notes** page (`/notes`) provides a daily notes/journal system for LPG Nexus. It allows you to:
- Create daily notes
- Edit existing notes
- View notes by date
- Organize notes with sections
- Add labels/tags
- Track character count

---

## Page Structure

### File Organization

```
src/app/notes/
├── page.tsx                    # Main server component
└── actions.ts                  # Notes CRUD actions
```

---

## Daily Notes System

### Note Structure

**Fields**:
- **Date**: Unique date for each note
- **Note Text**: Main note content
- **Sections**: JSON object with organized sections
- **Labels**: Array of tags/labels
- **Character Count**: Auto-calculated

### Sections

Notes can be organized into sections:
- **Work Notes**: Work-related notes
- **Personal Notes**: Personal notes
- **Reminders**: Reminder items
- **Custom Sections**: User-defined sections

---

## Data Storage

### DailyNote Model

```prisma
model DailyNote {
  id             String   @id @default(cuid())
  noteDate       DateTime @unique
  noteText       String   @default("")
  sections       Json
  labels         String[]
  characterCount Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### Key Features

- **Unique Date**: One note per day
- **JSON Sections**: Flexible section structure
- **Labels Array**: Multiple labels per note
- **Auto Character Count**: Calculated on save

---

## UI Features

### Date Selection

- **Date Picker**: Select specific date
- **Default**: Current date
- **Navigation**: Previous/Next day buttons
- **Quick Jump**: Jump to today

### Note Editor

- **Rich Text**: Text editing capabilities
- **Sections**: Organize content into sections
- **Labels**: Add/remove labels
- **Character Count**: Real-time character count
- **Auto-save**: (if configured)

### Note Display

- **Formatted Text**: Preserves formatting
- **Sections**: Display organized sections
- **Labels**: Show labels as badges
- **Date Header**: Clear date display

---

## Permissions

### Access Control

- **Route**: `/notes`
- **Permission Check**: `enforcePagePermission("/notes")`
- **Required Permissions**:
  - View: Access to notes module
  - Create/Edit: `canEdit("notes")`
  - Delete: `canEdit("notes")`

---

## Related Pages

- **Dashboard** (`/`) - Quick access to today's notes
- **Reports** (`/reports`) - Notes in reports (if configured)

---

## Future Enhancements

1. Rich text editor (WYSIWYG)
2. Note templates
3. Note search functionality
4. Note export (PDF, text)
5. Note sharing
6. Note reminders
7. Note attachments
8. Note version history

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready

