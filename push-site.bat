@echo off

cd /d C:\tristanmaratos.com

git status

echo.
echo Type files to add individually.
echo Example:
echo css/main.css
echo js/contact-form.js
echo.
echo Type DONE when finished.
echo.

:loop
set /p file=

if /I "%file%"=="DONE" goto commit

git add %file%
goto loop

:commit
echo.
set /p commitmsg=Enter commit message: 

git commit -m "%commitmsg%"

echo.
git push

echo.
echo Push complete.
pause