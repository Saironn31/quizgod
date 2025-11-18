# Premium Subscription System

## Overview
The quiz platform now has a premium subscription system that restricts access to:
- **Classes** - Create and join classes
- **AI Quiz Generator** - Generate quizzes using AI

## Admin Account Setup

### Creating Your Admin Account

1. **Sign up normally** through the website
2. **Get your User ID (UID)**:
   - Go to Firebase Console: https://console.firebase.google.com
   - Select your project
   - Go to Authentication > Users
   - Find your email and copy the User UID

3. **Make yourself admin** using Firebase Console:
   - Go to Firestore Database
   - Navigate to `users` collection
   - Find the document with your UID
   - Click "Edit document"
   - Add a new field:
     - **Field**: `role`
     - **Type**: string
     - **Value**: `admin`
   - Click "Update"

4. **Refresh the website** - You should now see "Admin Panel" in the sidebar

## Admin Panel Features

### Access
- URL: `/admin`
- Only accessible by users with `role: 'admin'`

### Capabilities
1. **View all users** - See complete user list with:
   - Name, username, email
   - User UID (truncated)
   - Premium status (Free/Premium/Admin)
   - Account creation date

2. **Grant Premium** - Click "Grant Premium" to give a user premium access
3. **Revoke Premium** - Click "Revoke Premium" to remove premium access
4. **Search Users** - Search by name, email, username, or UID

### Statistics
- Total users count
- Premium users count
- Free users count

## Premium Features

### Classes (`/classes`)
**What it includes:**
- Create unlimited classes
- Join classes with unique codes
- Manage class members
- Share quizzes within classes
- View class leaderboards
- Track class performance

**Access:** Premium users only

### AI Quiz Generator (`/quiz-creator`)
**What it includes:**
- Upload PDF, Word, or PowerPoint documents
- Generate quizzes automatically from documents
- AI-powered question generation
- Document preview and chat
- Customizable number of questions

**Access:** Premium users only (Manual quiz creation remains free)

## User Roles

### User (Default)
- Access to basic features
- Manual quiz creation
- Take quizzes
- View personal stats
- Add friends
- Access subjects

### Premium User
- All User features
- Create/join classes
- AI quiz generator
- No ads (future feature)

### Admin
- All Premium features
- Access to Admin Panel
- Grant/revoke premium access
- View all users
- Cannot have premium revoked

## Technical Details

### Database Schema

#### User Document (`users/{uid}`)
```javascript
{
  uid: string,
  email: string,
  name: string,
  username?: string,
  isPremium?: boolean,  // true = premium access
  role?: 'user' | 'admin',  // 'admin' = admin access
  createdAt: Date,
  updatedAt: Date,
  // ... other fields
}
```

### Functions

#### Check Premium Status
```typescript
import { isUserPremium } from '@/lib/firestore';

const premium = await isUserPremium(uid);
// Returns true if user has isPremium: true OR role: 'admin'
```

#### Check Admin Status
```typescript
import { isUserAdmin } from '@/lib/firestore';

const admin = await isUserAdmin(uid);
// Returns true if user has role: 'admin'
```

#### Grant/Revoke Premium (Admin only)
```typescript
import { setUserPremium } from '@/lib/firestore';

await setUserPremium(adminUid, targetUid, true);  // Grant
await setUserPremium(adminUid, targetUid, false); // Revoke
```

#### Get All Users (Admin only)
```typescript
import { getAllUsers } from '@/lib/firestore';

const users = await getAllUsers(adminUid);
```

## Premium Gates

### Classes Page
- Checks premium status on page load
- Shows premium upgrade message if not premium
- Blocks access to class creation/joining

### Quiz Creator AI Mode
- AI button shows "PRO" badge for non-premium users
- Alert shown when clicking AI mode without premium
- Manual mode remains accessible to all users

## Future Enhancements

### Payment Integration
To add actual payment processing:
1. Integrate Stripe/PayPal
2. Add subscription plans
3. Automatic premium activation on payment
4. Subscription renewal handling
5. Payment history

### Additional Premium Features
- Ad-free experience
- Priority support
- Custom themes
- Advanced analytics
- Export data
- API access

## Support

For issues or questions:
1. Check Firebase Console for user data
2. Verify role and isPremium fields are set correctly
3. Check browser console for errors
4. Ensure user is logged in with correct account
