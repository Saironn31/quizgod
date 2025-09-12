# Git Setup Guide

Since Git isn't recognized in PowerShell yet, here are your options:

## Option 1: Restart PowerShell (Recommended)
1. Close this PowerShell window
2. Open a new PowerShell window as Administrator
3. Navigate back to: `cd "C:\Codes\QUIZ WEBSITE\WEBSITE\quizgod-free"`
4. Test Git: `git --version`

## Option 2: Use Git Bash
1. Right-click in this folder
2. Select "Git Bash Here"
3. Run the commands in Git Bash instead

## Option 3: Manual Git Setup (if still not working)
1. Find your Git installation (usually `C:\Program Files\Git\bin`)
2. Add to PATH or use full path: `"C:\Program Files\Git\bin\git.exe" --version`

## Next Steps After Git Works
Once Git is working, run these commands in order:

```bash
# 1. Initialize repository
git init

# 2. Configure Git (replace with your info)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 3. Add all files
git add .

# 4. Create initial commit
git commit -m "Initial commit - QuizGod application"

# 5. Create GitHub repository (manual step)
# Go to github.com and create a new repository called "quizgod-app"

# 6. Connect to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/quizgod-app.git
git branch -M main
git push -u origin main
```

## Deploy to Vercel
1. Go to https://vercel.com
2. Sign in with GitHub
3. Import your repository
4. Deploy automatically!

Your quiz app will be live at: `https://your-repo-name.vercel.app`