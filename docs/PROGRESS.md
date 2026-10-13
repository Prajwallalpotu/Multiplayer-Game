# Development record — 9 October 2026

## Implemented

- Stage A: fixed story bible, causal chronology, six-role matrix, 14-sequence dependency graph, art/architecture decisions and generated per-puzzle solution/hint/recovery specification.
- Stage B: real six-seat server, unique role selection, single-use phone pairing, phone equipment checks, keyboard alternatives, private observations, shared evidence, one complete first investigation, WebRTC phone voice and text fallback.
- Stage C: all five acts; eight connected locations; 25 specialist observations and three optional resident keepsakes; 14 deductions; six persistent finale latches; recoverable false restart; completed case and explorable dawn.
- Stage D: original canvas scenes with cached environments, procedural atmosphere, animated fog/characters, role props, evidence effects, responsive laptop/phone UI, focus-trapped dialogs, larger text, reduced motion, transcript equivalents, reconnect and lost-phone replacement, SQLite recovery, server timing and team standings.

## Issues found and corrected during verification

- LAN HTTP controllers now use a cryptographically random message-ID fallback when `crypto.randomUUID` is unavailable; the secure microphone requirement remains explicit.
- Idle laptop movement packets could overwrite the paired phone’s active movement. Idle clients now send no continuous zero packets; release still sends an explicit stop. Browser regression checks measurable phone-driven movement.
- A completed session initially rejected exploration commands. Post-case movement and travel now work while completion time stays fixed; a regression covers this.
- A replacement phone could initially be paired only in the lobby. Laptop settings now generate a fresh credential during an investigation.
- Puzzle selections initially lived only on the device that clicked. Drafts now synchronize through the server and survive a restart.
- Visual/UI checks added purposeful interior props, stronger role silhouettes, restored-town characters, readable phone dialogs, ordered-event cards and safe circuit presentations.
- iCloud offloaded dependencies and later source files while tests ran. The project was marked Keep Downloaded; dependencies use a persistent local cache, and final validation uses a non-cloud copy. No unrelated project or global iCloud setting was changed.

## Remaining external / human validation

1. Provision trusted HTTPS and TURN for the intended deployment; test voice across separate real networks, including iOS Safari and Android Chrome. Local synthetic WebRTC success is insufficient for that claim.
2. Conduct fresh six-human playtests using `PLAYTEST.md`. Verify the 90-minute hypothesis, balanced participation, difficulty, suspense and emotional payoff. The current authored content must not be advertised as a measured 90-minute experience.
3. Review whether the multiple-choice deductions provide enough open reasoning for the target audience. Sequence cards and circuit interpretation add variety, but this is a deliberately compact authored episode with text-centered evidence, not a simulation of forensic instruments.
4. Production art/audio can be expanded: procedural geometric characters and environments are delivered; there are no actor performances or bespoke recorded Foley. Synthesized readings are labeled.
5. Deployment is one authoritative server with durable SQLite. Account-based recovery, abandoned-seat reassignment, horizontal scaling and database migrations across episode changes are not implemented. Preserve browser identity and database backups.
6. Cross-browser accessibility and device tests remain: screen readers, physical touch ergonomics, Bluetooth/headphone routes, mobile background/lock-screen behavior, and a broader low-end laptop performance sample.

See `VERIFICATION.md` for exact automated coverage and its limits. Source, solutions, assets and setup are in the repository; the runtime does not depend on a generative AI service.

## 11 October 2026 — playtest usability improvements

Completed live public-directory refresh and connected-host filtering; Casual 1–6 players with exclusive multi-role ownership and in-game switching; laptop controls and laptop voice with optional phone pairing; analogue joystick; contextual next-step guidance and optional browser narration; labeled nearby entrances with proximity-checked travel. Ranked retains six players / one specialty each. README and playtest instructions updated. Final verification: production build, 13 game/server tests and 7 browser tests passed. Physical-device narration quality, remote voice/TURN and human puzzle-comprehension testing remain field checks.

## 12 October 2026 — interactive puzzles and clearer controls

Added shared picture, combination-cupboard and music-box puzzles with saved inventory, visual rewards and an original melody; simplified entrance labels; added individual and host-wide saved exits, including paired phones, and clickable home branding. Narration now queues automatic objectives, retains utterances, supports Stop reading and preserves transcript volume.

Production build passed, along with 17 game/server/narration tests and the full 9-browser-test suite. After preserving transcript volume, the build, 17 tests and focused browser narration regression passed again. Speech scheduling is checked with synthesis stubs; physical device voice quality still requires listening tests.

The lobby now displays missing specialties and each player’s outstanding controls, connection, audio check and ready steps beside Enter Bellwether. Ranked requirements and host-only launch are explained. Button eligibility includes the same role/equipment checks as the server.

## 13 October 2026 — two-player minimum

Casual starts now require at least two players in both the lobby checklist and authoritative server; Ranked still requires six. Role switches remain restricted to the specialties assigned to that player, with regression checks that another player’s active role and assignments remain unchanged. Updated the former solo playthrough to distribute clues and finale stations across two players.

Verification: production build and all 18 game/server/narration tests passed. Three affected Chrome browser tests passed: lobby requirements, two-player guided investigation and public directory updates after starting. Browser fixtures were updated to ready both players after distributing roles.
