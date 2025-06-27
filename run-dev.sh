#!/bin/bash
cd "$(dirname "$0")/electron"
npm install
npx concurrently "npm start" "cd ../frontend && npm run dev"
