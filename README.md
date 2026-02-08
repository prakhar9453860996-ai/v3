# Offline Plant Disease Recognition App

This folder contains a Progressive Web App (PWA) version of the Plant Disease Recognition System. It runs entirely in the browser using TensorFlow.js, meaning it works offline once installed.

## Prerequisites
- A web server to serve the files (required for the first load and for Service Worker registration).
- Use `python -m http.server` locally on your PC.
- For Android, you can host these files on GitHub Pages, Netlify, or Vercel.

## Installation on Android
1. Host this `offline_app` folder on a secure HTTPS server (GitHub Pages is free and easiest).
2. Open the URL in Chrome on Android.
3. Tap the "Three Dots" menu -> "Add to Home Screen" (or "Install App").
4. The app will be installed as a native-like app on your device.
5. **Open it once while online** to let it download the AI model.
6. Now you can go to Airplane mode and test it!

## Development
- **index.html**: Main UI.
- **script.js**: Handles image processing and TF.js model inference.
- **sw.js**: Service Worker for offline caching.
- **manifest.json**: App metadata for Android.
- **model_tfjs/**: The converted TensorFlow.js model files.

## Troubleshooting
- If the model doesn't load, check the browser console.
- If offline mode doesn't work, ensure you loaded the page once fully while online.
