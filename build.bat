@echo off
cd frontend
npm install
npm run build
npx next export -o out
cd ../electron
npm install
npm run builddesktop