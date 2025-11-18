# AdSense Integration Guide

## Step 1: Sign Up for Google AdSense
1. Go to https://www.google.com/adsense
2. Sign up with your Google account
3. Fill in your website details (quizgod.vercel.app or your custom domain)
4. Submit for review (takes 1-2 weeks)

## Step 2: Get Your Publisher ID
Once approved:
1. Go to AdSense Dashboard
2. Find your Publisher ID (format: `ca-pub-1234567890123456`)
3. Replace `ca-pub-XXXXXXXXXXXXXXXX` in these files:
   - `src/components/AdSense.tsx` (line 32)
   - `src/app/layout.tsx` (line 40)

## Step 3: Create Ad Units
1. In AdSense Dashboard, go to "Ads" → "By ad unit"
2. Create different ad units:
   - **Display Ad** (responsive) - for sidebars
   - **In-article Ad** - for content areas
   - **Multiplex Ad** - for related content sections

3. Copy each ad slot ID (format: `1234567890`)

## Step 4: Add Ads to Your Pages

### Example 1: Banner Ad (Top of page)
```tsx
import AdSense from '@/components/AdSense';

<AdSense 
  adSlot="YOUR_AD_SLOT_ID"
  adFormat="horizontal"
  style={{ display: 'block', textAlign: 'center', minHeight: '100px' }}
/>
```

### Example 2: Sidebar Ad
```tsx
<AdSense 
  adSlot="YOUR_AD_SLOT_ID"
  adFormat="vertical"
  style={{ display: 'block', minHeight: '250px' }}
/>
```

### Example 3: In-feed Ad (between quiz cards)
```tsx
<AdSense 
  adSlot="YOUR_AD_SLOT_ID"
  adFormat="fluid"
  style={{ display: 'block', minHeight: '200px' }}
/>
```

## Recommended Ad Placements for Your Quiz Site

1. **Home Page**: 
   - Top banner (leaderboard)
   - Between quiz cards
   - Sidebar (if you add one)

2. **Quiz Play Page**: 
   - Below quiz title
   - Between questions (every 5 questions)
   - After quiz completion

3. **Quiz Results Page**:
   - Above results
   - Below leaderboard

4. **Create Quiz Page**:
   - Sidebar ad

## Best Practices

1. **Don't overdo it**: 2-3 ads per page max
2. **Mobile-friendly**: Use responsive ad formats
3. **Clear separation**: Keep ads visually separate from content
4. **Follow policies**: Never click your own ads or encourage clicks
5. **Test different placements**: Monitor which perform best

## Alternative Ad Networks (if AdSense rejects you)

- **Media.net**: Good CPM, contextual ads
- **PropellerAds**: Push notifications, banners
- **Ezoic**: AI-powered optimization (requires 10K monthly visits)
- **Mediavine**: Premium network (requires 50K sessions/month)
- **AdThrive**: High-paying (requires 100K pageviews/month)

## Expected Revenue

With quiz sites:
- 1,000 daily visitors = $5-20/day
- 5,000 daily visitors = $25-100/day  
- 10,000 daily visitors = $50-250/day

Actual revenue depends on:
- Traffic geography (US/UK/Canada = highest)
- Niche (education = medium CPM)
- Ad placement
- Click-through rate (CTR)
