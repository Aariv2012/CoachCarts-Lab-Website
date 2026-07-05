# CoachCarts Angular Shell

This folder contains a minimal Angular application scaffolded to start porting the existing static site into Angular components without modifying the original website files.

How to run

1. Install Node.js (>=18), then from `angular-app` run:

```bash
npm install
npm start
```

Notes
- The original site files at the repo root are untouched. To integrate them into the Angular build, either copy files into `angular-app/src/assets` or add paths to `angular.json` assets.
- I created a small shell component to get started. Let me know if you want me to automatically copy assets into the Angular project or convert `index.html` into Angular components.
