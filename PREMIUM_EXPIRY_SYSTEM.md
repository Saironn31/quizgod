# Premium Subscription Expiry System

## Overview
The premium subscription system now includes automatic expiry management that changes the user's premium status to "pending" after 30 days from their subscription date. This preserves user data while restricting access to premium features until they renew.

## Key Features

### 1. Premium Status States
- **`active`**: User has active premium subscription with full access
- **`pending`**: Subscription expired (>30 days), data preserved but no access
- **`none`**: No premium subscription

### 2. New Fields in FirebaseUser Interface
```typescript
interface FirebaseUser {
  // ... existing fields
  isPremium?: boolean;
  premiumStatus?: 'active' | 'pending' | 'none';
  subscriptionDate?: Date; // Date when premium was activated
  // ... other fields
}
```

### 3. Expiry Check Function
`checkAndUpdatePremiumExpiry(uid: string)` - Located in `src/lib/firestore.ts`
- Automatically called when user logs in (via AuthContext)
- Checks if 30+ days have passed since subscriptionDate
- If expired: sets `isPremium: false` and `premiumStatus: 'pending'`
- Admin users are exempt from expiry checks

### 4. Premium Access Check Pattern
Updated from simple boolean check to include premiumStatus:
```typescript
// Old pattern
userProfile?.isPremium || userProfile?.role === 'admin'

// New pattern
userProfile?.role === 'admin' || (userProfile?.isPremium && userProfile?.premiumStatus === 'active')
```

## Files Modified

### Core Logic
1. **`src/lib/firestore.ts`**
   - Added `premiumStatus` and `subscriptionDate` to FirebaseUser interface
   - Modified `isUserPremium()` to check both isPremium and premiumStatus
   - Added `checkAndUpdatePremiumExpiry()` function
   - Updated `setUserPremium()` to set subscription date and status

### Authentication
2. **`src/contexts/AuthContext.tsx`**
   - Added expiry check on user login
   - Updated `isPremiumUser()` to verify premiumStatus is 'active'

### Payment Webhooks
3. **`src/app/api/webhook/fastspring/route.ts`**
   - Sets `premiumStatus: 'active'` and `subscriptionDate` when granting premium
   - Sets `premiumStatus: 'none'` when removing premium

4. **`src/app/api/paddle-webhook/route.ts`**
   - Sets `premiumStatus: 'active'` and `subscriptionDate` when granting premium
   - Sets `premiumStatus: 'none'` when removing premium

### UI Components
5. **`src/components/PrivateChat.tsx`** - Chat premium check updated
6. **`src/components/ClassChat.tsx`** - Chat premium check updated
7. **`src/app/analytics/page.tsx`** - Analytics premium gate updated
8. **`src/app/profile/page.tsx`** - Shows pending status with yellow ⏳ emoji
9. **`src/app/quizzes/[id]/page.tsx`** - Premium feature checks updated
10. **`src/app/create/page.tsx`** - Premium banner checks updated
11. **`src/app/quiz-creator/page.tsx`** - Premium banner checks updated
12. **`src/app/page.tsx`** - Home page premium checks updated

## How It Works

### On User Login
1. User signs in via Firebase Auth
2. `onAuthStateChanged` triggers in AuthContext
3. `checkAndUpdatePremiumExpiry()` is called
4. If subscription is >30 days old:
   - `isPremium` set to `false`
   - `premiumStatus` set to `'pending'`
5. User profile is fetched with updated status

### On Payment Success
1. Webhook receives payment confirmation
2. User document updated with:
   ```typescript
   {
     isPremium: true,
     premiumStatus: 'active',
     subscriptionDate: new Date()
   }
   ```

### Premium Access Check
Components check: `userProfile?.role === 'admin' || (userProfile?.isPremium && userProfile?.premiumStatus === 'active')`

### Visual Indicators
- ✅ Active (green) - Premium active
- ⏳ Pending (yellow) - Premium expired, data saved
- ❌ Not Active (red) - No premium subscription

## Data Preservation
When premium expires to "pending":
- All user quiz records remain in database
- User data is NOT deleted
- Analytics data is preserved
- User cannot access premium features
- User can reactivate by purchasing again

## Admin Exemption
Users with `role: 'admin'` are:
- Exempt from expiry checks
- Always have premium access
- Not affected by subscriptionDate

## Future Considerations
- Add email notification before expiry (e.g., at 25 days)
- Add grace period option (e.g., 3 days)
- Add reactivation flow that preserves old data
- Add subscription renewal webhook handling
- Add manual renewal/extend option for admins
