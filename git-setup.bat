@echo off
cd /d "C:\Users\Pradeep M\IdeaProjects\fraud-detection-system"

echo === Step 1: Checking git status ===
git status
if errorlevel 1 (
    echo.
    echo === Step 2: Initializing git ===
    git init
)

echo.
echo === Step 3: Checking remotes ===
git remote -v

echo.
echo === Step 4: Setting origin remote ===
git remote set-url origin https://github.com/PradeepTech-hub/AI-based-Fraud-detection-System.git 2>nul || git remote add origin https://github.com/PradeepTech-hub/AI-based-Fraud-detection-System.git

echo.
echo === Step 5: Staging all files ===
git add .

echo.
echo === Step 6: Creating commit ===
git commit -m "Initial commit: AI-based Fraud Detection System"

echo.
echo === Step 7: Checking current branch ===
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%i
echo Current branch: %BRANCH%

if not "%BRANCH%"=="main" (
    echo Renaming branch to main...
    git branch -m main
)

echo.
echo === Step 8: Pushing to GitHub ===
git push -u origin main

echo.
echo === Final Status ===
git status
echo === Remotes ===
git remote -v
