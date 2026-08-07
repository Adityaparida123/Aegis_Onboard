# Deployment

## Environment Variables

- PORT
- NODE_ENV
- JWT_SECRET
- MONGODB_URI
- UPLOAD_DIR

## Render Deployment Notes

1. Create a Node.js service on Render.
2. Set the environment variables above.
3. Use the start command: `npm start`.
4. Mount a persistent file system if uploads need long-term retention.

## Frontend

The frontend is a static SPA (built with `npm run build` in `aegis/`). Host the
`aegis/dist` output on any static host (Render static site, Netlify, Vercel, S3,
etc.).

- `VITE_API_URL` (build-time) — full URL of the deployed backend, e.g.
  `https://aegis-api.onrender.com/api`. When unset, the app calls the same origin
  at `/api`, which requires the static host to reverse-proxy `/api` to the backend.
- CORS is already enabled on the backend, so a separate frontend origin works out
  of the box.
