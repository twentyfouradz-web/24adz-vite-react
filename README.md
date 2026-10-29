# 24Adz.com Vite + React starter

This is a frontend starter for the 24Adz.com classifieds website.

## Included
- Vite + React setup
- Black/orange responsive homepage
- Category selection and search UI
- District filter starter options
- Ads grid with demo fallback
- API client starter for `GET /ads`
- Basic call/WhatsApp buttons when contact fields exist

## Run locally
1. Install Node.js on your computer.
2. Open this project folder in a terminal.
3. Run `npm install`
4. Copy `.env.example` to `.env`
5. Confirm `VITE_API_BASE_URL` matches the real API base URL.
6. Run `npm run dev`

## Build
Run `npm run build`. Vite creates the production site in `dist/`.

## Important before deployment
- This starter is not yet connected to a verified production API. The API route and query names must match the existing `24adz-api` Worker.
- The frontend currently tries `GET {VITE_API_BASE_URL}/ads` and expects an array, `{ "ads": [...] }`, or `{ "results": [...] }`.
- Confirm the Worker route, CORS settings, and actual response shape before relying on live ads.
- The demo cards are sample content and are not real listings.
- Do not place admin passwords, session secrets, or other private secrets in frontend environment variables.
- A visible Post Ad button is only a placeholder link at this stage; admin-only posting must be implemented and protected by the backend.
- Configure Cloudflare Pages build command as `npm run build` and output directory as `dist` if using Pages with this Vite frontend.
- Do not create duplicate Pages Functions endpoints if the separate `24adz-api` Worker is intended to remain the backend.
