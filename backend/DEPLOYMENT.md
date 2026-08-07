# Deployment

## Environment Variables

- PORT
- NODE_ENV
- JWT_SECRET
- MONGODB_URI
- UPLOAD_DIR
- ALLOWED_ORIGINS (comma-separated list of frontend origins allowed via CORS)

## Render Deployment Notes

1. Create a Node.js service on Render.
2. Set the environment variables above.
3. Use the start command: `npm start`.
4. Mount a persistent file system if uploads need long-term retention.

## Vercel (Frontend) Notes

1. Build command: `npm run build` (in `aegis/`). Output: `dist`.
2. Set the build env var `VITE_API_URL` to your Render backend, e.g.
   `https://api.onrender.com/api`. Both `VITE_API_URL` and `VITE_API_BASE_URL`
   are accepted.
3. `vercel.json` in `aegis/` adds an SPA rewrite so deep links such as
   `/login` and `/register` load `index.html` instead of 404ing.
4. Set `ALLOWED_ORIGINS` on Render to your Vercel domain, e.g.
   `https://your-app.vercel.app,http://localhost:5173`.

## Frontend

The frontend is a static SPA (built with `npm run build` in `aegis/`). Host the
`aegis/dist` output on any static host (Render static site, Netlify, Vercel, S3,
etc.).

- When `VITE_API_URL` is unset, the app calls the same origin at `/api`, which
  requires the static host to reverse-proxy `/api` to the backend.
