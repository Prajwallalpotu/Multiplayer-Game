import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Room } from "./game.ts";
import { report } from "./game.ts";
import { VERSION } from "../shared/world.ts";
export class Store {
  db: DatabaseSync;
  constructor(path: string) {
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS rooms(code TEXT PRIMARY KEY, state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS results(code TEXT PRIMARY KEY, name TEXT, version TEXT, elapsed INTEGER, hints INTEGER, assisted INTEGER, completed INTEGER);",
    );
  }
  save(r: Room) {
    this.db.exec("BEGIN");
    try {
      this.db
        .prepare(
          "INSERT INTO rooms VALUES(?,?) ON CONFLICT(code) DO UPDATE SET state=excluded.state",
        )
        .run(r.code, JSON.stringify(r));
      if (r.status === "complete" && r.mode === "ranked" && !r.simulated) {
        const v = report(r);
        this.db
          .prepare("INSERT OR IGNORE INTO results VALUES(?,?,?,?,?,?,?)")
          .run(
            r.code,
            r.name,
            r.version,
            v.elapsed,
            v.hints,
            Number(v.assisted),
            r.endedAt,
          );
      }
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  load(): Room[] {
    return (
      this.db.prepare("SELECT state FROM rooms").all() as { state: string }[]
    ).map((row) => {
      const r = JSON.parse(row.state) as Room;
      r.lastTick = Date.now();
      r.players.forEach((p) => {
        p.controller ??= "phone"; // Preserve the selected controls of legacy saves.
        p.laptop = !!p.simulated;
        p.phone = !!p.simulated;
        p.speaking = false;
        p.drafts ??= {};
        p.input = { x: 0, y: 0, at: 0 };
      });
      return r;
    });
  }
  rank(code: string) {
    const row = this.db
      .prepare("SELECT version,assisted,elapsed FROM results WHERE code=?")
      .get(code) as
      | { version: string; assisted: number; elapsed: number }
      | undefined;
    if (!row) return null;
    return (
      Number(
        (
          this.db
            .prepare(
              "SELECT COUNT(*) AS n FROM results WHERE version=? AND assisted=? AND elapsed<?",
            )
            .get(row.version, row.assisted, row.elapsed) as { n: number }
        ).n,
      ) + 1
    );
  }
  leaderboard() {
    return this.db
      .prepare(
        "SELECT code,name,version,elapsed,hints,assisted,completed,RANK() OVER (PARTITION BY version,assisted ORDER BY elapsed) AS rank FROM results WHERE version=? ORDER BY assisted ASC,elapsed ASC LIMIT 100",
      )
      .all(VERSION);
  }
  close() {
    this.db.close();
  }
}
