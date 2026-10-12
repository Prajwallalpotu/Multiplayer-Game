import {test,expect} from "@playwright/test";
import {createGameServer} from "../../server/index";
import {newRoom,addPlayer} from "../../server/game";
import {newHandsOn} from "../../shared/handsOn";
import {ROLES} from "../../shared/world";

test("hands-on trail, shared rewards, logo home and saved resume",async({browser})=>{
  test.setTimeout(90000);
  const server=createGameServer(":memory:");await new Promise<void>(resolve=>server.http.listen(0,"127.0.0.1",resolve));
  const url="http://127.0.0.1:"+(server.http.address() as any).port;
  const r=newRoom("INTERACTIVE PUZZLE TEST","Puzzle player");const p=r.players[0];
  r.status="playing";r.solved=["p01","p02"];r.startedAt=Date.now();p.roles=ROLES.map(x=>x.id);p.role="trace";p.location="archive";p.x=28;p.y=68;
  server.rooms.set(r.code,r);
  const ctx=await browser.newContext();await ctx.addInitScript(c=>localStorage.setItem("ltt-session",JSON.stringify(c)),{code:r.code,player:p.id,token:p.token,device:"laptop"});
  const page=await ctx.newPage();
  try{
    await page.goto(url);await page.getByRole("button",{name:"Inspect The scrambled picture",exact:true}).click();
    await page.screenshot({animations:"disabled",path:"test-results/picture-puzzle.png"});
    for(let i=0;i<4;i++) for(let n=0;n<(4-newHandsOn().frame[i])%4;n++) await page.getByRole("button",{name:`Rotate picture tile ${i+1}`,exact:true}).click();
    await expect(page.getByText("3 1 4 2",{exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Close dialog"}).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.getByRole("button",{name:"The Last Ten Minutes — home"}).click();
    await expect(page.getByRole("heading",{name:"Some nights never end."})).toBeVisible();
    await page.getByRole("button",{name:"Resume saved investigation"}).click();
    await expect(page.getByRole("heading",{name:"Municipal archive",exact:true})).toBeVisible();
    const travel=async(name:string)=>{await page.getByRole("button",{name:"Town map"}).click();await page.getByRole("dialog",{name:"Follow the next lead."}).getByRole("button",{name:new RegExp(name)}).click();await expect(page.getByRole("dialog")).not.toBeVisible();};
    await travel("Bellwether");await travel("St. Agnes clinic");
    await page.keyboard.down("a");await page.waitForTimeout(1200);await page.keyboard.up("a");
    await page.getByRole("button",{name:"Inspect The locked cupboard",exact:true}).click();
    for(const [i,n] of [3,1,4,2].entries())for(let j=0;j<n;j++)await page.getByRole("button",{name:`Increase digit ${i+1}`,exact:true}).click();
    await page.getByRole("button",{name:"Try the cupboard latch"}).click();
    await expect(page.getByText("Brass winding key recovered",{exact:true})).toBeVisible();
    await page.screenshot({animations:"disabled",path:"test-results/cupboard-reward.png"});
    await page.getByRole("button",{name:"Close dialog"}).click();await expect(page.getByRole("dialog")).not.toBeVisible();
    await travel("Bellwether");await travel("Clock tower");
    await page.keyboard.down("a");await page.waitForTimeout(1100);await page.keyboard.up("a");
    await page.getByRole("button",{name:"Inspect Inez’s music box",exact:true}).click();
    await page.getByRole("button",{name:"Insert winding key"}).click();
    for(let i=0;i<9;i++)for(let n=0;n<(4-newHandsOn().pipes[i])%4;n++) {
      if(r.handsOn?.opened.includes("music")) break;
      const before=r.handsOn!.pipes[i];
      await page.getByRole("button",{name:`Rotate channel ${i+1}`,exact:true}).click();
      await expect.poll(()=>r.handsOn!.pipes[i]).not.toBe(before);
    }
    await expect(page.getByText("You brought back a little morning.",{exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Play Inez’s morning melody"}).click();
    await page.screenshot({animations:"disabled",path:"test-results/music-box-reward.png"});
    await page.setViewportSize({width:390,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({animations:"disabled",path:"test-results/music-box-phone.png"});
    await page.getByRole("button",{name:"Open Team inventory"}).click();
    await expect(page.getByText(/Morning melody restored/)).toBeVisible();
    await page.reload();await expect(page.getByText(/Morning melody restored/)).toBeVisible();
    await page.getByRole("button",{name:"Close dialog"}).click();await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.getByRole("button",{name:"Save & exit",exact:true}).click();
    await page.getByRole("button",{name:"Save & exit for everyone"}).click();
    await expect(page.getByRole("heading",{name:"Some nights never end."})).toBeVisible();
    expect(r.manualPause).toBe(true);expect(r.handsOn?.opened).toContain("music");
  }finally{await ctx.close();await server.close();}
});

test("automatic speech waits for the current reading, enabling unchanged guidance works, cancellation is quiet",async({browser})=>{
  const server=createGameServer(":memory:");await new Promise<void>(resolve=>server.http.listen(0,"127.0.0.1",resolve));
  const url="http://127.0.0.1:"+(server.http.address() as any).port;
  const r=newRoom("Speech regression","Narrator"),p=r.players[0];r.status="playing";p.role="trace";p.roles=ROLES.map(x=>x.id);server.rooms.set(r.code,r);
  const ctx=await browser.newContext();
  await ctx.addInitScript(c=>{
    localStorage.setItem("ltt-session",JSON.stringify(c));
    const state:any=(window as any).__speech={spoken:[] as any[],cancels:0};
    speechSynthesis.speak=u=>{state.spoken.push(u);state.current=u;};
    speechSynthesis.cancel=()=>{state.cancels++;state.current?.onerror?.({error:"interrupted"});};
  },{code:r.code,player:p.id,token:p.token,device:"laptop"});
  const page=await ctx.newPage();
  try{
    await page.goto(url);await page.getByLabel("Spoken guidance").check();
    await expect.poll(()=>page.evaluate(()=>(window as any).__speech.spoken.length)).toBe(1);
    const cancels=await page.evaluate(()=>(window as any).__speech.cancels);
    p.observations.push("perimeter");
    await expect(page.getByLabel("Investigation guidance")).toContainText("Share “The erased outward arrow”");
    await page.waitForTimeout(1400);
    expect(await page.evaluate(()=>(window as any).__speech.cancels)).toBe(cancels);
    expect(await page.evaluate(()=>(window as any).__speech.spoken.length)).toBe(1);
    await page.evaluate(()=>{const s=(window as any).__speech;for(let i=0;i<20&&!s.current.text.includes("Share");i++)s.current.onend();});
    expect(await page.evaluate(()=>(window as any).__speech.current.text)).toContain("Share");
    await page.getByRole("button",{name:"Stop reading",exact:true}).click();
    await expect(page.getByText(/Speech could not play/)).not.toBeVisible();
  }finally{await ctx.close();await server.close();}
});

test("lobby explains missing requirements and clears them when the team is ready", async ({browser}) => {
  const server=createGameServer(":memory:");
  await new Promise<void>(resolve=>server.http.listen(0,"127.0.0.1",resolve));
  const r=newRoom("LOBBY CHECKLIST TEST","Alex"); const p=r.players[0];
  p.controller="laptop"; p.checked=true; p.voice="text";
  server.rooms.set(r.code,r);
  const ctx=await browser.newContext();
  await ctx.addInitScript(c=>localStorage.setItem("ltt-session",JSON.stringify(c)),{code:r.code,player:p.id,token:p.token,device:"laptop"});
  const page=await ctx.newPage();
  try {
    await page.goto("http://127.0.0.1:"+(server.http.address() as any).port);
    const checklist=page.locator("#launch-checklist");
    await expect(checklist).toContainText("Assign the missing specialties:");
    await expect(checklist).toContainText("Alex: choose a specialty; select I’m ready.");
    await expect(page.getByRole("button",{name:"Enter Bellwether"})).toBeDisabled();
    await page.getByRole("button",{name:"Distribute unclaimed roles"}).click();
    await expect(checklist).not.toContainText("Assign the missing specialties:");
    await page.getByRole("button",{name:"I’m ready",exact:true}).click();
    await expect(checklist).toHaveText("Your team is ready to enter Bellwether");
    await expect(page.getByRole("button",{name:"Enter Bellwether"})).toBeEnabled();
  } finally { await ctx.close(); await server.close(); }
});
