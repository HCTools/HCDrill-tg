@echo off
title Dependency Installer
echo "Make sure to have Node.JS installed with PATH system options enabled."
timeout /t 5 /NOBREAK>nul
npm update --save
exit