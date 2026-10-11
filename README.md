# THE LAST TEN MINUTES

A cooperative detective game for 1–6 players set in Bellwether, a town caught inside the last ten minutes of an experiment. Each investigator can play on a laptop with keyboard and mouse, or optionally pair a phone joystick. All six specialties stay in the story; smaller casual groups can assign multiple specialties to each person. The authored episode contains eight connected locations, fourteen deductions across five acts, twenty-five specialist observations, three resident keepsakes, and six distributed finale configurations.

This repository contains the actual game, authoritative Node server, deterministic content package, procedural canvas art and audio, WebRTC voice on the selected controller, SQLite persistence, tests and facilitator documentation. Six-human enjoyment, duration and actual mobile/network reliability still require field testing; see [verification](docs/VERIFICATION.md) and [playtest guide](docs/PLAYTEST.md).

## Run locally

Requirements: Node **22.13+** with built-in `node:sqlite` (tested here with Node 23.10.0), npm, a modern browser. Node versions that mark SQLite experimental print a warning.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open **http://localhost:5175** on the first laptop. Create a casual room and share its **six-character room invitation** with your group. Casual supports 1–6 players; Ranked requires six players with one specialty each.

1. Choose your roles: click one or more unclaimed specialty cards. Click again to release a role. The creator can **Distribute unclaimed roles** evenly among current players. All six specialties must be assigned before starting.
2. Choose **Laptop keyboard & mouse** (default), enable the microphone or select **Use text communication**, then **Confirm keyboard & audio check**.
3. Alternatively select **Phone joystick**, scan the private QR, drag the joystick, choose voice/text, and confirm the controller check on the phone. Pairing codes are ten characters, single-use, and valid for ten minutes.
4. Every player selects **I’m ready**; the creator selects **Enter Bellwether**. No empty seats need to be filled in Casual.

Public room listings refresh every two seconds and on window focus. Only public, unstarted rooms with spare seats and a connected creator appear. Disconnected rooms remain saved for recovery but are not advertised as joinable.

**A QR containing localhost will not work on another device.** For real devices, open the laptop page using the shared HTTPS address below before scanning. Voice needs a secure context. A LAN HTTP address can test movement and text, but cannot reliably access a phone microphone.

## Secure device testing

Use a trusted HTTPS reverse proxy in front of Vite (development) or the server (built build). For example, a Caddy installation on an accessible test domain:

```caddyfile
mystery.your-domain.example {
    reverse_proxy 127.0.0.1:5175
}
```

Point that domain at the machine, allow inbound 80/443, and use a real certificate. A private HTTPS tunnel forwarding port 5175 is another option; create it yourself with your preferred provider. No tunnel or hosting account is automatically provisioned. Use the **same origin** on all laptops and phones. Set `PUBLIC_ORIGIN` to that exact HTTPS origin when enforcing production origin checks. Do not expose development tools on an untrusted public network; for shared public tests use the production build on port 3001.

For a purely local trusted-LAN setup, use a locally trusted certificate with a DNS name or IP SAN and install/trust its CA on every phone. Simply accepting an invalid-certificate warning is not a reliable secure-context setup.

## Play

- Keyboard WASD/arrows or optional phone joystick: walk toward gold object markers. Input expires on the server after 350 ms and stops on blur, lost pointer, dialog opening or disconnection.
- Inspect, then use your instrument. Observations are private until you deliberately share them.
- Case journal: current leads, personal/shared evidence and chronological field notes. Puzzle choices made on the phone also update the laptop.
- Doorways: walk to a labeled entrance and click **Enter**, or press Enter on the keyboard. Locked entrances explain that you need to follow current leads. The town map remains an alternative for travel along connected paths. Clues open branches; essential evidence never disappears.
- Deductions: assemble required observations, discuss them, then submit at the relevant location. Incorrect attempts do not consume evidence. Three optional hints are available per deduction.
- Roles: use **Active role** in the toolbar, or **Active specialty** inside an observation or finale dialog, to switch between your assigned tools. Ownership remains exclusive.
- Guidance: **Your next step** identifies an actionable investigation task without exposing answers. **Read instructions aloud** reads onboarding; **Read aloud** and optional **Spoken guidance** read updated objectives using browser speech. All instructions remain visible as text.
- Finale: travel to each station for your assigned specialties and choose its configuration. Switch roles to operate another station; latches hold without a countdown.
- Keyboard alternative: WASD/arrows move; E inspects; Q uses the role instrument; J opens the journal; M opens the map. Mouse and accessible DOM controls are also available.

## Voice and TURN

**Voice input and playback use the selected controller: laptop or phone.** Use headphones. The laptop plays procedural atmosphere and effects. No conversations are recorded. Evidence has transcripts; optional synthesized readings are accessibility aids, not acted recordings.

Team voice uses an up-to-six-party WebRTC audio mesh, authenticated room-scoped Socket.IO signaling, explicit microphone permission, mute, push-to-talk, speaking indicators, and per-participant volume (zero mutes that participant). “Resume voice playback” handles gesture-gated audio; “Retry voice” rebuilds peers after failure or phone backgrounding. A denied microphone explains how to change browser site permissions and offers text messages.

Set `ICE_SERVERS_JSON` in `.env` to include a TURN service for real networks:

```dotenv
ICE_SERVERS_JSON=[{"urls":"stun:stun.l.google.com:19302"},{"urls":["turn:turn.your-domain.example:3478?transport=udp","turns:turn.your-domain.example:5349?transport=tcp"],"username":"provisioned-user","credential":"provisioned-password"}]
```

Provision your own coturn or managed TURN service; it is not bundled. Allow its UDP relay port range and TCP/TLS fallback. TURN browser credentials are necessarily delivered to clients. For public deployment replace static shared credentials with short-lived credentials from an authenticated issuer; avoid giving public clients permanent privileged relay access. No external credentials were available for remote relay validation. Successful local synthetic audio tests do **not** establish iOS/Android or cross-network success.

## Persistence, reconnects and scoring

SQLite at `DATABASE_PATH` (default `data/last-ten.sqlite`) stores authoritative rooms transactionally on significant actions and periodically during play. Player tokens, phone tokens, observations, answer drafts, hints, progress and finale latches survive server restart. Positions checkpoint every two seconds. Back up the database together with its WAL safely, or use SQLite’s backup API. Keep its directory private: it contains device credentials.

Browser local storage retains that device’s last session token across refreshes. “Return to title” preserves a resume link. Do not clear browser storage during an active case. If the phone is lost, the laptop can issue a new private credential from **Settings → Reconnect or replace phone**. The new pairing invalidates the previous phone token. A lost laptop token currently requires restoring browser storage; there is no account-based seat recovery or host impersonation feature. Joining another case replaces the browser’s last-session shortcut.

Disconnected investigators retain seats and roles. Play automatically pauses whenever a laptop or a selected phone controller is absent and resumes when all return, unless manually paused. An optional, unselected phone does not block play. If a phone is lost, select laptop controls in Settings to resume; enable voice again on the newly selected device. Anyone may manually pause/resume. Seats are never silently replaced. Backgrounded phones may need voice reactivation. A room with an abandoned player remains saved; no automatic role handoff exists.

**Casual:** active time excludes pauses and disconnected waits, approximately quantized to the 50 ms server tick. Never ranked. **Ranked:** requires six players with one specialty each, with either control scheme. Server wall-clock time includes pauses, disconnects and backend downtime. All six roles must arm validated finale stations. Results are inserted once. A requested hint puts the team in the assisted category; categories and episode versions are separate. Equal completion times share a rank. No memory/first-playthrough guarantee. No fixture teams appear in the production leaderboard.

## Commands

```sh
npm run build          # Typecheck and production frontend
npm start              # Authoritative backend + built frontend on :3001
npm test               # Rules, privacy, recovery, 12-device networking, full socket episode
npx playwright install chromium
npm run test:browser   # Run against npm run dev at :5175
npm run docs:episode   # Regenerate spoiler-rich puzzle specification
```

`TEST_URL` selects a different browser-test base URL. `PLAYWRIGHT_CHANNEL=chrome npm run test:browser` uses installed Chrome instead of downloading Playwright Chromium. Browser tests use isolated profiles and synthetic microphone input; they never access the user’s actual microphone. The voice test runs two real WebRTC peers on one machine. The full socket episode uses only normal authorized movement, travel, discovery, sharing and puzzle actions; it does not teleport test players or skip puzzles.

Optional: set `ENABLE_DEV_HARNESS=true` in a **private development environment**. The create-room dialog then offers a clearly labeled five-simulated-seat harness. It is for layout/connection work, not an autonomous puzzle solver. Simulated sessions cannot rank. Normal rooms always require six paired players.

## Production deployment

1. Deploy source and lockfile on one persistent Node instance. `npm ci && npm run build`.
2. Configure `.env`: `PORT`, `DATABASE_PATH` on a durable private disk, exact `PUBLIC_ORIGIN`, and STUN/TURN. Keep `ENABLE_DEV_HARNESS=false`.
3. Run `npm start` under a supervisor. Proxy your HTTPS domain to port 3001, including WebSocket upgrade headers. Both frontend and Socket.IO use the same origin; no frontend backend URL rewrite is needed.
4. Configure TURN and test two phones across different ISPs/mobile networks. See [playtest guide](docs/PLAYTEST.md).
5. Back up SQLite, retain stable storage on restarts, and run the acceptance checks before sharing.

This is a **single-server deployment**. Do not put multiple independent servers behind a load balancer: a Socket.IO adapter alone would not coordinate authoritative state and SQLite writes. Multi-node operation needs a shared state coordinator and persistent database design. Do not use ephemeral serverless filesystems for checkpoints.

Sensitive create/join/pair/actions are validated and rate-limited. Device secrets are not room invitations. Significant actions and roles are server-authoritative; duplicate commands are bounded-deduplicated and completed puzzles/results are naturally idempotent. Client snapshots expose only that player’s observations plus deliberately shared evidence. Puzzle solutions live under `server/`, never in the browser bundle.

## Source guide

- `shared/world.ts`: public role, location and object descriptions, protocol views.
- `server/episode.ts`: server-only evidence, exact solutions, prerequisites, hints, finale.
- `server/game.ts`: rules, authorization, movement, privacy projections, report.
- `server/index.ts`: HTTP, device authentication, realtime transport, voice signaling.
- `server/store.ts`: transactional SQLite snapshots and validated team results.
- `src/Scene.tsx`: original cached canvas environments and animation.
- `src/App.tsx`: accessible laptop and phone interfaces; `src/voice.ts` and `src/audio.ts` isolate audio responsibilities.
- `docs/`: story bible, generated puzzle specifications, art licenses, verification, progress and playtesting.

Future episodes can replace the server content package and matching public locations while preserving the rules and transport. There is intentionally no visual editor.

### This workspace’s dependency workaround

The Documents directory on the test machine is iCloud-managed and began offloading `node_modules` during validation. Only here, `node_modules` is an ignored symlink to `/Users/prajwalmac/.cache/the-last-ten-minutes/runtime/node_modules`; the original offloaded installation is ignored as `node_modules.icloud/`. This is not part of the repository. The cache survives restarts. The project folder was marked Keep Downloaded in Finder, and an isolated copy under `/private/tmp/bellwether-checkout` was used to avoid iCloud stalls during validation. If you remove the dependency cache, remove the dangling symlink and run `npm ci`, preferably in a non-cloud checkout. The lockfile supports a normal clean installation elsewhere.
