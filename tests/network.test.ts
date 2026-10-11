import { test } from "node:test";
import assert from "node:assert/strict";
import { io, type Socket } from "socket.io-client";
import { createGameServer } from "../server/index.ts";
import { ROLES } from "../shared/world.ts";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
function connect(url: string, auth: any) {
  return new Promise<Socket>((resolve, reject) => {
    const s = io(url, { auth, forceNew: true, reconnection: false });
    s.on("connect", () => resolve(s));
    s.on("connect_error", (e) => {
      s.close();
      reject(e);
    });
  });
}
test("six laptops + six phones: authentication, pairing isolation, role race, shared state, reconnect and voice scoping", async () => {
  const server = createGameServer(":memory:");
  await new Promise<void>((r) => server.http.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + (server.http.address() as any).port,
    sockets: Socket[] = [];
  const req = async (path: string, body: any) => {
    const r = await fetch(url + "/api/" + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: any = await r.json();
    if (!r.ok) throw Error(data.error);
    return data;
  };
  let seq = 0;
  const send = (s: Socket, type: string, data: any = {}) =>
    s
      .timeout(3000)
      .emitWithAck("action", { id: "net-" + ++seq, type, ...data });
  try {
    const first = await req("rooms", {
      name: "Network team",
      playerName: "P0",
    });
    const credentials = [first];
    for (let i = 1; i < 6; i++)
      credentials.push(
        await req("join", { code: first.code, playerName: "P" + i }),
      );
    await assert.rejects(
      () => req("join", { code: first.code, playerName: "P6" }),
      /six seats/,
    );
    await assert.rejects(
      () => connect(url, { ...first, token: "wrong" }),
      /authorization/,
    );
    const laptops: Socket[] = [],
      phones: Socket[] = [],
      phoneCredentials: any[] = [];
    for (const c of credentials) {
      const s = await connect(url, c);
      sockets.push(s);
      laptops.push(s);
      const r = server.rooms.get(first.code)!,
        p = r.players.find((p) => p.id === c.player)!;
      const pc = await req("pair", { pairCode: p.pair.code });
      phoneCredentials.push(pc);
      const phone = await connect(url, pc);
      sockets.push(phone);
      phones.push(phone);
    }
    const race = await Promise.all([
      send(laptops[0], "role", { role: "trace" }),
      send(laptops[1], "role", { role: "trace" }),
    ]);
    assert.equal(race.filter((x) => x.ok).length, 1);
    for (let i = 0; i < 6; i++) {
      assert((await send(phones[i], "role", { role: ROLES[i].id })).ok);
      assert((await send(phones[i], "voice", { value: "text" })).ok);
      assert((await send(phones[i], "checked")).ok);
      assert((await send(phones[i], "ready")).ok);
    }
    assert((await send(phones[0], "start")).ok);
    for (const s of phones) await send(s, "panel", { value: "" });
    const r = server.rooms.get(first.code)!;
    assert.equal(r.players.length, 6);
    const x = r.players[0].x,
      xOther = r.players[1].x;
    phones[0].emit("move", { x: 1, y: 0 });
    await wait(220);
    assert(r.players[0].x > x);
    assert.equal(r.players[1].x, xOther);
    await wait(450);
    const stopped = r.players[0].x;
    await wait(150);
    assert.equal(r.players[0].x, stopped);
    // Voice messages may only travel phone-to-phone inside the authenticated room.
    const outsider = await req("rooms", {
      name: "Other team",
      playerName: "Outsider",
    });
    const otherRoom = server.rooms.get(outsider.code)!;
    const oc = await req("pair", { pairCode: otherRoom.players[0].pair.code });
    const otherPhone = await connect(url, oc);
    sockets.push(otherPhone);
    let leaked = false,
      received = false;
    otherPhone.on("voice:signal", () => (leaked = true));
    phones[1].on("voice:signal", (m) => {
      if (m.from === first.player) received = true;
    });
    phones[0].emit("voice:signal", {
      to: credentials[1].player,
      type: "hello",
    });
    phones[0].emit("voice:signal", { to: oc.player, type: "hello" });
    await wait(100);
    assert(received);
    assert(!leaked);
    assert(!(await send(laptops[0], "checked")).ok);
    phones[0].disconnect();
    await wait(100);
    assert.equal(r.players[0].phone, false);
    const before = r.activeMs;
    await wait(150);
    assert.equal(r.activeMs, before);
    const re = await connect(url, phoneCredentials[0]);
    sockets.push(re);
    assert.equal(r.players.length, 6);
    assert.equal(r.players[0].role, "trace");
    assert.equal(r.players[0].phone, true);
    assert(
      (
        await send(re, "draft", {
          puzzle: "p01",
          slot: 0,
          value: "The municipal battery",
        })
      ).ok,
    );
    assert.equal(r.players[0].drafts.p01[0], "The municipal battery");
    const list: any = await (await fetch(url + "/api/rooms")).json();
    assert.equal(list.length, 0);
    assert.deepEqual(await (await fetch(url + "/api/leaderboard")).json(), []);
  } finally {
    for (const s of sockets) s.close();
    await wait(50);
    await server.close();
  }
});

test("public directory hides disconnected hosts and started rooms; laptop voice stays room-scoped", async () => {
  const server = createGameServer(":memory:");
  await new Promise<void>(r => server.http.listen(0,"127.0.0.1",r));
  const url = "http://127.0.0.1:" + (server.http.address() as any).port;
  const sockets: Socket[] = [];
  const post = async (path: string, body: any) => (await fetch(url+"/api/"+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})).json() as any;
  const list = async () => (await fetch(url+"/api/rooms")).json() as any;
  let seq=0;
  const send = (s:Socket,type:string,data:any={}) => s.timeout(3000).emitWithAck("action",{id:"directory-"+ ++seq,type,...data});
  try {
    const c = await post("rooms",{name:"Public test",playerName:"Host",public:true});
    assert.equal((await list()).length,0);
    let host = await connect(url,c); sockets.push(host);
    assert.equal((await list()).length,1);
    host.disconnect(); await wait(50);
    assert.equal((await list()).length,0);
    host=await connect(url,c);sockets.push(host);
    assert.equal((await list()).length,1);
    const guestCred=await post("join",{code:c.code,playerName:"Guest"});
    const guest=await connect(url,guestCred);sockets.push(guest);
    let heard=false;guest.on("voice:signal",()=>heard=true);
    host.emit("voice:signal",{to:guestCred.player,type:"hello"});await wait(50);assert(heard);
    assert((await send(host,"assignRoles")).ok);
    for(const s of [host,guest]) {
      assert((await send(s,"voice",{value:"text"})).ok);
      assert((await send(s,"checked")).ok);assert((await send(s,"ready")).ok);
    }
    assert((await send(host,"start")).ok);
    assert.equal((await list()).length,0);
  } finally { sockets.forEach(s=>s.close());await wait(30);await server.close(); }
});
