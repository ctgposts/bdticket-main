# BD TicketPro - Vercel Deployment Guide

## 🚀 Vercel এ সম্পূর্ণ Deployment Process

### ধাপ ১: Repository Preparation

1. **GitHub এ Code Push করুন:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

### ধাপ ২: Vercel Account Setup

1. [vercel.com](https://vercel.com) এ যান
2. GitHub দিয়ে Sign up/Login করুন
3. "Import Project" ক্লিক করুন
4. আপনার GitHub repository select করুন

### ধাপ ৩: Project Configuration

Vercel এ import করার সময়:

1. **Project Name:** `bd-ticketpro` (অথবা আপনার পছন্দের নাম)
2. **Framework:** Vite (auto-detected)
3. **Build Command:** `npm run build` (auto-detected)
4. **Output Directory:** `dist/spa` (auto-detected)

### ধাপ ৪: Environment Variables Setup

Vercel Dashboard এ Environment Variables add করুন:

**Required Variables:**

```
NODE_ENV=production
JWT_SECRET=আপনার-সিকিউর-জেডব্লিউটি-সিক্রেট-কী-৩২-ক্যারেক্টার-মিনিমাম
```

**Optional Variables:**

```
DEBUG=false
DATABASE_PATH=/tmp/bd-ticketpro.db
CORS_ORIGINS=https://your-app-name.vercel.app
```

### ধাপ ৫: Deployment

1. "Deploy" বাটন ক্লিক করুন
2. Build process সম্পূর্ণ হওয়ার জন্য অপেক্ষা করুন (৫-১�� মিনিট)
3. Deployment সফল হলে আপনার app URL পাবেন

## 🔧 Post-Deployment Configuration

### Database Initialization

প্রথমবার deploy হওয়ার পর:

1. আপনার Vercel app URL এ যান: `https://your-app.vercel.app`
2. Login page দেখতে পাবেন
3. Database automatically initialize হবে
4. Default admin account তৈরি হবে

### Default Login Credentials

```
Username: admin
Password: admin123
```

**⚠️ Security Warning:** First login এর পর অবশ্যই password change করুন!

## 📝 Environment Variables বিস্তারিত

### JWT_SECRET তৈরি করার উপায়:

```bash
# Terminal এ run করুন (নিরাপদ secret তৈরির জন্য)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CORS_ORIGINS Configuration:

```
# একাধিক domain এর জন্য
CORS_ORIGINS=https://your-app.vercel.app,https://custom-domain.com,https://www.custom-domain.com
```

## 🚨 Common Issues এবং Solutions

### ১. Build Failed

- **সমস্যা:** Node.js version mismatch
- **সমাধান:** Vercel dashboard এ Node.js version 20.x set কর��ন

### ২. API Routes না কাজ করা

- **সমস্যা:** Function timeout
- **সমাধান:** vercel.json এ maxDuration increase করুন

### ৩. Database Connection Error

- **সমস্যা:** SQLite file permission
- **সমাধান:** `/tmp/` path use করুন Vercel এ

### ৪. Authentication না কাজ করা

- **সমস্যা:** JWT_SECRET missing
- **সমাধান:** Environment variables properly set করুন

## 🔄 Re-deployment Process

Code update করার পর:

1. **Local এ test করুন:**

   ```bash
   npm run build
   npm run start
   ```

2. **GitHub এ push করুন:**

   ```bash
   git add .
   git commit -m "Update: description of changes"
   git push origin main
   ```

3. **Vercel automatically re-deploy করবে** (1-2 মিনিট)

## 📊 Performance Monitoring

Vercel Dashboard এ monitor করতে পারেন:

- **Function Execution Time**
- **Bandwidth Usage**
- **Error Logs**
- **Analytics**

## 🔒 Security Checklist

- ✅ JWT_SECRET properly set
- ✅ CORS_ORIGINS configured
- ✅ Default admin password changed
- ✅ HTTPS enabled (automatic with Vercel)
- ✅ Security headers configured

## 📞 Support

যদি কোন সমস্যা হয়:

1. Vercel Function Logs check করুন
2. Browser Console এ error দেখুন
3. Network tab এ API responses check করুন

## 🎉 Success!

সফলভাবে deploy হলে আপনার Travel Agency Management System ready!

**Features Available:**

- ✅ Dashboard
- ✅ Countries Management
- ✅ Tickets Management
- ✅ Admin Buying
- ✅ Bookings
- ✅ Umrah Management
- ✅ Reports
- ✅ Settings

**Production URL:** `https://your-app-name.vercel.app`
