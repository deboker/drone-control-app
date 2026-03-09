# Tello Drone Web Controller

Simple UI for sending SDK commands to a DJI Tello and viewing the video feed via WebSocket.

## Local development
- Install deps: `npm install`
- Start combined server (HTTP + UDP + WebSocket/FFmpeg): `npm run start`
- Open http://localhost:3000 — video WS uses the same origin at path `/video`.

## Production / Deploy
- Frontend (`public/`) can still be served staticky (Netlify, GitHub Pages), ale backend musí bežať na serveri s Node a FFmpeg.
- Ak chceš všetko spolu na jednom porte, hoď projekt na VPS/Render/Railway, nastav `PORT` a spusti `node server.js`.  
- Netlify zostáva len na statiku; nemá UDP ani WebSocket server, takže video tam nepobeží bez externého backendu.

## Požiadavky
- FFmpeg v PATH (používa sa na prekodovanie streamu z Tello).
- Otvorené UDP porty 8889 (príkazy) a 11111 (video) z/do dronu.
- `.gitignore` udrží `node_modules` mimo repa.

## Notes
- `.gitignore` is recommended to keep `node_modules` out of the repo.
- Netlify redirect in `netlify.toml` forwards `/command` to your backend so the frontend keeps using relative paths.
