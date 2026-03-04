Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  SafeGuard APK Build Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "C:\Users\jayam\Downloads\Ai\mobile"

Write-Host "Step 1: Login to Expo account..." -ForegroundColor Yellow
Write-Host "  (Create free account at https://expo.dev if you don't have one)" -ForegroundColor Gray
Write-Host ""
npx eas-cli login

Write-Host ""
Write-Host "Step 2: Building APK (preview build)..." -ForegroundColor Yellow
Write-Host "  This uploads code to Expo's cloud and builds the APK (~5-10 min)" -ForegroundColor Gray
Write-Host ""
npx eas-cli build --platform android --profile preview --non-interactive

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "  Build submitted! Check status at:" -ForegroundColor Green
Write-Host "  https://expo.dev" -ForegroundColor Green
Write-Host "  APK will be emailed to you & available to download from the link above." -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
