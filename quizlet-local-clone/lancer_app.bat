@echo off
title Lancement de l'application

echo Lancement du backend...
start cmd /k "cd server && npm run start"

timeout /t 2 > nul

echo Lancement du frontend...
start cmd /k "cd client && npm run dev"

timeout /t 5 > nul

echo Ouverture de http://localhost:5173/ dans le navigateur...
start http://localhost:5173/
