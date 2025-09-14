# Firebase Storage CORS Configuration Guide

## Issue
Profile picture uploads are failing with CORS errors when the app is deployed on Vercel (quizgod-swart.vercel.app).

## Root Cause
Firebase Storage by default doesn't allow cross-origin requests from domains other than localhost during development. The Vercel deployment domain needs to be added to the Firebase Storage CORS configuration.

## Solution

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `quizgod-app`
3. Navigate to **Storage** in the left sidebar

### Step 2: Configure CORS Rules

#### Option A: Using Firebase CLI (Recommended)
1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Create a `cors.json` file in your project root:
   ```json
   [
     {
       "origin": ["https://quizgod-swart.vercel.app", "http://localhost:3000"],
       "method": ["GET", "POST", "PUT", "DELETE"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

4. Deploy the CORS configuration:
   ```bash
   gsutil cors set cors.json gs://quizgod-app.firebasestorage.app
   ```

#### Option B: Using Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `quizgod-app`
3. Navigate to **Cloud Storage** > **Buckets**
4. Find your bucket: `quizgod-app.firebasestorage.app`
5. Click on the bucket name
6. Go to the **Permissions** tab
7. Click **Edit CORS configuration**
8. Add the following configuration:
   ```json
   [
     {
       "origin": ["https://quizgod-swart.vercel.app", "http://localhost:3000"],
       "method": ["GET", "POST", "PUT", "DELETE"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

### Step 3: Verify Configuration
1. Wait 5-10 minutes for the changes to propagate
2. Try uploading a profile picture from the deployed app
3. Check the browser's Network tab for any remaining CORS errors

### Step 4: Add Future Domains
If you deploy to additional domains (like a custom domain), add them to the `origin` array in the CORS configuration.

## Security Notes
- Only add trusted domains to the CORS configuration
- Consider using wildcard patterns carefully (e.g., `*.vercel.app` would allow all Vercel subdomains)
- Review and update CORS settings when changing deployment domains

## Testing
After configuring CORS:
1. Open the deployed app: https://quizgod-swart.vercel.app
2. Login with a test account
3. Try uploading a profile picture
4. Verify the upload completes without CORS errors

## Troubleshooting
- If CORS errors persist, clear browser cache and try again
- Check that the domain in the CORS config exactly matches the deployed domain
- Verify the Firebase Storage bucket name is correct
- Ensure the Firebase project is properly linked to your app