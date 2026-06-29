# 这不是木马 (ilovedingziwei)

A romantic, interactive love letter website with daily task tracking and photo gallery. Built with vanilla HTML/CSS/JavaScript and serverless AWS backend.

🌐 **Live:** [ilovedingziwei.com](https://ilovedingziwei.com)

## Features

✨ **Interactive Elements**
- 💌 Animated SVG envelope with modal containing Chinese love letter
- 🎵 Background music player with toggle button
- 📸 Infinite camera roll carousel (14+ images, Swiper library)
- 📅 Interactive daily calendar with month view
- 🖼️ Daily photo upload modal with status tracking
- 📱 Fully responsive design (mobile, tablet, desktop)

🎨 **Design**
- Pink gradient theme (`#ffb6d9` → `#ffc0e0`)
- Smooth animations and transitions
- CSS Grid & Flexbox layout
- Modular component architecture

💾 **Persistence**
- AWS Lambda serverless backend
- S3-based text file tracking (completions)
- Pre-signed URL uploads
- Daily completion markers
- No database costs (~$1.50/month)

## Project Structure

```
ilovedingziwei/
├── index.html              # Main page (all UI elements)
├── style.css               # Responsive styling & animations
├── music.mp3               # Background music
├── CNAME                   # GitHub Pages custom domain
├── .gitignore              # Git ignore rules
│
├── js/                     # Modular JavaScript modules
│   ├── api.js              # Lambda API calls (upload, completions)
│   ├── calendar.js         # Daily calendar & upload handling
│   ├── music.js            # Music player controls
│   ├── carousel.js         # Camera roll (Swiper)
│   └── modals.js           # Modal interactions (envelope, photo, upload)
│
├── assets/                 # Static images
│   ├── 114.JPG - 128.JPG   # Camera roll photos (15 images)
│   └── ...
│
├── lambda/                 # AWS Lambda backend
│   ├── deploy.sh           # One-command deployment script
│   ├── uploadFunc/         # Multi-action Lambda (upload, tracking, completions)
│   │   ├── index.js
│   │   └── package.json
│   ├── README.md           # Lambda quick start
│   ├── DEPLOYMENT.md       # Detailed deployment guide
│   └── QUICK-REFERENCE.md  # Deployment reference card
│
└── README.md (this file)
```

## Frontend Stack

- **HTML5** — Semantic structure
- **CSS3** — Flexbox, Grid, animations, responsive breakpoints
  - Mobile: 480px
  - Tablet: 768px
  - Desktop: 1024px+
- **Vanilla JavaScript** — No frameworks, modular design
- **Swiper 11** — Carousel library (via CDN)

### JavaScript Modules

| File | Purpose |
|------|---------|
| `js/api.js` | Lambda API calls (`fetchCompletedDays`, `uploadImage`) |
| `js/calendar.js` | Daily calendar grid, day selection, completion tracking |
| `js/music.js` | Background music toggle with animations |
| `js/carousel.js` | Camera roll infinite carousel |
| `js/modals.js` | Envelope letter, photo zoom, upload modal interactions |

**Note:** Scripts load in global scope (no ES6 imports). Load order: `api.js` → `music.js` → `carousel.js` → `modals.js` → `calendar.js`

## Backend Stack

**AWS Services**
- **Lambda** (Node.js 18.x) — Single multi-action function
  - `uploadFunc` handles all operations:
    - `getPresignedUrl` — Generate S3 pre-signed URL for direct uploads
    - `recordUpload` — Write completion to S3 tracking file
    - `getCompletedDays` — Read tracking file, return completed days array
- **API Gateway** (REST)
  - `POST /upload` → uploadFunc (routes via `action` parameter)
- **S3** (ap-east-1)
  - Image storage: `dingziwei-app-bucket/uploads/`
  - Tracking files: `dingziwei-app-bucket/tracking/YYYY-MM.txt`
- **IAM** — Role with S3 permissions

### Data Format

Tracking files stored at `s3://dingziwei-app-bucket/tracking/2026-06.txt`

```
29|s3://dingziwei-app-bucket/uploads/1782769790584-abc123.jpg
28|s3://dingziwei-app-bucket/uploads/1782683390000-xyz789.jpg
```

Format: `day|s3-image-path` (one line per uploaded day)

## Deployment

### Frontend (GitHub Pages)

```bash
# Just push to main branch
git push origin main
# Site auto-deploys to ilovedingziwei.com (via CNAME)
```

**DNS Setup (GoDaddy)**
- CNAME record: `ilovedingziwei.com` → `jamesanse.github.io`
- File: `CNAME` (contains domain name)

### Backend (AWS Lambda)

```bash
cd lambda
./deploy.sh
```

**What deploy.sh does:**
1. Creates/reuses IAM role `dingziwei-lambda-role`
2. Installs npm deps, zips, deploys `uploadFunc`
3. Creates API Gateway `dingziwei-api` with `/upload` endpoint
4. Configures Lambda integration and method routing
5. Enables CORS on all endpoints
6. Deploys to `prod` stage
7. Outputs API endpoint URL

**Requirements**
- AWS CLI configured with credentials
- Node.js (for Lambda deps)
- Bash shell

## Cost

**Monthly Breakdown**
| Service | Cost |
|---------|------|
| Lambda (free tier covers) | ~$0 |
| S3 (tracking files <1KB/month) | ~$0.01 |
| API Gateway (100 calls/month) | ~$0.03 |
| **Total** | **~$0.04/month** |

(Compared to RDS: ~$15/month)

## Development

### Local Testing

1. **Frontend:** Open `index.html` in browser
2. **API calls:** Use curl or Postman
   ```bash
   curl -X POST https://[API_ID].execute-api.ap-east-1.amazonaws.com/prod/upload \
     -H "Content-Type: application/json" \
     -d '{"action":"getPresignedUrl"}'
   ```

### Environment Variables

All configs are hardcoded (simple project):
- API endpoint in `js/api.js`
- Timezone: `Asia/Shanghai` (China)
- Region: `ap-east-1` (AWS Hong Kong)

## Key Technical Decisions

| Decision | Why |
|----------|-----|
| Vanilla JS, no frameworks | Faster load, fewer dependencies |
| S3 text files vs database | Cost savings ($1.50/mo vs $15/mo) |
| Serverless (Lambda) | No server maintenance, scales automatically |
| Modular JS files | Better code organization, easier debugging |
| Pre-signed URLs | Secure direct S3 uploads, no backend processing |
| Global script scope | Simple for small project, explicit load order |

## Future Enhancements

- [ ] Convert to ES6 modules for explicit imports
- [ ] Add date range filtering for calendar
- [ ] Image compression before upload
- [ ] Statistics dashboard
- [ ] Mobile app version

## License

Personal project. All rights reserved.

---

**Last Updated:** 2026-06-29
