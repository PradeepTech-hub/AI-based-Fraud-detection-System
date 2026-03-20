@echo off
setlocal

cd /d "C:\Users\Pradeep M\IdeaProjects\fraud-detection-system" || exit /b 1

echo === Initializing git (if needed) ===
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 git init

echo === Setting remote ===
git remote set-url origin https://github.com/PradeepTech-hub/AI-based-Fraud-detection-System.git 2>nul || git remote add origin https://github.com/PradeepTech-hub/AI-based-Fraud-detection-System.git

echo === Ensuring main branch ===
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set BRANCH=%%i
if "%BRANCH%"=="" (
  git checkout -b main
) else (
  if /i not "%BRANCH%"=="main" git branch -m main
)

echo === Staging ONLY required files ===
git add .gitignore .gitattributes README.md Dockerfile docker-compose.yml pom.xml mvnw mvnw.cmd package.json package-lock.json .env.example 2>nul
git add .mvn src 2>nul
git add ai-service\app.py ai-service\Dockerfile ai-service\requirements.txt ai-service\train_model.py ai-service\generate_data.py 2>nul
git add frontend\Dockerfile frontend\package.json frontend\package-lock.json frontend\vite.config.js frontend\index.html frontend\eslint.config.js 2>nul
git add frontend\public frontend\src 2>nul

echo === Verifying staged files (no secrets) ===
git --no-pager diff --cached --name-only

echo === Commit & push ===
git commit -m "Initial commit: AI-based Fraud Detection System" || echo (Nothing to commit)
git push -u origin main

echo === Done ===
endlocal
