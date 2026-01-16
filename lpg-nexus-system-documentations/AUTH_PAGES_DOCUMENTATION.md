# Authentication Pages - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Login Page](#login-page)
3. [Register Page](#register-page)
4. [Forgot Password Page](#forgot-password-page)
5. [Access Control](#access-control)

---

## Overview

The **Authentication** pages handle user authentication and account management in LPG Nexus. They include:
- User login
- User registration
- Password recovery
- Access control

---

## Login Page

### Route: `/login`

**Purpose**: User authentication and login

**Features**:
- Email/username and password login
- Remember me option
- Error handling
- Redirect after login
- JWT token generation

**Process**:
1. User enters credentials
2. Server validation
3. Password verification (bcrypt)
4. JWT token generation
5. Set authentication cookie
6. Redirect to dashboard
7. Update last login timestamp

**Security**:
- Password hashing (bcrypt)
- JWT token expiration
- Secure cookie storage
- Rate limiting (if configured)

---

## Register Page

### Route: `/register`

**Purpose**: New user registration

**Features**:
- User registration form
- Email verification (OTP)
- Password strength validation
- Terms and conditions acceptance

**Fields**:
- Name (required)
- Email (required, unique)
- Phone (optional)
- Password (required, min 8 chars)
- Confirm Password (required, must match)
- Terms Acceptance (required)

**Process**:
1. User fills registration form
2. Client-side validation
3. Server-side validation
4. Email uniqueness check
5. OTP generation and email sending
6. OTP verification
7. Password hashing
8. User creation (status: PENDING)
9. Success notification
10. Redirect to login

**User Status**:
- New users: PENDING (awaiting verification)
- Admin verification required for activation

---

## Forgot Password Page

### Route: `/forgot-password`

**Purpose**: Password recovery

**Features**:
- Email-based password reset
- OTP verification
- Secure password reset

**Process**:
1. User enters email
2. Email validation
3. OTP generation
4. OTP sent to email
5. User enters OTP
6. OTP verification
7. New password entry
8. Password update
9. Success notification
10. Redirect to login

**Security**:
- OTP expiration (time-limited)
- One-time use OTP
- Secure password reset link
- Rate limiting

---

## Access Control

### Authentication Flow

```
User visits protected route
  ↓
Check for JWT token
  ↓
Token valid?
  ├─ Yes → Allow access
  └─ No → Redirect to /login
```

### Permission Flow

```
User accesses page
  ↓
Check authentication
  ↓
Check page permission
  ↓
Check module permission
  ↓
Allow/Deny access
```

### JWT Token

**Structure**:
- User ID
- Email
- Role
- Expiration time

**Storage**:
- HTTP-only cookie
- Secure flag
- SameSite protection

---

## Database Schema

### User Model (Auth Fields)

```prisma
model User {
  id           String      @id @default(cuid())
  name         String
  email        String      @unique
  passwordHash String?
  role         UserRole    @default(ADMIN)
  status       UserStatus  @default(PENDING)
  isVerified   Boolean     @default(false)
  lastLogin    DateTime?
  // ... other fields
}
```

### OTP Model

```prisma
model Otp {
  id         String    @id @default(cuid())
  email      String
  code       String
  expiresAt  DateTime
  verifiedAt DateTime?
  createdAt  DateTime  @default(now())
}
```

---

## Security Features

### Password Security

- **Hashing**: bcrypt with salt rounds
- **Minimum Length**: 8 characters
- **Strength Requirements**: (if configured)
- **No Plain Text Storage**: Passwords never stored in plain text

### OTP Security

- **Expiration**: Time-limited (e.g., 10 minutes)
- **One-Time Use**: OTP invalidated after use
- **Rate Limiting**: Prevents abuse
- **Email Verification**: OTP sent to registered email

### Session Security

- **JWT Expiration**: Tokens expire after set time
- **Secure Cookies**: HTTP-only, secure flag
- **CSRF Protection**: SameSite cookie attribute
- **Logout**: Token invalidation on logout

---

## Related Pages

- **Dashboard** (`/`) - Redirect after login
- **Profile** (`/profile`) - User profile management
- **Super Admin** (`/super-admin`) - User management

---

## Future Enhancements

1. Two-factor authentication (2FA)
2. Social login (Google, Facebook)
3. Password strength meter
4. Account lockout after failed attempts
5. Email verification on registration
6. Remember device functionality
7. Session management dashboard

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready

