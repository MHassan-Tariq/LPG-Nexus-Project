# Settings Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Settings Tabs](#settings-tabs)
4. [Configuration Options](#configuration-options)
5. [Data Storage](#data-storage)

---

## Overview

The **Settings** page (`/settings`) allows system administrators to configure various aspects of the LPG Nexus system. It includes:
- Software name and logo configuration
- Bill design customization
- Report design customization
- Chatbot settings
- System preferences

---

## Page Structure

### File Organization

```
src/app/settings/
├── page.tsx                    # Main server component
├── actions.ts                  # Settings save actions
└── bill-design-actions.ts      # Bill design actions

src/components/settings/
├── settings-form.tsx           # Software name/logo form
├── bill-designing-tab.tsx       # Bill design editor
├── report-designing-tab.tsx    # Report design editor
└── chatbot-settings-tab.tsx    # Chatbot configuration
```

---

## Settings Tabs

### 1. General Settings

**Purpose**: Configure basic system information

**Options**:
- **Software Name**: Custom name for the application
- **Software Logo**: Upload custom logo image
- **Logo Display**: Show/hide logo in bills and reports

**Storage**: Stored in `SystemSettings` table

### 2. Bill Design

**Purpose**: Customize bill appearance and layout

**Options**:
- Header design (show/hide, content, logo position)
- Footer design (show/hide, content)
- Table styling (borders, colors, fonts)
- QR Code and Barcode settings
- Color schemes
- Font preferences

**Storage**: Stored in `User.billTemplateDesign` (JSON)

### 3. Report Design

**Purpose**: Customize report appearance

**Options**:
- Header/footer design
- Chart styles
- Color schemes
- Layout preferences

**Storage**: Stored in `User.reportTemplateDesign` (JSON)

### 4. Chatbot Settings

**Purpose**: Configure AI chatbot

**Options**:
- Enable/disable chatbot
- API key configuration
- Visibility settings
- Response preferences

**Storage**: Stored in `User` table and `SystemSettings`

---

## Configuration Options

### Software Name

- **Field**: Text input
- **Validation**: Required, max 100 characters
- **Storage**: `SystemSettings` table with key "softwareName"
- **Usage**: Displayed in bills, reports, and UI
- **Dynamic Welcome Text**: The welcome message in the navbar and page headers automatically updates to "Welcome to {softwareName}"
  - Example: If software name is "hassan", it shows "Welcome to hassan"
  - Example: If software name is "My Company", it shows "Welcome to My Company"
  - Default: "Welcome to LPG Nexus" (if no software name is set)

### Software Logo

- **Field**: Image upload
- **Format**: Base64 encoded image
- **Storage**: `SystemSettings` table with key "softwareLogo"
- **Usage**: Displayed in bills, reports, and header

### Bill Presets

- Save multiple bill design presets
- Switch between presets
- Export/import presets
- Storage: `User.billPresets` (JSON array)

### Report Presets

- Save multiple report design presets
- Switch between presets
- Export/import presets
- Storage: `User.reportPresets` (JSON array)

---

## Data Storage

### SystemSettings Table

```prisma
model SystemSettings {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}
```

**Keys Used**:
- `softwareName`: Software name
- `softwareLogo`: Base64 encoded logo
- `geminiApiKey`: AI chatbot API key (encrypted)

### User Table (Design Preferences)

```prisma
model User {
  billTemplateDesign   Json?
  billPresets          Json?
  reportTemplateDesign Json?
  reportPresets        Json?
  themePreferences     Json?
  fontPreferences      Json?
  logoCustomUpload     String?
}
```

---

## UI Features

### Tab Navigation

- **General**: Basic settings
- **Bill Design**: Bill customization
- **Report Design**: Report customization
- **Chatbot**: AI chatbot settings

### Image Upload

- Drag and drop support
- Image preview
- Base64 encoding
- Validation (file type, size)

### Design Editor

- Visual editor for bill/report design
- Real-time preview
- Color picker
- Font selector
- Layout options

---

## Permissions

### Access Control

- **Route**: `/settings`
- **Permission Check**: `enforcePagePermission("/settings")`
- **Required Permissions**:
  - View: Access to settings module
  - Edit: `canEdit("settings")` or ADMIN/SUPER_ADMIN role

---

## Related Pages

- **Dashboard** (`/`) - Uses software name/logo
- **Payments** (`/payments`) - Uses bill design
- **Reports** (`/reports`) - Uses report design
- **All Pages** - Uses software name/logo in header

---

## Future Enhancements

1. Theme customization
2. Multi-language support
3. Email template design
4. Notification settings
5. Backup/restore settings
6. System health monitoring
7. Advanced security settings

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready

