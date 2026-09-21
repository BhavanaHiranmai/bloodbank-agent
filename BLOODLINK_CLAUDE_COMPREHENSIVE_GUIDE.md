# BloodLink Complete Codebase Specification and Handoff Document

This document provides a highly detailed, comprehensive overview of the **BloodLink** application (both the Web React/Vite app, the Server Node/Express app, and the Mobile React Native/Expo app). It compiles directories, database models, full API catalogs, WebSocket protocols, sequence flows, and active issue contexts to give a complete system specification.

---

## 1. Architectural Overview & Directories

BloodLink is a real-time, location-aware MERN stack application paired with a React Native/Expo mobile app.
- **Backend API**: Node.js + Express.js serving REST APIs and managing socket connections.
- **Database**: MongoDB (NoSQL) with Mongoose ODM using geographical queries (`2dsphere` indexes).
- **Web Frontend**: React 19 + Vite + Tailwind CSS.
- **Mobile App**: React Native (Expo SDK 54) supporting geolocation tracking and native push alerts.
- **Real-Time Layer**: Socket.IO for immediate emergency notifications, geolocation updates, and messaging.

### 1.1 Codebase File Map (Excluding `node_modules` and build outputs)

```text
Blood/
│
├── Server/                          # Backend Express/Node.js API Server
│   ├── config/                      # Database and environment configurations
│   ├── controllers/                 # Business logic handlers for all endpoints
│   │   ├── adminController.js       # Admin functions (users, stats, analytics)
│   │   ├── appointmentController.js # Managing appointments and scheduling
│   │   ├── auth.js                  # Authentication, signup, login, OTP
│   │   ├── bloodFinderController.js  # Donor/hospital search queries
│   │   ├── bloodRequestController.js# Emergency SOS and blood request workflows
│   │   ├── chatController.js        # Conversation and messaging handlers
│   │   ├── donationController.js    # Historical donation record operations
│   │   ├── donorController.js       # Donor geolocation updates
│   │   ├── eligibilityController.js # Eligibility screening questionnaire
│   │   ├── hospitalController.js    # Hospital profile and organization handlers
│   │   ├── inventoryController.js   # Hospital blood stock inventory
│   │   ├── loyaltyController.js     # Leaderboards, badges, points
│   │   └── notificationController.js# Notifications and alert feeds
│   ├── middlewares/                 # Middleware files
│   │   ├── admin.js                 # Admin privilege checks
│   │   ├── auth.js                  # JWT validation (legacy/current)
│   │   ├── authMiddleware.js        # Main JWT verification middleware
│   │   └── roleMiddleware.js        # Role restrictions (donor, hospital, admin)
│   ├── models/                      # Mongoose DB schemas (MongoDB models)
│   │   ├── Appointment.js           # Donation appointment slots
│   │   ├── blood.js                 # Unified blood groups metadata (if applicable)
│   │   ├── BloodInventory.js        # Blood stock items inside hospitals
│   │   ├── BloodRequest.js          # Emergency requests and SOS logs
│   │   ├── ChatConversation.js      # Message rooms between requester and donor
│   │   ├── DonationHistory.js       # Verified donation history records
│   │   ├── EligibilityRecord.js     # Multi-step donor screening submissions
│   │   ├── LoyaltyRecord.js         # Points accrual logs
│   │   ├── Notification.js          # In-app notifications
│   │   ├── PushSubscription.js      # Web Push VAPID endpoint subscriptions
│   │   └── user.js                  # Master User model (Donors, Hospitals, Admins)
│   ├── routes/                      # Route endpoint definitions
│   │   ├── adminRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── auth.js
│   │   ├── bloodFinderRoutes.js
│   │   ├── bloodRequestRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── donationRoutes.js
│   │   ├── donorRoutes.js
│   │   ├── eligibilityRoutes.js
│   │   ├── hospitalRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── loyaltyRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── pushRoutes.js
│   ├── utils/                       # Utilities and background tasks
│   │   ├── bloodCompatibility.js    # Blood compatibility logic (donor -> requester)
│   │   ├── cronJobs.js              # Expired stock alerts cron scheduler
│   │   ├── eligibilityDeferral.js   # 30-day deferral rules
│   │   ├── expoPush.js              # Native mobile push service (Expo API)
│   │   ├── geoRouting.js            # Path ranking for nearby requests
│   │   ├── haversine.js             # Geolocation distance helpers
│   │   ├── realtime.js              # Socket.IO connection and rooms management
│   │   ├── recordDonation.js        # Utility to process completed donations
│   │   ├── seed.js                  # Database seeder script
│   │   └── webPush.js               # VAPID web push configurations
│   ├── server.js                    # Express Entry Point
│   └── package.json
│
├── Frontend/                        # React Web Application
│   ├── public/                      # Static assets & Service Worker (`sw.js`)
│   ├── src/
│   │   ├── api/                     # Axios instance (`axios.js`)
│   │   ├── assets/                  # CSS stylesheets, static images
│   │   ├── components/common/       # Reusable layout and routing components
│   │   │   ├── BloodGroupBadge.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/                 # Context Providers
│   │   │   ├── AuthContext.jsx      # Legacy auth context / state
│   │   │   ├── authStore.js         # Main auth state logic using React hooks
│   │   │   └── SocketContext.jsx    # Real-time WebSocket handlers & SOS alarms
│   │   ├── pages/                   # Views categorized by user role
│   │   │   ├── auth/                # Login, Register, OTP pages
│   │   │   ├── public/              # Landing page, About, Contact
│   │   │   ├── shared/              # Common layouts and ChatPage
│   │   │   └── AppPages.jsx         # Combined file containing most dashboard sub-screens
│   │   ├── utils/                   # Helper functions (ICS generate, configurations)
│   │   ├── App.css                  # Custom styling overrides
│   │   ├── App.jsx                  # App route setup
│   │   ├── index.css                # Base CSS configuration
│   │   └── main.jsx                 # Entry node for React virtual DOM
│   ├── vite.config.js
│   └── package.json
│
└── Mobile/                          # React Native (Expo) Mobile Application
    ├── src/
    │   ├── components/              # Buttons, cards, pills, loading overlays
    │   ├── context/                 # AppContext (auth session & API configurations)
    │   ├── screens/                 # Mobile layouts corresponding to role dashboards
    │   │   ├── admin/               # Admin sub-pages (inventory, user lists)
    │   │   ├── chat/                # Real-time chat list and conversation screen
    │   │   ├── donor/               # Donor sub-pages (appointments, history)
    │   │   ├── hospital/            # Hospital inventory management screens
    │   │   └── public/              # Welcome, login, and registration screens
    │   ├── styles/                  # Styling themes and engine
    │   └── utils/                   # Mobile-specific helpers (Expo notifications)
    ├── App.js                       # Navigation container entry point
    ├── app.json                     # Expo configurations
    └── package.json
```

---

## 2. Database Models & Schema Definitions

All relationships are built via Mongoose schema definitions using `mongoose.Schema.Types.ObjectId` to reference related documents.

### 2.1 User Model (`Server/models/user.js`)
Stores user profiles and login credentials. Role decides available dashboards.
```javascript
{
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, trim: true, default: "" },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phoneNumber: { type: String, required: true, unique: true, trim: true },
  dob: { type: Date },
  bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
  password: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other", "male", "female", "other"] },
  city: { type: String, required: true, trim: true },
  address: { type: String },
  hospitalName: { type: String },                    // Required/applicable only for Hospital role
  pincode: { type: String },
  licenseNumber: { type: String },                   // Required/applicable only for Hospital role
  registrationNumber: { type: String },
  emergencyContact: { type: String },
  age: { type: Number },
  role: { type: String, enum: ["donor", "hospital", "organization", "admin"], default: "donor" },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },     // Email / Mobile Verification status
  isApproved: { type: Boolean, default: false },     // Admin approval status for Hospitals
  isEligible: { type: Boolean, default: false },     // Donor Eligibility status
  suspensionReason: { type: String },
  points: { type: Number, default: 0 },
  totalDonations: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] }                  // [longitude, latitude]
  },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  profilePhoto: { type: String },
  expoPushToken: { type: String },
  timestamps: true
}
// Index: location: "2dsphere"
```

### 2.2 BloodInventory Model (`Server/models/BloodInventory.js`)
Represents stock records of blood units at individual hospitals.
```javascript
{
  hospital: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], required: true },
  units: { type: Number, required: true, min: 0 },
  expiryDate: { type: Date, required: true },
  lastUpdated: { type: Date, default: Date.now }
}
// Index: { hospital: 1, bloodGroup: 1 }
```

### 2.3 BloodRequest Model (`Server/models/BloodRequest.js`)
Maintains active hospital requests or donor emergency SOS alerts.
```javascript
{
  requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], required: true },
  unitsNeeded: { type: Number, required: true, min: 1 },
  urgency: { type: String, enum: ["normal", "urgent", "critical"], default: "normal" },
  status: { type: String, enum: ["open", "responding", "fulfilled", "cancelled"], default: "open" },
  notes: { type: String },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }  // [longitude, latitude]
  },
  radiusKm: { type: Number, default: 10 },
  notifiedDonors: [{ type: Schema.Types.ObjectId, ref: "User" }],
  respondingDonors: [
    {
      donor: { type: Schema.Types.ObjectId, ref: "User" },
      action: { type: String, enum: ["accept", "decline"] },
      respondedAt: { type: Date, default: Date.now }
    }
  ],
  acceptedDonor: { type: Schema.Types.ObjectId, ref: "User" },
  fulfilledAt: { type: Date }
}
// Index: location: "2dsphere"
```

### 2.4 ChatConversation Model (`Server/models/ChatConversation.js`)
Tracks the active room configuration and stored messages.
```javascript
{
  request: { type: Schema.Types.ObjectId, ref: "BloodRequest", required: true, unique: true },
  requester: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Replaces legacy 'hospital' reference
  donor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  messages: [
    {
      sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
      message: { type: String, required: true, trim: true, maxlength: 1000 },
      createdAt: { type: Date, default: Date.now },
      readBy: [{ type: Schema.Types.ObjectId, ref: "User" }]
    }
  ]
}
// Index: { requester: 1, donor: 1 }
```

### 2.5 Appointment Model (`Server/models/Appointment.js`)
Defines blood donation slots booked by donors at certified hospitals.
```javascript
{
  donor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  hospital: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" }
}
```

### 2.6 EligibilityRecord Model (`Server/models/EligibilityRecord.js`)
Tracks the donor medical questionnaire logs.
```javascript
{
  donor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  age: { type: Number },
  weight: { type: Number },
  recentIllness: { type: Boolean },
  medications: { type: Boolean },
  travelHistory: { type: Boolean },
  tattooPiercing: { type: Boolean },
  hemoglobin: { type: Number },
  gender: { type: String },
  status: { type: String, enum: ["eligible", "temporarily_deferred", "permanently_deferred"], required: true },
  deferralReason: { type: String },
  deferralUntil: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}
```

### 2.7 DonationHistory Model (`Server/models/DonationHistory.js`)
Stores certified logs of previous donations, supporting certificate exports.
```javascript
{
  donor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  hospital: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], required: true },
  units: { type: Number, default: 1 },
  donationDate: { type: Date, default: Date.now },
  certificateId: { type: String, unique: true, required: true },
  bloodRequest: { type: Schema.Types.ObjectId, ref: "BloodRequest", unique: true, sparse: true },
  appointment: { type: Schema.Types.ObjectId, ref: "Appointment", unique: true, sparse: true },
  source: { type: String, enum: ["appointment", "sos", "manual"], default: "manual" },
  notes: { type: String }
}
```

### 2.8 LoyaltyRecord Model (`Server/models/LoyaltyRecord.js`)
Records point histories contributing to leaderboard rankings and badge accruals.
```javascript
{
  donor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true }, // e.g. "donation_completed", "sos_accepted"
  points: { type: Number, default: 0 },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
}
```

### 2.9 Notification Model (`Server/models/Notification.js`)
Holds in-app notification alerts.
```javascript
{
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true }, // e.g. "blood_request", "donor_response", "eligibility_deferred"
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} }, // E.g., { requestId, distanceKm }
  isRead: { type: Boolean, default: false }
}
```

### 2.10 PushSubscription Model (`Server/models/PushSubscription.js`)
Stores endpoints for browser VAPID push alerts.
```javascript
{
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subscription: {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 3. Backend API Route Catalog

All routes are prefixed with `/api`. Protected endpoints require a valid JWT token passed in the HTTP Authorization Header as `Bearer <token>`.

| Module | Method | Endpoint | Auth | Allowed Roles | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/signup` | No | Any | Creates user profile, verifies email/phone (OTP-checked) |
| | `POST` | `/auth/login` | No | Any | Matches credentials and returns JWT token |
| | `POST` | `/auth/send-otp` | No | Any | Sends a numerical OTP verification email |
| | `POST` | `/auth/verify-otp` | No | Any | Validates user input OTP for registration |
| | `GET` | `/auth/me` | Yes | Any | Returns profile details of authenticated user |
| | `PUT` | `/auth/me` | Yes | Any | Updates user profile fields |
| | `POST` | `/auth/forgot-password` | No | Any | Triggers token email to initiate password recovery |
| | `POST` | `/auth/reset-password` | No | Any | Matches token and updates user password |
| **Eligibility** | `GET` | `/eligibility/status` | Yes | donor | Returns latest screening answers and date bounds |
| | `POST` | `/eligibility/check` | Yes | donor | Screens questions and changes eligibility status |
| **Loyalty** | `GET` | `/loyalty/my-stats` | Yes | donor | Returns user points ledger and unlocked badges |
| | `GET` | `/loyalty/leaderboard` | Yes | donor | Returns leaderboard ranked lists |
| **Donations** | `GET` | `/donations/my-history` | Yes | donor | Fetches certified historical donation records |
| **Appointments** | `GET` | `/appointments` | Yes | Any | Lists scheduled slots filtered by user role |
| | `POST` | `/appointments` | Yes | donor | Schedules appointment at a hospital |
| | `PUT` | `/appointments/:id/complete` | Yes | hospital | Logs completed donation from an appointment |
| **Inventory** | `GET` | `/inventory` | Yes | hospital | Lists current hospital stock categories |
| | `POST` | `/inventory` | Yes | hospital | Inserts or increases stock units |
| | `DELETE` | `/inventory/:id` | Yes | hospital | Discards expired stock units |
| | `GET` | `/inventory/expiry-alerts` | Yes | hospital | Lists stock expiring within 7 days |
| **Blood Requests** | `GET` | `/blood-requests` | Yes | hospital / donor | Returns requests raised by user |
| | `GET` | `/blood-requests/nearby` | Yes | donor | Locates active requests in radius (GeoQuery) |
| | `POST` | `/blood-requests` | Yes | hospital / donor | Creates request and alerts nearby donors |
| | `PUT` | `/blood-requests/:id/respond` | Yes | donor | Accepts or declines request |
| | `PUT` | `/blood-requests/:id/status` | Yes | hospital / donor | Cancels or resets an active request |
| | `PUT` | `/blood-requests/:id/complete-donation` | Yes | hospital | Completes request, awards points, and defers donor |
| **Notifications** | `GET` | `/notifications` | Yes | Any | Returns in-app alerts feed |
| | `PUT` | `/notifications/read-all` | Yes | Any | Marks all alerts read |
| | `PUT` | `/notifications/:id/read` | Yes | Any | Marks single alert read |
| | `DELETE` | `/notifications/:id` | Yes | Any | Deletes single notification |
| | `DELETE` | `/notifications/all` | Yes | Any | Clears notifications feed |
| **Donors** | `GET` | `/donors/search` | Yes | hospital | Filters donors by blood group and city |
| | `GET` | `/donors/count` | Yes | hospital / donor | Returns eligible donor counts for radius |
| | `PUT` | `/donors/location` | Yes | donor | Updates donor coordinates |
| **Hospitals** | `GET` | `/hospitals/list` | Yes | donor | Lists approved hospitals |
| **Chat** | `GET` | `/chats` | Yes | Any | Lists conversations for the user |
| | `GET` | `/chats/:requestId` | Yes | Any | Returns messages in a room |
| | `POST` | `/chats/:requestId/messages` | Yes | Any | Appends message to conversation |
| **Admin** | `GET` | `/admin/stats` | Yes | admin | Returns system metrics overview |
| | `GET` | `/admin/users` | Yes | admin | Filters system user accounts |
| | `PUT` | `/admin/users/:id/approve` | Yes | admin | Approves pending hospital profiles |
| | `PUT` | `/admin/users/:id/suspend` | Yes | admin | Suspends user with reason string |
| | `PUT` | `/admin/users/:id/activate` | Yes | admin | Reactivates suspended user profile |
| | `GET` | `/admin/requests` | Yes | admin | Lists system requests |
| | `GET` | `/admin/inventory` | Yes | admin | Returns stock totals by blood group |
| | `GET` | `/admin/analytics` | Yes | admin | Returns system donation trends |
| | `POST` | `/admin/broadcast` | Yes | admin | Sends alerts to target cohorts |

---

## 4. Real-time WebSocket Protocol (Socket.IO)

- **Setup & Auth**: Initialized in `Server/utils/realtime.js`. The client passes a JWT token during connection handshake (`SocketContext.jsx`). The server decodes it, verifies the user status, and joins the user to a private room: `socket.join("user:<userId>")`.
- **Chat Rooms**: When opening `ChatPage`, the client emits `request:join` with `requestId` to join the room: `socket.join("request:<requestId>")`.

### 4.1 Key Socket Events
- **`blood-request:new`**: Emitted to target nearby compatible donors.
- **`blood-request:closed`**: Emitted to notify non-accepted donors that the request is covered.
- **`blood-request:response`**: Emitted to the requester when a donor responds.
- **`chat:ready`**: Emitted to donor and requester when the conversation is created.
- **`chat:message`**: Emitted to the `request:<requestId>` room when a message is saved.
- **`chat:unread`**: Emitted to notify a user of unread messages when they are not in the room.
- **`eligibility:deferred`**: Emitted to notify a donor of their deferral status update.
- **`donation:recorded`**: Emitted to the donor when a donation is completed.

---

## 5. Key System Workflows

```mermaid
sequenceDiagram
    autonumber
    actor Hospital as Hospital User
    participant Server as Express Server
    database DB as MongoDB
    actor Donor as Compatible Donor

    Hospital->>Server: POST /api/blood-requests { group, location, radius, units }
    Server->>DB: Find eligible donors in radius (GeoQuery)
    DB-->>Server: Return list of matching donors
    Server->>DB: Create BloodRequest (status: 'open')
    Server->>Donor: Socket emit 'blood-request:new'
    Donor->>Server: PUT /api/blood-requests/:id/respond { action: 'accept' }
    
    note over Server, DB: Atomic check ensures request is open and acceptedDonor is null
    Server->>DB: Update request status = 'responding', acceptedDonor = donorId
    Server->>DB: Create ChatConversation
    Server-->>Donor: Return success (200 OK)
    
    Server->>Hospital: Socket emit 'chat:ready'
    Server->>Donor: Socket emit 'chat:ready'
    Server->>Donor: Socket emit 'blood-request:closed' to OTHER notified donors
```

---

## 6. Identified Issues & Codebase Enhancements

The following issues need to be resolved. You can hand this list to Claude, and it will have the exact file context and instructions required to implement the fixes.

---

### Issue 1: Race Condition on Donor Accept (Critical)
* **Problem**: If two donors click "Accept" on the same request at the same time, the server might process both requests, creating duplicate chats and overriding the accepted donor.
* **Target File**: `Server/controllers/bloodRequestController.js` inside the `respondToRequest` method.
* **Current Code**:
  ```javascript
  let request = await BloodRequest.findById(req.params.id || req.params.requestId);
  if (action === "accept") {
    // ... Direct update without atomic verification
  }
  ```
* **Fix**: Use Mongoose's atomic `findOneAndUpdate` to query by ID and verify the request is still open:
  ```javascript
  const claimedRequest = await BloodRequest.findOneAndUpdate(
    {
      _id: request._id,
      status: "open",
      acceptedDonor: null,
    },
    { status: "responding", acceptedDonor: req.user._id },
    { new: true },
  );
  if (!claimedRequest) {
    return res.status(409).json({
      success: false,
      message: "This request has already been accepted by another donor.",
    });
  }
  ```

---

### Issue 2: Donor No-Show / Reopen Request
* **Problem**: If an accepted donor fails to show up, the requester (hospital/donor SOS issuer) has no way to reset the request and find a new donor.
* **Target Files**:
  * Frontend: `Frontend/src/pages/AppPages.jsx` (inside `ChatPage` component)
  * Backend: `Server/controllers/bloodRequestController.js` (inside `updateRequestStatus` method)
* **Fix**:
  * **Frontend**: Add a "Donor didn't show up" button. This button should display only for the requester when the request status is `responding`. When clicked, it should call `PUT /api/blood-requests/:id/status` with `{ status: "open" }`.
  * **Backend**: In `updateRequestStatus`, check if the status is being set back to `open`. If so:
    1. Set `acceptedDonor = null` and clear the `fulfilledAt` timestamp.
    2. Pull/remove the accept action from the `respondingDonors` array.
    3. Delete the associated `ChatConversation` record.
    4. Set target notifications back to `isRead: false` and update their message to: *"This blood request is open again. Please respond if you can help."*
    5. Emit `blood-request:new` to previously notified donors via Socket.io.
    6. Send a push notification notifying them that the request has reopened.

---

### Issue 3: Deferred Eligibility Update on Donor Dashboard
* **Problem**: When a hospital marks a donation completed, the donor's eligibility status updates on the database, but the donor's open dashboard does not reflect this change without a page reload.
* **Target File**: `Frontend/src/pages/AppPages.jsx` inside the `DonorDashboard` and `EligibilityPage` components.
* **Fix**: Add a listener for the `eligibility:deferred` socket event inside `DonorDashboard` and `EligibilityPage`. When the event is received, immediately refresh the eligibility status UI and show a banner: *"You are deferred for 30 days after your last donation."*

---

### Issue 4: HospitalProfile Dedicated Component
* **Problem**: The hospital profile route currently reuses the donor profile component (`DonorProfile`), which lacks hospital-specific fields like address, city, pincode, license number, and hospital name.
* **Target File**: `Frontend/src/pages/AppPages.jsx` (around the `HospitalProfile` component).
* **Fix**: Replace the wrapper with a dedicated `HospitalProfile` component. Include fields for hospital name, address, city, pincode, phone, and license number. Handle submissions by calling `PUT /api/auth/me` to update these fields on the backend.

---

### Issue 5: Real Forgot Password Flow
* **Problem**: The forgot password page is a placeholder UI and does not have a working backend reset path.
* **Target Files**:
  * Backend: `Server/routes/auth.js` and `Server/controllers/auth.js`
  * Frontend: `Frontend/src/pages/AppPages.jsx` (inside `ForgotPasswordPage`)
* **Fix**:
  * **Backend**:
    * Implement `POST /api/auth/forgot-password` to accept an email, generate a secure token (or numerical code), store it on the user document (with an expiration date), and send it to the user's email.
    * Implement `POST /api/auth/reset-password` to accept the token, email, and new password. Verify the token is valid and has not expired, hash the new password, save it, and clear the reset token fields.
  * **Frontend**: Update `ForgotPasswordPage` to guide the user through a two-step form:
    1. Enter email to request the reset token.
    2. Enter the received token/code along with the new password.

---

### Issue 6: Rename ChatConversation field `hospital` to `requester`
* **Problem**: In `ChatConversation`, the field storing the requesting user is named `hospital`. However, if a donor raises an emergency SOS request, the requester is a donor, not a hospital. This causes naming conflicts.
* **Target Files**:
  * `Server/models/ChatConversation.js`
  * `Server/controllers/chatController.js` and `Server/controllers/bloodRequestController.js`
  * Frontend components referencing the conversation requester details.
* **Fix**: Rename the `hospital` field to `requester` in the schema definitions, update references in the controllers, and update any frontends using the API response.

---

### Issue 7: Empty State UX Improvements
* **Problem**: Screens look empty and broken when lists (like nearby requests, notifications, or history) are empty.
* **Target File**: `Frontend/src/pages/AppPages.jsx`
* **Fix**: Add helpful empty state indicators:
  * `NearbyRequestsPage`: *"No blood requests near you right now. You'll be notified when someone needs help."*
  * `NotificationsPage`: *"You're all caught up. No new notifications."*
  * `DonationHistory`: *"You haven't donated yet. Book your first appointment!"* with a link to `/donor/appointments`.

---

### Issue 8: Display Donor Count in RaiseRequest
* **Problem**: Requesters do not know how many donors are nearby before submitting a request.
* **Target File**: `Frontend/src/pages/AppPages.jsx` inside the `RaiseRequest` component.
* **Fix**: Add a state variable for `donorCount`. Listen to changes in the selected blood group and radius fields. When they change, fetch the donor count:
  * Call `GET /api/donors/count?bloodGroup=...&radiusKm=...`
  * Display the count above the submit button: *"X eligible donors found in this area."*
  * If the count is 0, display a warning banner suggesting the user increase the radius.

---

### Issue 9: Cancel Path for Donor SOS Requests
* **Problem**: Donors who raise emergency SOS requests cannot cancel them if the emergency is resolved.
* **Target File**: `Frontend/src/pages/AppPages.jsx` (inside `RaiseRequest` or on the dashboard).
* **Fix**: When a donor raises an active SOS request, show a "Cancel Request" button on their active card or dashboard. Clicking it should call `PUT /api/blood-requests/:id/status` with `{ status: "cancelled" }` to close the request.

---

### Issue 10: Admin Suspension Reason Logging
* **Problem**: Admins can suspend accounts, but they cannot document the suspension reason, leaving users without context on why their account was suspended.
* **Target Files**:
  * Backend: `Server/controllers/adminController.js` (inside `suspendUser` method) and `Server/models/user.js`
  * Frontend: `Frontend/src/pages/AppPages.jsx` (inside `UserManagement` and `HospitalDashboard` components)
* **Fix**:
  * **Backend**: In `UserModel`, add a `suspensionReason` field. In `suspendUser`, accept `{ reason }` in the request body and save it.
  * **Frontend (Admin)**: When clicking "Suspend" in `UserManagement`, show a modal requesting a reason. Pass this reason in the API request body.
  * **Frontend (Hospital)**: If a hospital dashboard loads and `user.isActive` is false, show a banner: *"Your account has been suspended. Reason: [reason]. Contact support."*

---

### Issue 11: Dedicated Holding Screen for Pending Hospitals
* **Problem**: Hospitals awaiting approval are redirected to the full dashboard, showing error toasts because they lack access to data before approval.
* **Target Files**:
  * `Frontend/src/App.jsx` (inside `RoleRedirect` component)
  * `Frontend/src/pages/AppPages.jsx` (inside `HospitalPendingApproval`)
* **Fix**: In the `RoleRedirect` component, if a hospital user is authenticated but `isApproved` is false, redirect them directly to `/hospital/pending`. The `HospitalPendingApproval` component should show: *"Your account is pending admin approval. You will receive a notification once approved."*

---

### Issue 12: Public Pages Content Update
* **Problem**: `/search` and `/contact` pages are empty placeholders.
* **Target Files**:
  * `Frontend/src/pages/public/PublicSearchPage.jsx`
  * `Frontend/src/pages/public/ContactPage.jsx`
* **Fix**:
  * **PublicSearchPage**: Add a search bar for blood group and city. Call the public search endpoint (`GET /api/donors/search`) and display the results card layout.
  * **ContactPage**: Create a static contact form with fields for name, email, subject, and message. Show a success toast when the user clicks "Send Message" (no backend integration required).

---

### Issue 13: Broadcast Alert Shortcut for Critical Shortages
* **Problem**: Admins see critical blood shortages in the analytics but have to manually type parameters to broadcast an alert.
* **Target File**: `Frontend/src/pages/AppPages.jsx` inside the `AdminDashboard` component.
* **Fix**: Next to each low inventory or critical shortage item, add a "Broadcast Alert" button. When clicked, it should pre-fill the `BroadcastAlerts` state with the corresponding blood group and navigate the admin to `/admin/broadcast`.

---

### Issue 14: Appointment Calendar Sync (ICS Download)
* **Problem**: Booked appointments do not sync with the user's calendar.
* **Target File**: `Frontend/src/pages/AppPages.jsx` inside `BookAppointment`.
* **Fix**: Once an appointment is booked, show a success card/modal containing a "Add to Calendar" button. This button should generate a dynamic `.ics` calendar file containing the hospital name, location, selected date, and time slot, and trigger a download:
  ```javascript
  const generateICS = (appointment) => {
    // Generate text content matching the iCalendar format
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:Blood Donation appointment at ${appointment.hospitalName}`,
      `DTSTART:${appointment.startDateStr}`,
      `DTEND:${appointment.endDateStr}`,
      `DESCRIPTION:Donation time slot: ${appointment.timeSlot}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    // Trigger download
  };
  ```

---

## 7. Guidelines for Modifying Code

* **Preserve Functionality**: Do not overwrite working code. Focus modifications on the target sections.
* **No Route Signature Changes**: Keep all existing API endpoint signatures. Add new routes only where specified (such as the forgot password endpoints).
* **Maintain Real-time Sockets**: Do not change socket event names. Keep `blood-request:new`, `chat:ready`, `chat:message`, and others active.
* **Consistency in Styling**: Follow the existing CSS structure and layout formats.
