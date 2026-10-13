import { test, expect } from "@playwright/test";
test("laptop title, room creation, phone pairing, role selection, check and mirrored controls", async ({
  browser,
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Some nights never end." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/title-laptop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Begin an investigation" }).click();
  await page.getByLabel("Your investigator name").fill("Rowan");
  await page
    .getByLabel("Team name", { exact: true })
    .fill("Browser field test");
  await page
    .getByRole("button", { name: "Create investigation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Browser field test" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Trace Analyst/ }).click();
  await page.getByLabel("Controller preference").selectOption("phone");
  const code = await page.locator(".pair-code").innerText();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  // LAN HTTP can lack randomUUID even though getRandomValues remains available.
  await ctx.addInitScript(() =>
    Object.defineProperty(window.crypto, "randomUUID", { value: undefined }),
  );
  const phone = await ctx.newPage();
  await phone.goto("/controller");
  await phone.getByLabel("Private device-pairing code").fill(code);
  await phone.getByRole("button", { name: "Connect to my laptop" }).click();
  await expect(
    phone.getByRole("heading", { name: "You’re on the line." }),
  ).toBeVisible();
  await phone.getByRole("group", { name: "Movement joystick" }).press("ArrowUp");
  await phone
    .getByRole("button", { name: "Use text communication", exact: true })
    .click();
  await phone
    .getByRole("button", { name: "Confirm controller & audio check" })
    .click();
  await expect(
    page.getByText("Controller and communication checks complete."),
  ).toBeVisible();
  await phone.getByRole("button", { name: "I’m ready" }).click();
  await expect(
    page.getByRole("button", { name: "Not ready", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/lobby-laptop.png",
    fullPage: true,
  });
  await phone.screenshot({
    path: "test-results/lobby-phone.png",
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Browser field test" }),
  ).toBeVisible();
  await expect(
    page.getByText("Phone connected", { exact: true }),
  ).toBeVisible();
  await phone.reload();
  await expect(
    phone.getByRole("heading", { name: "You’re on the line." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await ctx.close();
});
test("small phone pairing layout and accessible settings", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    viewport: { width: 360, height: 740 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto("/controller");
  await expect(
    page.getByRole("button", { name: "Connect to my laptop" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/pair-phone.png",
    fullPage: true,
  });
  await ctx.close();
});

test("six paired sessions: phone-only exploration, role evidence and mirrored deduction", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const { io } = await import("socket.io-client");
  const { ROLES } = await import("../../shared/world");
  const bots: any[] = [],
    contexts: any[] = [],
    url = process.env.TEST_URL || "http://127.0.0.1:5175";
  const request = async (path: string, body: any) => {
    const response = await fetch(url + "/api/" + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.json() as any;
  };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let seq = 0;
  const send = (s: any, type: string, data: any = {}) =>
    s
      .timeout(4000)
      .emitWithAck("action", { id: "browser-" + ++seq, type, ...data });
  async function connect(c: any) {
    const s = io(url, { auth: c, forceNew: true });
    bots.push(s);
    const box: any = { s };
    s.on("state", (g: any) => (box.state = g));
    await new Promise<void>((r, j) => {
      s.on("connect", r);
      s.on("connect_error", j);
    });
    for (let i = 0; !box.state && i < 100; i++) await wait(10);
    return box;
  }
  try {
    const host = await request("rooms", {
      name: "BROWSER GAMEPLAY VALIDATION",
      playerName: "Rowan",
    });
    const hostBox = await connect(host);
    const key = hostBox.state.pair.code;
    hostBox.s.disconnect();
    const laptopContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    contexts.push(laptopContext);
    await laptopContext.addInitScript(
      (c) => localStorage.setItem("ltt-session", JSON.stringify(c)),
      host,
    );
    const laptop = await laptopContext.newPage();
    await laptop.goto("/");
    await expect(
      laptop.getByRole("heading", { name: "BROWSER GAMEPLAY VALIDATION" }),
    ).toBeVisible();
    const phoneContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    contexts.push(phoneContext);
    const phone = await phoneContext.newPage();
    await phone.goto("/controller#pair=" + key);
    await phone.getByRole("button", { name: "Connect to my laptop" }).click();
    await phone.getByRole("button", { name: /Trace Analyst/ }).click();
    await phone.getByRole("group", { name: "Movement joystick" }).press("ArrowUp");
    await phone
      .getByRole("button", { name: "Use text communication", exact: true })
      .click();
    await phone
      .getByRole("button", { name: "Confirm controller & audio check" })
      .click();
    await phone.getByRole("button", { name: "I’m ready" }).click();
    let engineer: any;
    for (let i = 1; i < 6; i++) {
      const c = await request("join", {
        code: host.code,
        playerName: ROLES[i].short,
      });
      const l = await connect(c),
        pc = await request("pair", { pairCode: l.state.pair.code }),
        p = await connect(pc);
      await send(p.s, "role", { role: ROLES[i].id });
      await send(p.s, "voice", { value: "text" });
      await send(p.s, "checked");
      await send(p.s, "ready");
      if (i === 3) engineer = p;
    }
    await expect(
      phone.getByRole("button", { name: "Enter Bellwether" }),
    ).toBeEnabled();
    await phone.getByRole("button", { name: "Enter Bellwether" }).click();
    await expect(
      laptop.getByRole("heading", { name: "Stay curious. Stay together." }),
    ).toBeVisible();
    await phone.getByRole("button", { name: "Step into Bellwether" }).click();
    await expect(
      laptop.getByRole("heading", { name: "Stay curious. Stay together." }),
    ).not.toBeVisible();
    const initialY = engineer.state.players.find(
      (p: any) => p.id === host.player,
    ).y;
    const up = phone.getByRole("group", { name: "Movement joystick" }),
      b = await up.boundingBox();
    await phone.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2 - 52);
    await phone.mouse.down();
    await wait(650);
    await phone.mouse.up();
    await expect
      .poll(
        () => engineer.state.players.find((p: any) => p.id === host.player).y,
      )
      .toBeLessThan(initialY - 5);
    await phone.getByRole("button", { name: "Inspect", exact: true }).click();
    await phone
      .getByRole("dialog", { name: "The boundary marker" })
      .getByRole("button", { name: "Trace light", exact: true })
      .click();
    await expect(
      laptop.getByRole("heading", { name: "The erased outward arrow" }),
    ).toBeVisible();
    await phone.getByRole("button", { name: "Share with the team" }).click();
    await expect(laptop.getByText("IN THE SHARED CASE")).toBeVisible();
    await phone.getByRole("button", { name: "Close dialog" }).click();
    await send(engineer.s, "panel", { value: "" });
    for (let i = 0; i < 5; i++) {
      engineer.s.emit("move", { x: -0.2, y: -1 });
      await wait(80);
    }
    engineer.s.emit("move", { x: 0, y: 0 });
    expect(
      (await send(engineer.s, "ability", { hotspot: "boundary" })).ok,
    ).toBe(true);
    await send(engineer.s, "share", { clue: "supply" });
    await phone.getByRole("button", { name: "Case journal" }).click();
    await phone.getByRole("button", { name: /A way into Bellwether/ }).click();
    await phone
      .getByRole("button", { name: "The municipal battery", exact: true })
      .click();
    await phone
      .getByRole("group", { name: "Keep this circuit isolated" })
      .getByRole("button", { name: "The recording ring", exact: true })
      .click();
    await expect(laptop.locator(".choice.chosen")).toHaveCount(2);
    await laptop.screenshot({
      path: "test-results/deduction-laptop.png",
      fullPage: true,
    });
    await phone.screenshot({
      path: "test-results/deduction-phone.png",
      fullPage: true,
    });
    await phone
      .getByRole("button", { name: "Commit the reconstruction" })
      .click();
    await expect(laptop.getByText("ENTERED INTO THE CASE")).toBeVisible();
    await phone.getByRole("button", { name: "Close dialog" }).click();
    await laptop.screenshot({
      path: "test-results/exploration-laptop.png",
      fullPage: true,
    });
    await phone.screenshot({
      path: "test-results/controller-phone.png",
      fullPage: true,
    });
    const perf = await laptop.evaluate(
      () => (window as any).__scenePerformance,
    );
    expect(perf.sampleFrames).toBeGreaterThan(30);
    console.log(
      "Scene frame sample (automated Chrome, not a laptop FPS guarantee):",
      perf,
    );
    await phone.getByRole("button", { name: "Town map" }).click();
    await phone.getByRole("button", { name: /Police station/ }).click();
    await expect(
      laptop.getByRole("heading", { name: "Police station", exact: true }),
    ).toBeVisible();
    await laptop.screenshot({
      path: "test-results/police-laptop.png",
      fullPage: true,
    });
    await phone.reload();
    await expect(
      phone.getByRole("heading", { name: "Police station", exact: true }),
    ).toBeVisible();
    expect(
      await phone.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    bots.forEach((s) => s.disconnect());
    for (const c of contexts) await c.close();
  }
});

test("two laptops: assigned roles, guided first deduction, speech control and nearby doorway", async ({page,request}) => {
  await page.addInitScript(() => {
    (window as any).__spoken = [];
    speechSynthesis.speak = utterance => { (window as any).__spoken.push(utterance.text); };
    speechSynthesis.cancel = () => {};
  });
  await page.goto("/");
  await page.getByRole("button", {name:"Begin an investigation"}).click();
  await page.getByLabel("Your investigator name").fill("Solo investigator");
  await page.getByLabel("Team name",{exact:true}).fill("SOLO KEYBOARD TEST");
  await page.getByRole("button",{name:"Create investigation",exact:true}).click();
  await page.getByRole("button",{name:"Distribute unclaimed roles"}).click();
  await expect(page.getByText(/6\/6 specialties assigned/)).toBeVisible();
  await expect(page.getByRole("button",{name:"Enter Bellwether"})).toBeDisabled();
  await expect(page.locator("#launch-checklist")).toContainText("At least two players");
  await page.getByRole("button",{name:/02 Audio Specialist/}).click();
  const credential=await page.evaluate(()=>JSON.parse(localStorage.getItem("ltt-session")!));
  const teammate=await joinReadyTeammate(request,credential.code);
  try {

  await page.getByRole("button",{name:"Use text communication",exact:true}).click();
  await page.getByRole("button",{name:"Confirm keyboard & audio check"}).click();
  await page.getByRole("button",{name:"I’m ready"}).click();
  await page.getByRole("button",{name:"Enter Bellwether"}).click();
  await page.getByRole("button",{name:"Read instructions aloud"}).click();
  expect(await page.evaluate(() => (window as any).__spoken.length)).toBe(1);
  await page.getByRole("button",{name:"Step into Bellwether"}).click();
  await expect(page.getByLabel("Investigation guidance")).toContainText("boundary marker");
  await page.getByLabel("Spoken guidance").check();
  await page.keyboard.down("w"); await page.waitForTimeout(450); await page.keyboard.up("w");
  await page.keyboard.press("e");
  const dialog=page.getByRole("dialog",{name:"The boundary marker"});
  await dialog.getByRole("button",{name:"Trace light",exact:true}).click();
  await dialog.getByRole("button",{name:"Share with the team"}).click();
  await dialog.getByLabel("Active specialty").selectOption("engineer");
  await dialog.getByRole("button",{name:"Diagnose",exact:true}).click();
  await dialog.getByRole("button",{name:"Share with the team"}).click();
  await dialog.getByRole("button",{name:"Close dialog"}).click();
  await page.getByRole("button",{name:"Open case journal →"}).click();
  await page.getByRole("button",{name:/A way into Bellwether/}).click();
  await page.getByRole("button",{name:"The municipal battery",exact:true}).click();
  await page.getByRole("group",{name:"Keep this circuit isolated"}).getByRole("button",{name:"The recording ring",exact:true}).click();
  await page.getByRole("button",{name:"Commit the reconstruction"}).click();
  await expect(page.getByText("ENTERED INTO THE CASE")).toBeVisible();
  await page.getByRole("button",{name:"Close dialog"}).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.keyboard.down("a"); await page.waitForTimeout(1300); await page.keyboard.up("a");
  await page.keyboard.down("w"); await page.waitForTimeout(550); await page.keyboard.up("w");
  await expect(page.getByRole("button",{name:"Enter Police station ↵"})).toBeVisible();
  await page.getByRole("button",{name:"Enter Police station ↵"}).click();
  await expect(page.getByRole("heading",{name:"Police station",exact:true})).toBeVisible();
  await page.screenshot({path:"test-results/solo-guidance.png",fullPage:true});
  await page.reload();
  await expect(page.getByRole("heading",{name:"Police station",exact:true})).toBeVisible();
  await expect(page.getByLabel("Active role")).toHaveValue("engineer");
  } finally { teammate.disconnect(); }
});

test("public directory refreshes after a host leaves or starts without reloading the page", async ({page, request}) => {
  const {io} = await import("socket.io-client");
  const url = process.env.TEST_URL || "http://127.0.0.1:5175";
  const response=await request.post("/api/rooms",{data:{name:"LIVE DIRECTORY TEST",playerName:"Directory host",public:true}});
  const credentials=await response.json();
  const host=io(url,{auth:credentials,forceNew:true});
  const teammate=await joinReadyTeammate(request,credentials.code);
  let seq=0;
  const connected=()=>new Promise<void>((resolve,reject)=>{ if(host.connected) resolve(); else { host.once("connect",resolve);host.once("connect_error",reject); }});
  const action=async(type:string,data:any={})=>{const result=await host.timeout(3000).emitWithAck("action",{id:"directory-ui-"+ ++seq,type,...data});expect(result.ok).toBe(true);};
  try {
    await connected();
    await page.goto("/");
    await page.getByRole("button",{name:"Find a public investigation"}).click();
    await expect(page.getByText("LIVE DIRECTORY TEST")).toBeVisible();
    host.disconnect();
    await expect(page.getByText("LIVE DIRECTORY TEST")).not.toBeVisible({timeout:6000});
    host.connect(); await connected();
    await expect(page.getByText("LIVE DIRECTORY TEST")).toBeVisible({timeout:6000});
    await action("assignRoles"); expect((await teammate.timeout(3000).emitWithAck("action",{id:"partner-ready-after-assignment",type:"ready"})).ok).toBe(true); await action("voice",{value:"text"}); await action("checked"); await action("ready"); await action("start");
    await expect(page.getByText("LIVE DIRECTORY TEST")).not.toBeVisible({timeout:6000});
  } finally {host.disconnect();teammate.disconnect();}
});

async function joinReadyTeammate(request: any, code: string) {
  const {io}=await import("socket.io-client");
  const response=await request.post("/api/join",{data:{code,playerName:"Partner"}});
  const credentials=await response.json();
  const socket=io(process.env.TEST_URL || "http://127.0.0.1:5175",{auth:credentials,forceNew:true});
  await new Promise<void>((resolve,reject)=>{socket.once("connect",resolve);socket.once("connect_error",reject);});
  for(const [i,action] of [{type:"claimRole",role:"audio"},{type:"voice",value:"text"},{type:"checked"},{type:"ready"}].entries()) {
    const result=await socket.timeout(3000).emitWithAck("action",{id:"partner-"+i,...action});
    expect(result.ok).toBe(true);
  }
  return socket;
}
