import { useState } from "react";
import { connectedPipes, newHandsOn, PIPE_PORTS } from "../shared/handsOn";
import type { GameView } from "../shared/world";
import { playMorningMelody } from "./audio";
export function TeamInventory({game}: {game: GameView}) {
  const opened = game.handsOn?.opened || [];
  return <section className="inventory-trail">
    <p className="muted">A little piece of Bellwether worth bringing back. This shared trail is optional; your main investigation stays saved.</p>
    <ol>
      <li className={opened.includes("frame") ? "collected" : ""}><b>01 · Restore the picture</b><span>Municipal archive · The scrambled picture</span>{opened.includes("frame") ? <strong>Combination recovered: 3142</strong> : <span>Turn the four tiles until the picture joins up. A hidden strip will reveal a code.</span>}</li>
      <li className={opened.includes("cupboard") ? "collected" : ""}><b>02 · Open the cupboard</b><span>St. Agnes clinic · The locked cupboard</span>{opened.includes("cupboard") ? <strong>⚿ Brass winding key collected · shared with everyone</strong> : <span>Use the picture’s four-digit combination on the brass wheels.</span>}</li>
      <li className={opened.includes("music") ? "collected" : ""}><b>03 · Bring back the melody</b><span>Clock tower · Inez’s music box</span>{opened.includes("music") ? <><strong>♫ Morning melody restored</strong><button className="btn" onClick={playMorningMelody}>Play the recovered melody</button></> : <span>Insert the winding key, then connect all nine air channels from inlet to outlet.</span>}</li>
    </ol>
  </section>;
}
function Picture({tile = -1}: {tile?:number}) {
  return <svg viewBox={tile < 0 ? "0 0 200 200" : `${tile%2*100} ${Math.floor(tile/2)*100} 100 100`} aria-hidden="true">
    <rect width="200" height="200" fill="#b6c2a3"/><circle cx="157" cy="40" r="22" fill="#f2d597"/>
    <path d="M0 102L40 42 100 106 133 76 200 116V200H0Z" fill="#577c6e"/>
    <path d="M0 140Q70 96 100 145T200 145V200H0Z" fill="#2c5957"/>
    <path d="M84 200Q160 170 106 142T89 89" fill="none" stroke="#d5e5c5" strokeWidth="14"/>
    <path d="M88 16L116 62 87 103 58 59Z" fill="#b65b48" stroke="#633d32" strokeWidth="2"/>
    <path d="M88 16L87 103M58 59L116 62M87 103Q60 120 94 135T78 174" fill="none" stroke="#e9c994" strokeWidth="2"/>
    <path d="M0 185H200" stroke="#d5c398" strokeWidth="5"/>
  </svg>;
}
export default function HandsOn({game, puzzle, act}: {game:GameView;puzzle:string;act:(type:string,data?:any)=>Promise<boolean>}) {
  const state = game.handsOn || newHandsOn();
  const [digits,setDigits]=useState([0,0,0,0]);
  const [busy,setBusy]=useState(false);
  const [reference,setReference]=useState(false);
  const solved=state.opened.includes(puzzle);
  const submit=async(data:any)=>{if(busy)return;setBusy(true);try{await act("handsOn",{puzzle,...data});}finally{setBusy(false);}};
  const filled=connectedPipes(state.pipes);
  return <div className={"hands-on " + (solved ? "puzzle-won" : "")}>
    <div className="hands-on-instructions">
      <span className="eyebrow">BELLWETHER’S SMALL WONDERS · SHARED TEAM PUZZLE</span>
      <p>{puzzle === "frame" ? "Rotate the four tiles to restore the kite, river and skyline. Follow the seams. Each click turns a tile clockwise; the frame opens when the whole picture fits." : puzzle === "cupboard" ? "Set the brass wheels to the combination hidden behind the archive picture. Then try the latch. The contents belong to the whole team." : "Use the cupboard key to wind the mechanism. Rotate the brass channels to make one continuous route through all nine tiles, from the upper-left inlet to the lower-right outlet. The melody returns when every channel connects."}</p>
    </div>
    {puzzle === "frame" && <>
      <div className="picture-frame">{state.frame.map((rotation,i)=><button key={i} aria-label={`Rotate picture tile ${i+1}`} disabled={busy||solved} onClick={()=>void submit({tile:i})}>
        <div style={{transform:`rotate(${rotation*90}deg)`}}><Picture tile={i}/></div><span className="tile-index">{i+1} ↻</span>
      </button>)}</div>
      {!solved && <button className="text-btn" onClick={()=>setReference(!reference)}>{reference ? "Hide" : "Look at"} the faded reference sketch</button>}
      {reference && !solved && <div className="picture-reference"><Picture/></div>}
      {solved && <div className="reward-reveal" role="status"><span>FRAME RESTORED · A HIDDEN STRIP SLIDES OUT</span><strong className="lock-code">3 1 4 2</strong><p>The clinic cupboard combination is now in Team inventory.</p></div>}
    </>}
    {puzzle === "cupboard" && <div className={"cabinet " + (solved ? "cabinet-open" : "")}>
      <div className="cabinet-plaque">ST. AGNES · SMALL REPAIRS</div>
      {solved ? <div className="reward-reveal" role="status"><span className="key-reward" aria-hidden="true">⚿</span><strong>Brass winding key recovered</strong><p>A folded note: “For the music box in the clock tower. Morning should have a tune. — Inez”</p><span>ADDED TO TEAM INVENTORY</span></div> : <>
        <div className="lock-wheels">{digits.map((digit,i)=><div key={i}>
          <button aria-label={`Increase digit ${i+1}`} onClick={()=>setDigits(old=>old.map((d,j)=>i===j?(d+1)%10:d))}>▲</button>
          <output aria-label={`Digit ${i+1}`}>{digit}</output>
          <button aria-label={`Decrease digit ${i+1}`} onClick={()=>setDigits(old=>old.map((d,j)=>i===j?(d+9)%10:d))}>▼</button>
        </div>)}</div>
        <button className="btn primary" disabled={busy||!state.opened.includes("frame")} onClick={()=>void submit({code:digits.join("")})}>Try the cupboard latch</button>
        <p className="fine">{state.opened.includes("frame") ? "Recovered combination: 3142 · Team inventory" : "The archive picture holds the combination. Restore it first."}</p>
      </>}
    </div>}
    {puzzle === "music" && <>
      {!state.opened.includes("key") ? <div className="key-socket"><span aria-hidden="true">⚿</span><button className="btn primary" disabled={busy||!state.opened.includes("cupboard")} onClick={()=>void submit({operation:"insertKey"})}>Insert winding key</button><p>{state.opened.includes("cupboard") ? "The team’s brass key fits this socket." : "Find the key in the clinic cupboard."}</p></div> : <>
        <div className="pipe-label inlet">AIR IN →</div><div className="pipe-board">{state.pipes.map((rotation,i)=><button key={i} aria-label={`Rotate channel ${i+1}`} disabled={busy||solved} className={filled.includes(i) ? "air-flow" : ""} onClick={()=>void submit({tile:i})}>
          <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="37" fill="#183d3b" stroke="#aa8b56" strokeDasharray="4 5" strokeWidth="5"/>
            {PIPE_PORTS[i].map(port=>{const end=[[50,0],[100,50],[50,100],[0,50]][(port+rotation)%4];return <path key={port} d={`M50 50L${end[0]} ${end[1]}`} stroke="currentColor" strokeWidth="11"/>;})}
            <circle cx="50" cy="50" r="8" fill="#e3d4aa"/></svg><span>{i+1} ↻</span>
        </button>)}</div><div className="pipe-label outlet">→ MELODY OUT</div>
        {solved ? <div className="reward-reveal" role="status"><div className="music-sun" aria-hidden="true">☀</div><strong>You brought back a little morning.</strong><p>The lid opens. A wooden sunrise turns above the repaired pipes.</p><button className="btn primary" onClick={playMorningMelody}>Play Inez’s morning melody</button><span>TEAM KEEPSAKE RECOVERED</span></div> : <p className="fine">Lit channels carry air. Use every tile once; a connection through a wall stops the flow.</p>}
      </>}
    </>}
  </div>;
}
