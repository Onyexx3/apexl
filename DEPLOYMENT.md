# Namecheap Shared Hosting Deployment Guide

## Overview
This guide explains how to deploy your React + Express application on Namecheap shared hosting using cPanel File Manager, avoiding common 503 Service Unavailable errors.

## Pre-Deployment Checklist

### 1. Build Project Locally
```bash
# Build for Namecheap hosting
npm run build:namecheap
```

This creates:
- `dist/index.js` - Your bundled Express server
- `dist/public/` - Your React build files

### 2. Verify Build Output
Ensure these files exist:
```
dist/
├── index.js          (147KB+ bundled server)
└── public/
    ├── index.html
    ├── assets/
    │   ├── index-*.js
    │   └── index-*.css
    └── favicon.png
```

## Deployment Steps

### Step 1: Prepare Environment Variables

1. Copy `.env.production` to `.env`
2. Update with your actual values:
   ```env
   DATABASE_URL='your_production_database_url'
   NODE_ENV=production
   SESSION_SECRET='your_random_secret_string'
   ```

### Step 2: Upload Files via cPanel File Manager

1. **Login to cPanel**
2. **Open File Manager**
3. **Navigate to your hosting directory** (usually `/home/username/public_html` or a subdirectory)

#### Upload Structure:
```
/home/username/
└── your_app_directory/          # Create this directory
    ├── dist/
    │   ├── index.js            # Main server file
    │   └── public/             # React build
    │       ├── index.html
    │       ├── assets/
    │       └── favicon.png
    ├── node_modules/           # Upload this (see note below)
    ├── package.json
    └── .env                    # Your environment variables
```

#### Important: Upload node_modules
Since you cannot run `npm install` on cPanel, you MUST upload your local `node_modules` folder:
- Compress `node_modules` locally first
- Upload the ZIP file
- Extract in cPanel File Manager

### Step 3: Configure Node.js App in cPanel

1. **Go to "Setup Node.js App"** in cPanel
2. **Create Application**:
   - **Application Root**: `/home/username/your_app_directory`
   - **Application URL**: `yourdomain.com/your_app` (or just `yourdomain.com`)
   - **Application Startup File**: `dist/index.js`
   - **Node.js Version**: Use the version from your local environment (check `node --version`)

3. **Configure Environment Variables**:
   Click "Environment Variables" and add:
   ```
   NODE_ENV=production
   DATABASE_URL=your_database_url
   SESSION_SECRET=your_secret
   ```

4. **Restart Application**: Click "Restart" after configuration

### Step 4: Test Deployment

1. Visit your application URL
2. Check cPanel error logs if issues occur:
   - cPanel > Metrics > Errors
   - Setup Node.js App > View Error Log

## Common 503 Errors and Solutions

### Error 1: "Application startup failed"
**Cause**: Wrong startup file path
**Solution**: Ensure startup file is `dist/index.js` (not `server/index.js`)

### Error 2: "Cannot find module"
**Cause**: Missing node_modules or incorrect dependencies
**Solution**: Upload complete node_modules folder from local build

### Error 3: "Port already in use"
**Cause**: Hardcoded port in server code
**Solution**: Server uses `process.env.PORT` automatically - don't hardcode ports

### Error 4: "Database connection failed"
**Cause**: Incorrect DATABASE_URL or missing SSL
**Solution**: Ensure DATABASE_URL includes `?sslmode=require`

### Error 5: "Static files not found"
**Cause**: Incorrect public folder path
**Solution**: Ensure `dist/public/` exists and contains React build files

## File Structure After Deployment

```
/home/username/your_app_directory/
├── dist/
│   ├── index.js              # Entry point for cPanel
│   └── public/               # Served as static files
│       ├── index.html
│       ├── assets/
│       └── favicon.png
├── node_modules/             # Required dependencies
├── package.json              # Package metadata
└── .env                      # Environment variables
```

## cPanel Configuration Summary

| Setting | Value |
|---------|-------|
| Application Root | `/home/username/your_app_directory` |
| Application URL | `yourdomain.com` or `yourdomain.com/app` |
| Startup File | `dist/index.js` |
| Node.js Version | Match your local version |

## Environment Variables Required

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
SESSION_SECRET=random_string_here
PORT=3000  # cPanel sets this automatically
```

## Troubleshooting Checklist

- [ ] Built with `npm run build:namecheap`
- [ ] Uploaded `dist/index.js` as startup file
- [ ] Uploaded complete `node_modules` folder
- [ ] Set correct startup file in cPanel (`dist/index.js`)
- [ ] Added all environment variables
- [ ] Database URL includes SSL parameters
- [ ] Restarted application after changes
- [ ] Checked error logs in cPanel

## Post-Deployment Updates

To update your application:
1. Make changes locally
2. Run `npm run build:namecheap`
3. Upload new `dist/` files
4. Restart application in cPanel

## Security Notes

- Never upload `.env` with development secrets
- Use strong SESSION_SECRET
- Ensure database uses SSL connection
- Keep Node.js version updated in cPanel

## Performance Tips

- Enable gzip compression in cPanel if available
- Use CDN for static assets if possible
- Monitor resource usage in cPanel metrics

## Support

If you encounter issues:
1. Check cPanel error logs
2. Verify file permissions (755 for directories, 644 for files)
3. Ensure all dependencies are in node_modules
4. Contact Namecheap support with error details
