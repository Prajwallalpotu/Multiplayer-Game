import { test, expect } from "@playwright/test";
import { createGameServer } from "../../server/index";
import { action, addPlayer, newRoom, pair } from "../../server/game";
import { clues, finale, puzzles } from "../../server/episode";
import { HOTSPOTS, LOCATIONS, ROLES } from "../../shared/world";

test("labeled visual fixture: eight locations, six finale controls, case report and dawn at laptop and phone sizes", async ({
  browser,
}) => {
  test.setTimeout(90000);
  const server = createGameServer(":memory:");
  await new Promise<void>((r) => server.http.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + (server.http.address() as any).port;
  const r = newRoom("VISUAL TEST FIXTURE · SIMULATED", "Rowan");
  r.simulated = true;
  for (let i = 1; i < 6; i++) addPlayer(r, ROLES[i].short);
  for (let i = 0; i < 6; i++) {
    const p = r.players[i];
    p.role = ROLES[i].id;
    p.laptop = p.phone = p.checked = p.ready = true;
    p.simulated = true;
    p.voice = "text";
    pair(r, p.pair.code);
    p.checked = true;
  }
  r.status = "playing";
  r.startedAt = Date.now() - 600000;
  r.solved = puzzles.slice(0, 13).map((q) => q.id);
  r.shared = clues.map((c) => c.id);
  r.events = [
    "The forward protocol is rejected. Six stable latches await the investigators.",
  ];
  server.rooms.set(r.code, r);
  const p = r.players[0];
  const credentials = {
    code: r.code,
    player: p.id,
    token: p.token,
    device: "laptop",
  };
  const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    phoneContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
  try {
    await desktopContext.addInitScript(
      (c) => localStorage.setItem("ltt-session", JSON.stringify(c)),
      credentials,
    );
    await phoneContext.addInitScript(
      (c) => localStorage.setItem("ltt-session", JSON.stringify(c)),
      { ...credentials, device: "phone", token: p.phoneToken },
    );
    const laptop = await desktopContext.newPage(),
      phone = await phoneContext.newPage();
    await laptop.goto(url);
    await phone.goto(url + "/controller");
    await expect(
      laptop.getByText(
        "DEVELOPMENT HARNESS · SIMULATED TEAM · NOT ELIGIBLE FOR RANKING",
      ),
    ).toBeVisible();
    for (const location of LOCATIONS) {
      p.location = location.id;
      p.panel = "";
      await expect(
        laptop.getByRole("heading", { name: location.name, exact: true }),
      ).toBeVisible();
      await laptop.waitForTimeout(1000);
      await laptop.screenshot({
        path: `test-results/location-${location.id}.png`,
      });
    }
    p.location = "street";
    p.x = 45;
    p.y = 62;
    await expect(
      phone.getByRole("heading", { name: "Bellwether", exact: true }),
    ).toBeVisible();
    await phone.getByRole("button", { name: "Return 0/6" }).click();
    await expect(
      laptop.getByRole("heading", { name: "Let morning come." }),
    ).toBeVisible();
    await laptop.screenshot({ path: "test-results/finale-laptop.png" });
    await phone
      .getByRole("button", { name: "Outward, along Inez’s path", exact: true })
      .click();
    await expect(phone.getByText("RETURN ARMED · HOLDING")).toBeVisible();
    let n = 0;
    for (const f of finale.slice(1)) {
      const player = r.players.find((p) => p.role === f.role)!,
        h = HOTSPOTS.find((h) => h.id === f.hotspot)!;
      player.location = f.location;
      player.x = h.x;
      player.y = h.y;
      action(r, player, "phone", {
        id: "visual-final-" + ++n,
        type: "arm",
        answer: f.answer,
      });
    }
    await expect(
      laptop.getByRole("heading", { name: "And then, morning." }),
    ).toBeVisible();
    await expect(
      phone.getByRole("heading", { name: "And then, morning." }),
    ).toBeVisible();
    await laptop.screenshot({ path: "test-results/report-laptop.png" });
    await phone.screenshot({ path: "test-results/report-phone.png" });
    await phone.getByRole("button", { name: "Walk into the morning" }).click();
    await laptop.waitForTimeout(1100);
    await laptop.screenshot({ path: "test-results/dawn-laptop.png" });
    const completedTime = r.activeMs;
    await phone.getByRole("button", { name: "Town map", exact: true }).click();
    await phone.getByRole("button", { name: /Police station/ }).click();
    await expect(
      laptop.getByRole("heading", { name: "Police station", exact: true }),
    ).toBeVisible();
    expect(r.activeMs).toBe(completedTime);

    expect(
      await phone.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await laptop.getByRole("button", { name: "Settings", exact: true }).click();
    await laptop.getByLabel("Reduced motion & effects").check();
    await laptop.getByLabel("Larger text").check();
    await laptop.getByRole("button", { name: "Close dialog" }).click();
    await phone
      .getByRole("button", { name: "Case report", exact: true })
      .click();
    await laptop.screenshot({ path: "test-results/report-large-reduced.png" });
  } finally {
    await desktopContext.close();
    await phoneContext.close();
    await server.close();
  }
});
