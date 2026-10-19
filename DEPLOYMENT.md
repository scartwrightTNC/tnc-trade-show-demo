# Trade Show Demo - Deployment Guide

## Quick Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to project directory
cd trade-show-demo

# Login to Vercel (first time only)
vercel login

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration (Auto-deploy)

1. Push code to GitHub repository
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Vercel will auto-detect settings and deploy
5. Every push to `main` will auto-deploy

### Option 3: Drag & Drop

1. Go to https://vercel.com/new
2. Drag the `trade-show-demo` folder
3. Click "Deploy"

## Post-Deployment

### Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Settings → Domains
3. Add custom domain (e.g., `demo.tnc.com`)
4. Update DNS records as instructed

### Analytics

Vercel Analytics is automatically enabled:
- View at: https://vercel.com/[your-team]/tnc-trade-show-demo/analytics
- Tracks: page views, visitors, demo interactions
- Export data via Vercel dashboard

### QR Code Generation

Generate QR codes for easy mobile access:

```javascript
// Already built into the app - press 'Q' key
// Or use online tool: https://qr-code-generator.com
// Point to: https://your-app.vercel.app
```

## Local Testing

```bash
# Serve locally
npx serve .

# Or with Python
python -m http.server 8000

# Or with Node
npx http-server
```

Open http://localhost:8000 in browser

## Features

### Attraction Screen
- Auto-displays after 60 seconds of inactivity
- Touch/click to enter main menu
- Animated logo and rotating taglines
- Returns automatically when idle

### Navigation
- **Home**: Main category grid
- **Category**: Click to view items
- **Item**: Click to see demo options
- **ESC**: Return to attraction screen
- **H**: Go to home
- **Q**: Show QR code
- **E**: Export analytics data

### Demo Methods
- **Live Links**: Open in new tab (requires internet)
- **Device Demos**: Instructions for iPad/iPhone demos
- **Videos**: Embedded video player (offline capable)
- **Slides**: PowerPoint/PDF viewer (offline capable)

### Offline Mode
- Service worker caches all app files
- Works without internet for offline demos
- Shows "Offline Mode" indicator
- Auto-syncs analytics when connection restored

## Customization

### Update Demo Content

Edit `data/demos.json`:

```json
{
  "id": "unique-id",
  "title": "Demo Title",
  "description": "Description text",
  "icon": "font-awesome-icon",
  "methods": [
    {
      "type": "link|video|slides|device",
      "platform": "Platform Name",
      "label": "Button Label",
      "icon": "icon-name",
      "requiresInternet": true|false,
      "url": "https://...",
      "src": "assets/..."
    }
  ]
}
```

### Update Attraction Screen

Edit `js/attract-mode.js`:

```javascript
this.taglines = [
    'Your Custom Tagline 1',
    'Your Custom Tagline 2',
    // ...
];
```

### Update Colors

Edit CSS variables in `css/main.css`:

```css
:root {
    --mql-navy: #0a2540;
    --mql-blue: #2b7de9;
    --mql-green: #28a745;
    /* ... */
}
```

## Adding Demo Content

### Videos
1. Add video files to `assets/demos/`
2. Reference in `demos.json`:
   ```json
   {
     "type": "video",
     "src": "assets/demos/my-video.mp4"
   }
   ```

### Presentations
1. Add PDF/PPT to `assets/demos/`
2. Reference in `demos.json`:
   ```json
   {
     "type": "slides",
     "src": "assets/demos/my-slides.pdf"
   }
   ```

### Images
1. Add to `assets/images/`
2. Update HTML or CSS references

## Troubleshooting

### Service Worker Not Working
- Ensure HTTPS (Vercel provides this)
- Check browser console for errors
- Clear cache and hard reload

### Videos Not Playing
- Check file format (MP4 recommended)
- Ensure files are in `assets/demos/`
- Check file size (compress if > 50MB)

### Analytics Not Tracking
- Check browser console for errors
- Verify Vercel Analytics is enabled
- Check network tab for analytics requests

## Support

For issues or questions:
- Check browser console for errors
- Review Vercel deployment logs
- Contact development team

## URLs

- **Production**: https://tnc-trade-show-demo.vercel.app
- **Analytics**: https://vercel.com/[team]/tnc-trade-show-demo/analytics
- **Logs**: https://vercel.com/[team]/tnc-trade-show-demo/logs
