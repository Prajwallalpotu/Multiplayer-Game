# Verification record — 9 October 2026

## Environment

- macOS 26.5.1, Apple M2, 8 GB RAM; Node 23.10.0; npm 11.4.2.
- Installed Google Chrome 154.0.8037.98, driven by Playwright in isolated browser contexts.
- Laptop viewport: 1440 × 1000. Phone emulations: 390 × 844 and 360 × 740, with touch enabled.
- Local authoritative server with SQLite; separate authenticated Socket.IO clients for six laptops and six phones. Voice test uses two real WebRTC peer connections with synthetic microphone input, on this machine only.
- iCloud offloaded files during testing. The folder was marked Keep Downloaded; a byte-equivalent non-cloud source copy was used for stable runs. A persistent local dependency cache is linked from this checkout. Several initial environment/trace-output failures were investigated rather than counted as passes.

## Successful checks

`npm run build`: TypeScript check and Vite production build pass. Latest client: approximately 364.6 KB JavaScript / 116.8 KB gzip; 28.3 KB CSS / 7.3 KB gzip. There are no external bitmap/font/audio downloads required by the game.

`npm test`: **10 passing tests**, including:

1. Six-seat limit, role collision, readiness conditions, private single-use pairing and expiry.
2. Server-side role/proximity permissions; private observations and credentials excluded from other players’ snapshots; no answer arrays in client projections.
3. Every required clue reachable before use; deterministic completion of all fourteen deductions and all six role-specific latches. Rejected restart is recoverable.
4. Prerequisites, required sharing, location, malformed/incorrect answers, scoped hints and three-hint cap.
5. Movement watchdog, manual/disconnect pauses, idempotency and mirrored answer drafts.
6. SQLite reopen/restart with retained device identities, role seats, discoveries and drafts; unique ranked insertion; simulated results excluded.
7. Acyclic content graph; every role appears across at least four acts and has a distinct finale station.
8. Post-completion movement and travel do not change recorded completion time.
9. Twelve actual socket connections verify separate laptops/phones, atomic role competition, isolated movement, reconnect, unauthorized actions and room-scoped voice signaling.
10. **Full episode through normal network commands:** all six player sessions pair phones, travel along legal paths, move near instruments, reveal/share observations, submit deductions and arm the finale. No server-state teleporting, automatic clue unlocks or solve shortcuts are used in this test. It passes in roughly 18 seconds because the test already knows the answers; this is not a pacing result.

`TEST_URL=http://127.0.0.1:3001 PLAYWRIGHT_CHANNEL=chrome npm run test:browser`: **5 passing browser tests** in the clean suite:

- Title → create room → pair separate phone → choose role → equipment/text check → ready → refresh laptop and phone. Also rechecked with `crypto.randomUUID` unavailable, covering the compatibility fallback needed for LAN HTTP text/controller testing.
- Small phone pairing layout without horizontal overflow.
- Six paired sessions, including actual laptop and phone pages: phone-driven exploration, private ability observation, evidence sharing, mirrored deduction choices, first puzzle completion, map travel and phone refresh. A regression asserts movement distance so an idle laptop cannot cancel the phone’s input.
- **Explicitly labeled visual fixture:** all eight locations, six-station finale, real role-validated latch submissions, case report, dawn, larger text/reduced motion, phone sizing, and post-case exploration. This fixture seeds earlier progress for visual coverage; it is not evidence of a complete human/browser-only playthrough and cannot rank.
- Two local WebRTC phones send/receive synthetic audio bytes. Tests check negotiation, microphone enable, mute, push-to-talk’s idle track state, simulated permission denial and text recovery. This does not test actual human audio quality, physical microphone permissions, TURN relay or different networks.

The final input compatibility check is a focused rerun after the clean suite; the final clue wording/chronology dependency changes were followed by the full ten-test rules/network suite.

## Visual inspection

Rendered screenshots were examined for the title, laptop/phone lobby, controller, evidence/deduction dialogs, all eight locations, finale, laptop/phone case report, dawn and larger-text/reduced-motion report. Controls and content remain reachable through scrolling within dialogs. The six-role and fixture banners are explicit. The sunrise, returned residents, clock face, resolved apparition and moving paper boat are authored parts of the same scene system.

Selected inspection images are retained in `docs/screenshots/`; all gameplay/end screenshots that use seeded late-game state visibly say DEVELOPMENT HARNESS / SIMULATED TEAM. They are documentation artifacts, not production leaderboard data.

## Performance observation

The renderer caches static environments, caps device pixel ratio at 1.7, and samples requestAnimationFrame intervals. On this M2/8 GB machine at 1440 × 1000, automated Chrome gameplay samples of 155–180 frames averaged approximately **16.7–20.8 ms per frame** across runs. These are short local observations, including test overhead, not a promised frame rate or a sustained low-end laptop benchmark. Reduced motion draws at a lower cadence. Further long-session and weaker-device profiling remains in the playtest guide.

## Acceptance status and limits

| Criterion | Evidence / status |
|---|---|
| Six independent sessions and unique roles | Verified with real sockets; lobby/browser interactions also covered. |
| Own-phone pairing and isolated control | Verified with separate credentials and measurable movement. |
| Complete phone journey | All commands available on phone; first investigation and finale exercised in browsers; whole episode exercised through six controller sockets. Still needs six humans on physical phones. |
| Shared changes / private information | Projection and network authorization tests pass. |
| Solvable graph | End-to-end reachability and actual socket traversal pass. |
| Meaningful role contributions | Authored interdependence and structural coverage verified; human role balance unverified. |
| Scoped optional hints | Server tests pass; no automatic solving. |
| Reconnect / restart / no duplicates | SQLite and device reconnection tests pass; physical backgrounding remains unverified. |
| Voice flow | Local synthetic WebRTC and failure/mute controls pass; real-device and remote TURN tests outstanding. |
| Authored ending / report | Logic, browser controls and actual rendered transformation inspected. |
| Validated team leaderboard | Server-only completion path and unique results; assisted/version separation; no invented production teams. |
| Laptop and phone visual QA | Inspected at the sizes above. |
| Important automated transitions | Ten rules/network tests and five browser tests pass. |
| Human-validation boundaries | Explicitly documented in README, PROGRESS and PLAYTEST. |

Not established: 90-minute duration, six-human fun or emotional payoff, live iOS/Android voice, remote STUN/TURN reachability, headset routing, mobile lock-screen survival, sustained low-end performance, or a comprehensive screen-reader audit. There is no production deployment or external voice credential provisioned by this work.

## Usability update — 11 October 2026

- Casual now accepts 1–6 players while requiring coverage of all six specialties. Ranked still requires six players with one role each. New game-logic tests complete all fourteen deductions and the six latched finale stations with one keyboard-only player, and reject cross-player role use and undersized ranked starts.
- Public listings require a connected host, available seats and lobby status. Server and browser tests cover disappearance after disconnect/start and reappearance after reconnect without refreshing the directory page.
- Laptop controls and optional phone joystick are both exercised in browser tests. The solo browser scenario switches tools in the observation dialog, shares both first-puzzle clues, commits the deduction, approaches a doorway and enters without using the map, then reloads with the active role preserved.
- The six-phone browser scenario and full real-socket episode remain covered. Mixed laptop/phone WebRTC is checked using synthetic microphone input, including mute, push-to-talk and permission denial; physical phones and remote TURN connections still need field testing.
- Browser narration dispatch is tested with a speech-synthesis stub. This verifies the instruction text and controls, not the quality or availability of installed device voices.
- During checks, iCloud offloaded source files again. Finder Download Now was requested for the project, which already had Keep Downloaded enabled. A temporary validation copy was prepared outside Documents to avoid cloud read stalls.

Final update checks: production build passed in the project and the non-cloud verification copy, with identical generated JavaScript/CSS filenames. All **13 game/server tests** and **7 browser tests** passed in a clean final run against a temporary in-memory server on port 3003. The user's normal server/database were not used for automated playthroughs. Five stalled source/test files were restored from the previously validated checkout plus the exact edits made in this session; their expected byte sizes matched before restoration.

## 12 October 2026 — interactive puzzles and clearer controls

Added shared picture, combination-cupboard and music-box puzzles with saved inventory, visual rewards and an original melody; simplified entrance labels; added individual and host-wide saved exits, including paired phones, and clickable home branding. Narration now queues automatic objectives, retains utterances, supports Stop reading and preserves transcript volume.

Production build passed, along with 17 game/server/narration tests and the full 9-browser-test suite. After preserving transcript volume, the build, 17 tests and focused browser narration regression passed again. Speech scheduling is checked with synthesis stubs; physical device voice quality still requires listening tests.

The lobby now displays missing specialties and each player’s outstanding controls, connection, audio check and ready steps beside Enter Bellwether. Ranked requirements and host-only launch are explained. Button eligibility includes the same role/equipment checks as the server.

Lobby follow-up: production build and focused Chrome browser regression passed. The regression verifies named missing requirements, assignment updates, readiness and the enabled launch button. Default Playwright Chromium was unavailable locally, so the installed Chrome channel was used. Local app health at port 5175 passed.

## 13 October 2026 — two-player minimum

Casual starts now require at least two players in both the lobby checklist and authoritative server; Ranked still requires six. Role switches remain restricted to the specialties assigned to that player, with regression checks that another player’s active role and assignments remain unchanged. Updated the former solo playthrough to distribute clues and finale stations across two players.

Verification: production build and all 18 game/server/narration tests passed. Three affected Chrome browser tests passed: lobby requirements, two-player guided investigation and public directory updates after starting. Browser fixtures were updated to ready both players after distributing roles.
