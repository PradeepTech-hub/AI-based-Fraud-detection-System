Set-Location "c:\Users\Pradeep M\IdeaProjects\fraud-detection-system"

Write-Host "=== Step 1: Checking git status ===" -ForegroundColor Cyan
$gitStatus = git status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n=== Step 2: Initializing git ===" -ForegroundColor Cyan
    git init
} else {
    Write-Host $gitStatus
}

Write-Host "`n=== Step 3: Checking remotes ===" -ForegroundColor Cyan
git remote -v

Write-Host "`n=== Step 4: Setting origin remote ===" -ForegroundColor Cyan
$remoteExists = git remote | Select-String -Pattern "^origin$"
if ($remoteExists) {
    git remote set-url origin https://github.com/PradeepTech-hub/AI-based-Fraud-detection-System.git
    Write-Host "Updated origin remote"
} else {
    git remote add origin https://github.com/PradeepTech-hub/AI-based-Fraud-detection-System.git
    Write-Host "Added origin remote"
}

Write-Host "`n=== Step 5: Staging all files ===" -ForegroundColor Cyan
git add .
Write-Host "All files staged"

Write-Host "`n=== Step 6: Creating commit ===" -ForegroundColor Cyan
git commit -m "Initial commit: AI-based Fraud Detection System`n`nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

Write-Host "`n=== Step 7: Checking current branch ===" -ForegroundColor Cyan
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch"
if ($currentBranch -ne "main") {
    Write-Host "Renaming branch to main..."
    git branch -m main
}

Write-Host "`n=== Step 8: Pushing to GitHub ===" -ForegroundColor Cyan
git push -u origin main

Write-Host "`n=== Final Status ===" -ForegroundColor Cyan
git status
Write-Host "`n=== Remotes ===" -ForegroundColor Cyan
git remote -v
