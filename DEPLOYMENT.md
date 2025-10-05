# Deployment Guide - HLD Designer

## Deploy to Vercel

### Prerequisites
- A Vercel account (sign up at https://vercel.com)
- Firebase project with Firestore and Authentication enabled
- Your Firebase configuration credentials

### Step 1: Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### Step 2: Configure Environment Variables in Vercel

You need to add the following environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important:** Add these variables for all environments (Production, Preview, and Development)

### Step 3: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository (GitHub, GitLab, or Bitbucket)
3. Configure your project:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variables (see Step 2)
5. Click "Deploy"

### Step 4: Deploy via Vercel CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# During deployment, you'll be prompted to:
# 1. Link to existing project or create new
# 2. Confirm project settings
```

### Step 5: Configure Firebase for Production

1. Go to Firebase Console → Authentication → Settings
2. Add your Vercel domain to "Authorized domains":
   - `your-project.vercel.app`
   - Any custom domains you configure

3. Update Firestore Security Rules if needed

### Continuous Deployment

Once connected to Git, Vercel will automatically:
- Deploy on every push to main/master branch (Production)
- Create preview deployments for pull requests
- Run build checks before deploying

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `my-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc` |

### Troubleshooting

**Build fails:**
- Check that all dependencies are in `package.json`
- Ensure Node.js version is compatible (check `package.json` engines field)

**Firebase not working:**
- Verify all environment variables are set correctly in Vercel
- Check that your Vercel domain is added to Firebase authorized domains
- Ensure Firestore and Authentication are enabled in Firebase Console

**404 on routes:**
- The `vercel.json` rewrites configuration handles SPA routing
- Ensure `vercel.json` is committed to your repository

### Custom Domain

1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Add the custom domain to Firebase authorized domains

## Local Development

```bash
# Install dependencies
npm install

# Create .env file from .env.example
cp .env.example .env

# Add your Firebase credentials to .env

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Firebase Setup Guide](https://firebase.google.com/docs/web/setup)
