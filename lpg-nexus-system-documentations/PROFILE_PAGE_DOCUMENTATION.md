# Profile Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Profile Information](#profile-information)
4. [Update Operations](#update-operations)
5. [Data Validation](#data-validation)

---

## Overview

The **Profile** page (`/profile`) allows users to view and update their personal profile information. It includes:
- Personal information (name, email, phone)
- Profile picture upload
- Business information
- Address details
- Password change (if applicable)

---

## Page Structure

### File Organization

```
src/app/profile/
├── page.tsx                    # Main server component
└── actions.ts                  # Profile update actions

src/components/profile/
└── profile-form.tsx            # Profile form component
```

---

## Profile Information

### Personal Information

- **Name**: User's full name
- **Email**: User's email address (unique, cannot be changed)
- **Phone**: Contact number
- **Username**: Login username (if set)

### Business Information

- **Business Name**: Company/business name
- **Department**: Department/division
- **Branch**: Branch location
- **Company Description**: Business description

### Address Information

- **Street Address**: Street and number
- **City**: City name
- **State/Province**: State or province
- **Country**: Country name

### Profile Picture

- **Upload**: Image upload functionality
- **Preview**: Image preview before save
- **Format**: Base64 encoded image
- **Storage**: `User.profileImage` field

---

## Update Operations

### Update Profile

**Process**:
1. User modifies profile fields
2. Client-side validation
3. Server action: `updateProfile`
4. Permission check
5. Database update
6. Revalidation
7. Success notification (yellow toast)

**Fields Updated**:
- All profile fields
- Profile image (if changed)
- Updated timestamp

---

## Data Validation

### Profile Schema

```typescript
{
  name: string (required, min 2 chars)
  email: string (required, valid email, unique)
  phone: string (optional)
  username: string (optional, unique if provided)
  businessName: string (optional)
  department: string (optional)
  branch: string (optional)
  companyDescription: string (optional)
  streetAddress: string (optional)
  city: string (optional)
  stateProvince: string (optional)
  country: string (optional)
  profileImage: string (optional, base64)
}
```

---

## Database Schema

### User Model (Profile Fields)

```prisma
model User {
  id                   String   @id @default(cuid())
  name                 String
  email                String   @unique
  phone                String?
  username             String?  @unique
  department           String?
  branch               String?
  profileImage         String?
  companyDescription   String?
  streetAddress        String?
  city                 String?
  stateProvince        String?
  country              String?
  businessName         String?
  updatedAt            DateTime @updatedAt
}
```

---

## UI Features

### Profile Form

- **Layout**: Multi-section form
- **Sections**:
  1. Personal Information
  2. Business Information
  3. Address Information
  4. Profile Picture

### Image Upload

- Drag and drop support
- Image preview
- Crop/resize options
- Base64 encoding
- Validation (file type, size)

### Form Validation

- Real-time validation
- Error messages
- Required field indicators
- Email format validation

---

## Permissions

### Access Control

- **Route**: `/profile`
- **Permission Check**: `enforcePagePermission("/profile")`
- **Access**: All authenticated users can access their own profile
- **Update**: Users can only update their own profile

---

## Related Pages

- **Dashboard** (`/`) - Shows user name in header
- **Settings** (`/settings`) - System-wide settings
- **Super Admin** (`/super-admin`) - User management

---

## Future Enhancements

1. Password change functionality
2. Two-factor authentication
3. Profile verification
4. Activity history
5. Notification preferences
6. Privacy settings
7. Account deletion

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready

