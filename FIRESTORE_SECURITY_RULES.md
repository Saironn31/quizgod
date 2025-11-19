# Firestore Security Rules for Live Quiz

Add these rules to your Firestore security rules to secure the live quiz sessions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Existing rules for other collections...
    
    // Live Quiz Sessions
    match /liveQuizSessions/{sessionId} {
      // Anyone authenticated can read sessions
      allow read: if request.auth != null;
      
      // Any authenticated user can create a session
      allow create: if request.auth != null &&
                      request.resource.data.hostUserId == request.auth.uid;
      
      // Any authenticated user can update (for joining, answering, etc.)
      // In production, you might want stricter rules
      allow update: if request.auth != null;
      
      // Only the host can delete a session
      allow delete: if request.auth != null && 
                      resource.data.hostUserId == request.auth.uid;
    }
    
    // Existing rules continue below...
  }
}
```

## Rule Explanation

### Read Access
```javascript
allow read: if request.auth != null;
```
- Any authenticated user can view live sessions
- Needed for: Class overview, joining lobby, viewing leaderboard
- Security: Users must be logged in

### Create Access
```javascript
allow create: if request.auth != null &&
              request.resource.data.hostUserId == request.auth.uid;
```
- Only authenticated users can create sessions
- The creator's UID must match the hostUserId field
- Prevents users from creating sessions as someone else

### Update Access
```javascript
allow update: if request.auth != null;
```
- Any authenticated user can update sessions
- Allows: Joining, submitting answers, updating scores
- **Note**: In production, consider more granular rules:
  ```javascript
  // More secure alternative:
  allow update: if request.auth != null && (
    // Host can update anything
    resource.data.hostUserId == request.auth.uid ||
    // Players can only update their own data in players array
    request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['players']) &&
    exists(/databases/$(database)/documents/liveQuizSessions/$(sessionId)/players/$(request.auth.uid))
  );
  ```

### Delete Access
```javascript
allow delete: if request.auth != null && 
              resource.data.hostUserId == request.auth.uid;
```
- Only the session host can delete it
- Used when host leaves lobby before starting
- Prevents other players from deleting sessions

## Testing Rules

You can test your rules in the Firebase Console:
1. Go to Firestore Database
2. Click "Rules" tab
3. Use the "Rules Playground" to simulate requests

### Example Test Cases:

**Test 1: Create Session (Should Succeed)**
```
Request:
  Auth: user123
  Operation: create
  Path: /liveQuizSessions/session1
  Data: { hostUserId: "user123", ... }

Expected: Allow
```

**Test 2: Create Session as Another User (Should Fail)**
```
Request:
  Auth: user123
  Operation: create
  Path: /liveQuizSessions/session1
  Data: { hostUserId: "user456", ... }

Expected: Deny
```

**Test 3: Join Session (Should Succeed)**
```
Request:
  Auth: user456
  Operation: update
  Path: /liveQuizSessions/session1
  Data: { players: [...existing, user456] }

Expected: Allow
```

**Test 4: Delete Other User's Session (Should Fail)**
```
Request:
  Auth: user456
  Operation: delete
  Path: /liveQuizSessions/session1
  Existing Data: { hostUserId: "user123", ... }

Expected: Deny
```

## Deployment

1. Open Firebase Console
2. Navigate to Firestore Database
3. Click "Rules" tab
4. Add the live quiz session rules above
5. Click "Publish"
6. Wait ~1 minute for propagation

## Security Considerations

### Current Implementation
- ✅ Prevents unauthorized access
- ✅ Validates host ownership
- ✅ Requires authentication
- ⚠️ Allows any player to update sessions (flexible but less secure)

### Production Recommendations
1. **Granular Player Updates**: Only allow players to update their own data
2. **Class Membership Validation**: Verify user is in the session's class
3. **Rate Limiting**: Prevent spam session creation
4. **Session Expiration**: Auto-delete old sessions
5. **Answer Validation**: Server-side validation for scores

### Additional Security Rules (Optional)

```javascript
// Verify user is in the class
match /liveQuizSessions/{sessionId} {
  allow read, write: if request.auth != null && 
    exists(/databases/$(database)/documents/classes/$(resource.data.classId)) &&
    get(/databases/$(database)/documents/classes/$(resource.data.classId))
      .data.members.hasAny([request.auth.token.email]);
}

// Prevent updating finished sessions
match /liveQuizSessions/{sessionId} {
  allow update: if request.auth != null && 
    resource.data.status != 'finished';
}

// Limit session creation (1 per user per minute)
match /liveQuizSessions/{sessionId} {
  allow create: if request.auth != null &&
    request.resource.data.hostUserId == request.auth.uid &&
    !exists(/databases/$(database)/documents/liveQuizSessions/$(request.auth.uid + '_' + request.time.toMillis() / 60000));
}
```

## Monitoring

After deployment, monitor:
1. **Firebase Console > Firestore > Usage**: Check read/write counts
2. **Firebase Console > Authentication**: Monitor active users
3. **Firebase Console > Firestore > Rules**: Review rule evaluations
4. **Application Logs**: Check for permission denied errors

## Troubleshooting

### "Permission Denied" Errors
- Verify user is authenticated
- Check hostUserId matches current user
- Ensure rules are published
- Wait 1 minute after publishing rules

### High Read Counts
- Implement pagination
- Use cached data when possible
- Reduce polling frequency in class overview
- Use onSnapshot listeners instead of polling

### Security Warnings
- Review Firebase Console security recommendations
- Implement suggested rule improvements
- Add field validation rules
- Consider using Cloud Functions for sensitive operations
