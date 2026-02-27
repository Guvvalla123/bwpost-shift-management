# SaaS Platform Enhancements - Shift Management System

## Current Architecture Analysis

### ✅ What You Have:
- User authentication (JWT with refresh tokens)
- Role-based access (manager/employee)
- Shift CRUD operations
- Employee shift applications
- Basic attendance tracking
- Dashboard analytics
- Security middleware (helmet, rate limiting, XSS protection)

### ❌ What's Missing for SaaS:

---

## 🏢 1. MULTI-TENANCY / ORGANIZATION SUPPORT

**Priority: CRITICAL** - Without this, you can't have multiple customers.

### New Model: `organizationModel.js`
```javascript
const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true }, // e.g., "acme-corp"
    subscriptionPlan: {
      type: String,
      enum: ["free", "starter", "professional", "enterprise"],
      default: "free"
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "cancelled", "suspended", "trial"],
      default: "trial"
    },
    subscriptionExpiresAt: Date,
    maxUsers: { type: Number, default: 5 },
    maxShiftsPerMonth: { type: Number, default: 50 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    settings: {
      timezone: { type: String, default: "UTC" },
      dateFormat: { type: String, default: "MM/DD/YYYY" },
      allowSelfRegistration: { type: Boolean, default: false },
      requireShiftApproval: { type: Boolean, default: false }
    },
    billingEmail: String,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);
```

### Update: `userModel.js`
Add organization reference:
```javascript
organization: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Organization",
  required: true
}
```

### Update: `shiftModel.js`
Add organization reference:
```javascript
organization: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Organization",
  required: true
}
```

### New Controller: `organizationController.js`
- `createOrganization` - Create new org (on user signup)
- `getMyOrganization` - Get current user's org
- `updateOrganization` - Update org settings
- `inviteUser` - Send invitation to join org
- `getOrganizationMembers` - List all members
- `removeMember` - Remove user from org
- `updateSubscription` - Handle subscription changes

---

## 💳 2. SUBSCRIPTION & BILLING

**Priority: HIGH** - Needed for monetization.

### New Model: `subscriptionModel.js`
```javascript
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    plan: {
      type: String,
      enum: ["free", "starter", "professional", "enterprise"],
      required: true
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "past_due", "trialing"],
      default: "trialing"
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    price: { type: Number, required: true },
    currency: { type: String, default: "USD" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
```

### New Controller: `billingController.js`
- `createCheckoutSession` - Stripe checkout
- `handleWebhook` - Stripe webhook handler
- `getSubscription` - Get current subscription
- `cancelSubscription` - Cancel subscription
- `updatePaymentMethod` - Update card

### Integration Required:
- Stripe SDK for payments
- Webhook endpoint for subscription events

---

## 📧 3. EMAIL NOTIFICATIONS

**Priority: HIGH** - Critical for user engagement.

### New Service: `services/emailService.js`
```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  // Configure SMTP (Gmail, SendGrid, AWS SES, etc.)
});

exports.sendShiftCreatedEmail = async (shift, employees) => { };
exports.sendShiftReminderEmail = async (shift, employee) => { };
exports.sendInvitationEmail = async (email, orgName, inviteToken) => { };
exports.sendShiftCancelledEmail = async (shift, employees) => { };
exports.sendWelcomeEmail = async (user) => { };
```

### Email Templates Needed:
- Shift created notification
- Shift reminder (24h before)
- Shift cancelled
- User invitation
- Welcome email
- Password reset
- Subscription expiry warning

---

## 📊 4. AUDIT LOGS

**Priority: MEDIUM** - Important for compliance and debugging.

### New Model: `auditLogModel.js`
```javascript
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    action: {
      type: String,
      required: true,
      enum: [
        "shift.created",
        "shift.updated",
        "shift.deleted",
        "user.created",
        "user.deleted",
        "user.role_changed",
        "subscription.updated",
        "settings.updated"
      ]
    },
    resourceType: { type: String, required: true }, // "Shift", "User", etc.
    resourceId: mongoose.Schema.Types.ObjectId,
    changes: mongoose.Schema.Types.Mixed, // Before/after values
    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

auditLogSchema.index({ organization: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
```

### New Middleware: `auditMiddleware.js`
Automatically log all important actions.

---

## 🔐 5. ADVANCED PERMISSIONS & RBAC

**Priority: MEDIUM** - Needed for enterprise customers.

### New Model: `permissionModel.js`
```javascript
const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  permissions: [{
    resource: String, // "shift", "user", "settings"
    actions: [String]  // ["create", "read", "update", "delete"]
  }]
});

module.exports = mongoose.model("Permission", permissionSchema);
```

### New Roles:
- `super_admin` - Full org control
- `admin` - Manage users and shifts
- `manager` - Create/manage shifts
- `employee` - Apply for shifts
- `viewer` - Read-only access

---

## 📈 6. ADVANCED ANALYTICS & REPORTING

**Priority: MEDIUM** - Valuable for customers.

### New Controller: `analyticsController.js`
- `getShiftAnalytics` - Shift completion rates, utilization
- `getEmployeeAnalytics` - Employee performance metrics
- `getAttendanceReport` - Attendance trends
- `getCostAnalysis` - Labor cost analysis
- `exportReport` - Export to CSV/PDF

### New Model: `reportModel.js`
Store generated reports for history.

---

## 🔔 7. NOTIFICATIONS SYSTEM

**Priority: MEDIUM** - Better UX.

### New Model: `notificationModel.js`
```javascript
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  type: {
    type: String,
    enum: ["shift_created", "shift_reminder", "shift_cancelled", "invitation", "system"]
  },
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  link: String, // URL to relevant page
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
```

### New Controller: `notificationController.js`
- `getNotifications` - Get user notifications
- `markAsRead` - Mark notification as read
- `markAllAsRead` - Mark all as read
- `deleteNotification` - Delete notification

---

## 🔗 8. WEBHOOKS & API INTEGRATIONS

**Priority: LOW** - For advanced integrations.

### New Model: `webhookModel.js`
```javascript
const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  url: { type: String, required: true },
  events: [String], // ["shift.created", "shift.updated"]
  secret: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Webhook", webhookSchema);
```

### New Service: `services/webhookService.js`
Send webhooks to external URLs when events occur.

---

## 📤 9. DATA EXPORT/IMPORT

**Priority: LOW** - Useful feature.

### New Controller: `exportController.js`
- `exportShifts` - Export shifts to CSV/Excel
- `exportEmployees` - Export employee list
- `exportAttendance` - Export attendance records
- `importShifts` - Bulk import shifts from CSV

---

## 👥 10. USER INVITATIONS

**Priority: MEDIUM** - Needed for team growth.

### New Model: `invitationModel.js`
```javascript
const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["manager", "employee"],
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  token: { type: String, required: true, unique: true },
  expiresAt: Date,
  acceptedAt: Date,
  status: {
    type: String,
    enum: ["pending", "accepted", "expired"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Invitation", invitationSchema);
```

---

## 🗂️ 11. FILE UPLOADS

**Priority: LOW** - For documents/attachments.

### Integration:
- AWS S3 / Cloudinary / Local storage
- File upload middleware (multer)
- File model for tracking uploads

---

## ⚙️ 12. SETTINGS & PREFERENCES

**Priority: MEDIUM** - User experience.

### New Model: `userSettingsModel.js`
```javascript
const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  emailNotifications: {
    shiftReminders: { type: Boolean, default: true },
    shiftCreated: { type: Boolean, default: true },
    shiftCancelled: { type: Boolean, default: true }
  },
  timezone: { type: String, default: "UTC" },
  dateFormat: { type: String, default: "MM/DD/YYYY" },
  theme: { type: String, enum: ["light", "dark"], default: "light" }
}, { timestamps: true });

module.exports = mongoose.model("UserSettings", userSettingsSchema);
```

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1 (MVP SaaS - 2-3 weeks):
1. ✅ Multi-tenancy (Organization model + middleware)
2. ✅ Update User/Shift models with org references
3. ✅ Basic subscription model
4. ✅ Email notifications (critical events)
5. ✅ User invitations

### Phase 2 (Growth - 3-4 weeks):
6. ✅ Stripe integration for billing
7. ✅ Audit logs
8. ✅ Notifications system
9. ✅ Advanced analytics
10. ✅ Settings & preferences

### Phase 3 (Enterprise - 4-6 weeks):
11. ✅ Advanced RBAC
12. ✅ Webhooks
13. ✅ Data export/import
14. ✅ File uploads
15. ✅ API rate limiting per organization

---

## 📝 MIDDLEWARE UPDATES NEEDED

### New Middleware: `organizationMiddleware.js`
```javascript
// Ensure user belongs to organization
// Attach organization to req.organization
// Check subscription limits
```

### Update: `authMiddleware.js`
- Add organization context to JWT
- Verify user belongs to organization

---

## 🔒 SECURITY CONSIDERATIONS

1. **Data Isolation**: Ensure users can only access their organization's data
2. **Rate Limiting**: Per-organization rate limits
3. **API Keys**: For programmatic access
4. **IP Whitelisting**: For enterprise customers
5. **2FA**: Two-factor authentication
6. **Password Policies**: Enforce strong passwords

---

## 📦 NEW DEPENDENCIES NEEDED

```json
{
  "stripe": "^14.0.0",
  "nodemailer": "^6.9.0",
  "handlebars": "^4.7.8",
  "multer": "^1.4.5",
  "aws-sdk": "^2.1500.0",
  "csv-parser": "^3.0.0",
  "pdfkit": "^0.13.0",
  "speakeasy": "^2.0.0"
}
```

---

## 🎯 NEXT STEPS

1. Start with **Organization model** - This is the foundation
2. Update all queries to filter by `organization`
3. Add organization middleware to all routes
4. Implement subscription model
5. Add email service
6. Build invitation system

Would you like me to start implementing any of these features?
