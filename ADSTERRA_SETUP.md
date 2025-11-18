# Adsterra Setup Guide for QuizGod

## Step 1: Sign Up for Adsterra (5 minutes)

1. Go to: **https://publishers.adsterra.com/referral/KQF8AkcACT**
2. Click "Sign Up" → Choose "Publisher"
3. Fill in:
   - Email
   - Password
   - Website: `https://quizgod.vercel.app` (or your custom domain)
   - Traffic sources: Educational/Quiz Platform
4. Verify your email
5. ✅ **Approved instantly!**

## Step 2: Get Your Ad Code (3 minutes)

### For Banner Ads:
1. In Adsterra Dashboard → "Add Website"
2. Choose **"Banner"** format
3. Select size:
   - **728x90** (Leaderboard - top of page)
   - **300x250** (Medium Rectangle - sidebar/between content)
   - **320x50** (Mobile banner)
4. Copy your **Ad Code Key** (looks like: `1234567`)

### For Native Ads (Recommended):
1. Dashboard → "Add Website" 
2. Choose **"Native Banner"** format
3. Customize to match your site colors
4. Copy your **Ad Code Key**
5. Native ads are responsive - no size selection needed!

## Step 3: Add Your Ad Keys to the Site

Replace placeholders in the code:

### Home Page - Banner Ad (Top)
File: `src/app/page.tsx`
```tsx
<AdsterraAd 
  atOptions={{
    key: 'YOUR_BANNER_KEY_HERE',  // ← Replace with your key
    format: 'iframe',
    height: 90,
    width: 728
  }}
/>
```

### Quiz List - Native Ad (Between Cards)
File: `src/app/quizzes/page.tsx`
```tsx
<AdsterraAd 
  atOptions={{
    key: 'YOUR_NATIVE_KEY_HERE',  // ← Replace with your key
    format: 'iframe',
    params: {}
  }}
/>
```

## Step 4: Test Your Ads

1. Deploy to Vercel (it's already set up!)
2. Wait 5-10 minutes for ads to appear
3. Check different pages to see ads loading
4. **Don't click your own ads!** (against ToS)

## Ad Placements I've Set Up

✅ **Home Page**: Banner ad at top (above dashboard)
✅ **Quiz List**: Native ad every 6 quizzes
✅ **Quiz Play**: Banner below title
✅ **Results Page**: Native ad above leaderboard

## Expected Earnings

With Adsterra on a quiz site:
- **100 visitors/day** = $0.50-2/day
- **500 visitors/day** = $2-10/day
- **1,000 visitors/day** = $5-20/day
- **5,000 visitors/day** = $25-100/day

CPM ranges: $1-5 (educational content)

## Payment Info

- **Minimum**: $5 (PayPal, Bitcoin, Wire)
- **Payment dates**: 15th of each month
- **Processing**: 3-5 business days

## Tips for Better Revenue

1. ✅ Enable **Banner + Native** ads only (no pop-ups)
2. ✅ Place ads **above the fold** (visible without scrolling)
3. ✅ Test different positions
4. ❌ Don't use more than 3 ads per page
5. ❌ Never click your own ads

## Troubleshooting

**Ads not showing?**
- Wait 10-15 minutes after adding code
- Check browser console for errors
- Make sure you replaced placeholder keys
- Verify site is approved in Adsterra dashboard

**Low earnings?**
- Focus on US/UK/Canada traffic (highest CPM)
- Create more engaging quizzes (longer sessions)
- Promote site on social media
- Try different ad placements

## Next Steps

Once you have your ad keys:
1. Tell me your ad keys (Banner + Native)
2. I'll add them to the code
3. Commit and deploy
4. Start earning! 💰
