import { test, expect, chromium, type Page } from "@playwright/test";
import { io } from "socket.io-client";
test("mixed laptop and phone WebRTC mesh negotiates synthetic audio, mute/PTT work, denied permission offers text fallback", async () => {
  test.setTimeout(90000);
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  const url = process.env.TEST_URL || "http://127.0.0.1:5175";
  const sockets: any[] = [],
    contexts: any[] = [];
  async function request(path: string, body: any) {
    const r = await fetch(url + "/api/" + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json() as any;
  }
  async function laptop(cred: any) {
    const s = io(url, { auth: cred, forceNew: true });
    sockets.push(s);
    return await new Promise<any>((r, j) => {
      s.once("state", r);
      s.once("connect_error", j);
    });
  }
  try {
    const c1 = await request("rooms", {
        name: "SYNTHETIC VOICE TEST",
        playerName: "Voice one",
      }),
      c2 = await request("join", { code: c1.code, playerName: "Voice two" });
    const pages: Page[] = [];
    for (const cred of [c1, c2]) {
      const l = await laptop(cred);
      const context = await browser.newContext({
        baseURL: url,
        permissions: ["microphone"],
        viewport: { width: 390, height: 844 },
      });
      contexts.push(context);
      await context.addInitScript(() => {
        const Original = RTCPeerConnection;
        (window as any).__peers = [];
        (window as any).RTCPeerConnection = class extends Original {
          constructor(c?: RTCConfiguration) {
            super(c);
            (window as any).__peers.push(this);
          }
        };
      });
      if (cred === c2) await context.addInitScript(c => localStorage.setItem("ltt-session",JSON.stringify(c)), cred);
      const p = await context.newPage();
      pages.push(p);
      if (cred === c1) {
        await p.goto("/controller#pair=" + l.pair.code);
        await p.getByRole("button", { name: "Connect to my laptop" }).click();
      } else {
        sockets.at(-1).disconnect();
        await p.goto("/");
      }
      await p
        .getByRole("button", { name: "Enable microphone", exact: true })
        .click();
      await expect(
        p.getByRole("button", { name: "Retry voice", exact: true }),
      ).toBeVisible();
    }
    for (const p of pages)
      await expect
        .poll(
          () =>
            p.evaluate(() =>
              (window as any).__peers.some(
                (pc: RTCPeerConnection) => pc.connectionState === "connected",
              ),
            ),
          { timeout: 20000 },
        )
        .toBe(true);
    await expect
      .poll(
        async () =>
          await pages[0].evaluate(async () => {
            let bytes = 0;
            for (const pc of (window as any).__peers) {
              const stats = await pc.getStats();
              stats.forEach((s: any) => {
                if (s.type === "inbound-rtp" && s.kind === "audio")
                  bytes += s.bytesReceived;
              });
            }
            return bytes;
          }),
        { timeout: 10000 },
      )
      .toBeGreaterThan(0);
    await pages[0].getByRole("button", { name: "Mute", exact: true }).click();
    expect(
      await pages[0].evaluate(
        () => (window as any).__peers.at(-1).getSenders()[0].track.enabled,
      ),
    ).toBe(false);
    await pages[0].getByRole("button", { name: "Unmute", exact: true }).click();
    await pages[0].getByLabel("Push to talk").check();
    expect(
      await pages[0].evaluate(
        () => (window as any).__peers.at(-1).getSenders()[0].track.enabled,
      ),
    ).toBe(false);
    await pages[0]
      .getByRole("button", { name: "Use text communication", exact: true })
      .click();
    await pages[0].evaluate(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException("Test permission denial", "NotAllowedError");
      };
    });
    await pages[0]
      .getByRole("button", { name: "Enable microphone", exact: true })
      .click();
    await expect(pages[0].getByText(/Microphone denied/)).toBeVisible();
    await pages[0]
      .getByRole("button", { name: "Use text communication", exact: true })
      .click();
    await expect(
      pages[0].getByText("Text communication selected. Use Team messages."),
    ).toBeVisible();
  } finally {
    sockets.forEach((s) => s.disconnect());
    for (const c of contexts) await c.close();
    await browser.close();
  }
});
