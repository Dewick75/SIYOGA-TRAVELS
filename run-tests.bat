@echo off
echo Running Siyoga Travel System Tests

echo.
echo ===================================
echo Running Backend Tests
echo ===================================
cd backend
call npm test

echo.
echo ===================================
echo Running Frontend Tests
echo ===================================
cd ../frontend
call npm test

echo.
echo ===================================
echo All tests completed
echo ===================================

pause
