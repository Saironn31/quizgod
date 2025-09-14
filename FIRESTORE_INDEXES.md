# Firebase Firestore Index Configuration

This document provides the required Firestore indexes to fix the query errors in the QuizGod application.

## Required Indexes

Based on the error messages, the following composite indexes need to be created:

### 1. Subjects Collection Index
**Collection**: `subjects`
**Fields**: 
- `classId` (Ascending)
- `createdAt` (Descending)
- `__name__` (Descending)

**Query**: Used for getting class subjects ordered by creation date

### 2. Quizzes Collection - Personal Quizzes Index
**Collection**: `quizzes`
**Fields**:
- `isPersonal` (Ascending)
- `userId` (Ascending) 
- `createdAt` (Descending)
- `__name__` (Descending)

**Query**: Used for getting personal quizzes for a specific user

### 3. Quizzes Collection - Class Quizzes Index
**Collection**: `quizzes`
**Fields**:
- `classId` (Ascending)
- `createdAt` (Descending)
- `__name__` (Descending)

**Query**: Used for getting quizzes belonging to a specific class

## How to Create Indexes

### Option A: Using the Console Links (Fastest)
Click on these generated links from the error messages:

1. **Subjects Index**: 
   ```
   https://console.firebase.google.com/v1/r/project/quizgod-app/firestore/inde...HMvaW5kZXhlcy9fEAEaCwoHY2xhc3NJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI
   ```

2. **Personal Quizzes Index**:
   ```
   https://console.firebase.google.com/v1/r/project/quizgod-app/firestore/inde...Cgppc1BlcnNvbmFsEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
   ```

3. **Class Quizzes Index**:
   ```
   https://console.firebase.google.com/v1/r/project/quizgod-app/firestore/inde...cy9pbmRleGVzL18QARoLCgdjbGFzc0lkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
   ```

### Option B: Manual Creation via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `quizgod-app`
3. Navigate to **Firestore Database** → **Indexes** 
4. Click **Create Index**
5. Configure each index as specified above

### Option C: Using Firebase CLI
Create a `firestore.indexes.json` file and deploy:

```json
{
  "indexes": [
    {
      "collectionGroup": "subjects",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "classId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "quizzes", 
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "isPersonal", "order": "ASCENDING"},
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "quizzes",
      "queryScope": "COLLECTION", 
      "fields": [
        {"fieldPath": "classId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

Then deploy with:
```bash
firebase deploy --only firestore:indexes
```

## Index Creation Time
- Simple indexes: 2-5 minutes
- Composite indexes: 5-15 minutes depending on data size
- You can monitor progress in the Firebase Console

## Verification
After creating indexes, verify they work by:
1. Refreshing the quizzes page
2. Checking browser console for errors
3. Testing class navigation and quiz creation

## Notes
- Indexes are created asynchronously
- The app will show errors until indexes are fully built
- Consider implementing loading states and error handling for better UX during index creation