import type { Role, LocationId } from "../shared/world.ts";
export type Clue = {
  id: string;
  title: string;
  role: Role;
  location: LocationId;
  hotspot: string;
  text: string;
};
export const clues: Clue[] = [];
function c(
  id: string,
  title: string,
  role: Role,
  location: LocationId,
  hotspot: string,
  text: string,
) {
  clues.push({ id, title, role, location, hotspot, text });
  return id;
}
const perimeter = c(
  "perimeter",
  "The erased outward arrow",
  "trace",
  "street",
  "boundary",
  "Under the paint, the arrow points OUT. Footprints end at the inner posts, but the road beyond the outer posts carries no repeating trace. The six strangers arrived after the boundary formed.",
);
const supply = c(
  "supply",
  "Two separate circuits",
  "engineer",
  "street",
  "boundary",
  "The gate uses an ordinary municipal battery. The inner posts connect to a separate recording ring. Bridging these circuits would energize the ring; opening only the municipal gate leaves it isolated.",
);
const call = c(
  "call",
  "Dispatch reel · restored",
  "audio",
  "police",
  "dispatch",
  "TRANSCRIPT, 23:56: Mara: “Not a fire. A pulse. Kit is upstairs; I’m going back.” Dispatch: “Stay inside.” Three low knocks follow. The evacuation siren is absent. VISUAL: three short low-frequency pulses, no siren band.",
);
const soot = c(
  "soot",
  "Dust, not ash",
  "forensic",
  "police",
  "dispatch",
  "The windowsill holds undisturbed grey paper dust, not combustion ash. The door is bolted from inside. Six unfinished mugs are still warm. A fire evacuation would disturb these surfaces.",
);
const route = c(
  "route",
  "Mara’s unfinished journey",
  "trace",
  "clinic",
  "ward",
  "One set of nurse’s shoe prints travels from the treatment table toward the upstairs ward. They repeat in place at the last step. No track leads out of the clinic. A child’s print waits upstairs.",
);
const dose = c(
  "dose",
  "A prepared dose",
  "forensic",
  "clinic",
  "ward",
  "The syringe holds an ordinary measured insulin dose. Its cap is intact, and the chart says “Kit, before midnight.” No sedative, toxin, or mass illness is present. Mara’s note reads: “Keep the light on. I will be there.”",
);
const pump = c(
  "pump",
  "The stopped infusion",
  "engineer",
  "clinic",
  "ward",
  "A battery infusion timer reads 23:52 and resumes the same single tick. Its independent clock was outside the experiment network. Powered objects repeat, but the unpowered chart is unchanged.",
);
const symbols = c(
  "symbols",
  "The council’s directional notation",
  "cipher",
  "archive",
  "ledger",
  "The town’s service ledger uses a circle for the ring, a bar for isolation, and an open chevron for return to the river boundary. RETURN means releasing the recorded interval outward; RESET means recording a fresh interval. These are not synonyms.",
);
const fragment = c(
  "fragment",
  "An empty demonstration chair",
  "temporal",
  "archive",
  "ledger",
  "An echo shows Voss at the council: “Only those inside the ring when recording begins can be recalled.” The clock reads 23:50. A later fragment shows the same chair empty. Visitors entering after capture are not yet part of it.",
);
const daughter = c(
  "daughter",
  "A dedication, not a test subject",
  "audio",
  "archive",
  "ledger",
  "RESTORED TAPE: “For Ada. If I could just hear that last afternoon again.” The archival label dates her death eight months ago. The array’s specification says ten-minute recordings only. VISUAL: the speech track is intact beneath a steady mains hum.",
);
const correction = c(
  "correction",
  "Inez’s four-minute correction",
  "cipher",
  "clock",
  "clockwork",
  "Service log: RADIO SYNC = TRUE TIME + 04:00. The clock face was corrected by Inez; the radio timestamp was not. Subtract four minutes from radio stamps. Her return-gate note is signed 23:58 true time.",
);
const gate = c(
  "gate",
  "The gate opened first",
  "temporal",
  "clock",
  "clockwork",
  "Inez opens the outward gate at 23:58 by the corrected face. One minute later, an override pulse turns every hand toward midnight. Her action precedes the override; it does not cause it.",
);
const outward = c(
  "outward",
  "The path Inez left",
  "trace",
  "clock",
  "clockwork",
  "A luminous disturbance leads from the clock’s open return gate toward the street boundary. Its repeating motion travels outward. The forward path points the opposite way and ends at the chamber.",
);
const cut = c(
  "cut",
  "A deliberate cut",
  "engineer",
  "power",
  "conductor",
  "A sharp tool cut the RETURN conductor while the FORWARD supply stayed live. No overload scars. A repaired bridge conducts in both directions: if FORWARD remains live, it feeds the ring again. The remote gate must remain closed until the repaired return can carry current. Compare its route with the trace at the clock.",
);
const tool = c(
  "tool",
  "The cutter and the blood",
  "forensic",
  "power",
  "conductor",
  "Voss’s tagged insulated cutter fits the clean cut. A fresh smear on its handle matches the wound visible in the chamber’s physical access photograph. The safety wire was cut by a person; Inez’s distant clock control cannot cut it.",
);
const crossing = c(
  "crossing",
  "One arrival at the cable",
  "trace",
  "power",
  "conductor",
  "Voss’s distinctive damaged left heel approaches the conductor, stops, and returns to the chamber. The maintenance dust contains no other fresh approach. The cutter was not planted after the capture: there are no later tracks.",
);
const splice = c(
  "splice",
  "A voice across the carrier",
  "audio",
  "radio",
  "broadcast",
  "ISOLATED TRACKS: a faint original voice says “Abort. Carry the return outward.” Over it, the guide says “Restart. I can bring everyone back.” The guide and the archive dedication share the same breath, cadence and clipped final consonants.",
);
const identity = c(
  "identity",
  "The authenticated override",
  "cipher",
  "radio",
  "broadcast",
  "The radio log signs the override E.VOSS at 00:03 RADIO TIME. Inez’s key can open RETURN only; it cannot authorize FORWARD or OVERRIDE. “Rescue protocol” was added to the restart instructions after the signature.",
);
const chronology = c(
  "chronology",
  "A sequence across the fracture",
  "temporal",
  "chamber",
  "array",
  "Three fragments arrive out of order. Voss presses OVERRIDE beside a radio monitor reading 00:03. In another fragment, the recording lamp starts beside the municipal face at 23:50. A third shows a severed-return alert marked 23:57 on a maintenance receipt. The clock gate is outside this camera’s view. Compare the clockkeeper’s observation and the radio correction before ordering these events.",
);
const fresh = c(
  "fresh",
  "A new boundary preview",
  "trace",
  "chamber",
  "array",
  "The RESTART preview includes six new silhouettes standing where the investigators now stand. The existing residents remain in the same inner band. Nothing in the preview travels outward.",
);
const intent = c(
  "intent",
  "Voss’s final rehearsal",
  "audio",
  "chamber",
  "array",
  "RESTORED PRIVATE MEMO: “Ada was never in the first recording. I know. Another cycle, perhaps a longer one. Six people on the outside can rearm the paths. I can tell them it is a rescue.” The carrier cannot move physical switches outside the recording.",
);
const isolator = c(
  "isolator",
  "The safety trip remains",
  "engineer",
  "chamber",
  "array",
  "The original overload trip is intact. A restart attempt will isolate the ring before capture and show its proposed subjects. Resetting the trip does not erase evidence. Reversal uses the RETURN bus; restart always uses FORWARD.",
);
const living = c(
  "living",
  "The people inside",
  "forensic",
  "chamber",
  "array",
  "The occupancy roll lists Mara Vale, Kit Mercer, Inez Reed and 184 other living residents at 23:50. Ada Voss is not on it. The array has neither her body nor any recording of her lifetime. Address the living occupancy roll, not Voss’s memorial.",
);
const address = c(
  "address",
  "How the return is addressed",
  "cipher",
  "chamber",
  "array",
  "The return manifold accepts the municipal occupancy roll plus the open-chevron OUT route. A memorial archive is a reference, not an occupied address. A closed circle routes the interval back into itself.",
);
const pulse = c(
  "pulse",
  "A stable latch",
  "temporal",
  "chamber",
  "array",
  "The six return latches hold until deliberately changed. Their order is irrelevant, provided each is configured to the same pre-override state: Inez’s gate at 23:58 true time. The return releases the last recorded positions into present time; it does not resurrect anyone.",
);
export type Puzzle = {
  id: string;
  title: string;
  location: LocationId;
  act: number;
  prerequisites: string[];
  needs: string[];
  prompt: string;
  kind: string;
  slots: { label: string; options: string[] }[];
  answer: string[];
  hints: string[];
  wrong: string;
  result: string;
  purpose: string;
};
const slot = (label: string, ...options: string[]) => ({ label, options });
export const puzzles: Puzzle[] = [
  {
    id: "p01",
    title: "A way into Bellwether",
    location: "street",
    act: 0,
    prerequisites: [],
    needs: [perimeter, supply],
    kind: "circuit",
    prompt:
      "Open the town gate without enrolling anyone in the recording ring. Compare the erased marks with the separate circuits.",
    slots: [
      slot(
        "Power the gate from",
        "The recording ring",
        "The municipal battery",
        "The return conductor",
      ),
      slot(
        "Keep this circuit isolated",
        "Municipal lamps",
        "The recording ring",
        "The gate motor",
      ),
    ],
    answer: ["The municipal battery", "The recording ring"],
    hints: [
      "The painted arrow is not the only arrow.",
      "The gate and the recording posts use different supplies.",
      "Use the municipal battery. Leave the recording ring isolated.",
    ],
    wrong:
      "The gate and the recording ring are separate systems. Trace the proposed current before connecting it.",
    result:
      "The municipal gate opens. Police, clinic and archive are accessible. The radio wakes: “You came. There is still time.”",
    purpose:
      "Teach proximity, role observations, deliberate sharing and a two-person deduction.",
  },
  {
    id: "p02",
    title: "No one evacuated",
    location: "police",
    act: 1,
    prerequisites: ["p01"],
    needs: [call, soot],
    kind: "deduction",
    prompt:
      "The radio says the town was evacuated after a fire. Record the account that survives both the dispatch reel and the physical scene.",
    slots: [
      slot(
        "What happened here?",
        "A fire evacuation",
        "An interrupted ordinary night",
        "A deliberate mass poisoning",
      ),
      slot(
        "Strongest corroboration",
        "A voice says so",
        "Undisturbed dust and no siren",
        "All the clocks agree",
      ),
    ],
    answer: ["An interrupted ordinary night", "Undisturbed dust and no siren"],
    hints: [
      "Listen for what is absent in the dispatch call.",
      "A fire should leave ash and an evacuation should disturb the room.",
      "Choose interrupted ordinary night, supported by undisturbed dust and no siren.",
    ],
    wrong:
      "Test both parts of the claim. A frightening noise alone does not establish a fire or an evacuation.",
    result:
      "The evacuation theory is crossed out. A tower service key is found inside the dispatch drawer.",
    purpose: "Challenge the radio early with independent evidence.",
  },
  {
    id: "p03",
    title: "Before midnight",
    location: "clinic",
    act: 1,
    prerequisites: ["p01"],
    needs: [route, dose, pump],
    kind: "reconstruction",
    prompt:
      "Reconstruct Mara’s interrupted errand and decide which object can preserve a message beyond a repeated moment.",
    slots: [
      slot(
        "Mara was going",
        "Out of town",
        "To Kit upstairs",
        "To poison the water",
      ),
      slot(
        "A reliable persistent record",
        "The powered infusion timer",
        "The unpowered treatment chart",
        "The repeating footsteps",
      ),
    ],
    answer: ["To Kit upstairs", "The unpowered treatment chart"],
    hints: [
      "Follow the prints, then compare them with the dose.",
      "Powered resonant objects repeat; the handwritten chart does not.",
      "Mara was going to Kit upstairs. Preserve the unpowered treatment chart.",
    ],
    wrong:
      "The dose and its label explain the errand. The timer repeats; not every object can preserve new information.",
    result:
      "Mara’s promise enters the case. Her maintenance pass opens the substation path.",
    purpose:
      "Introduce residents and distinguish persistent evidence from repeating fragments.",
  },
  {
    id: "p04",
    title: "The limits of memory",
    location: "archive",
    act: 1,
    prerequisites: ["p01"],
    needs: [symbols, fragment, daughter],
    kind: "comparison",
    prompt:
      "The council funded a recorder, not a resurrection machine. Reconcile the demonstration, the service notation, and Ada’s dedication.",
    slots: [
      slot(
        "Who can the first interval contain?",
        "Anyone ever remembered",
        "People inside at 23:50",
        "Everyone entering later",
      ),
      slot(
        "What does RESET do?",
        "Releases people outward",
        "Makes a new recording",
        "Recovers Ada’s childhood",
      ),
    ],
    answer: ["People inside at 23:50", "Makes a new recording"],
    hints: [
      "The demonstration defines the boundary. The dedication defines a loss outside it.",
      "RESET and RETURN have separate meanings in the service ledger.",
      "The first interval contains people inside at 23:50. RESET makes a new recording.",
    ],
    wrong:
      "The archive’s emotional promise cannot extend the machine’s stated recording limits.",
    result:
      "The radio station address is recovered. Ada was never in the interval. Your team is still outside the recording.",
    purpose:
      "Establish fixed rules and make the motive discoverable well before the reveal.",
  },
  {
    id: "p05",
    title: "Four minutes that never happened",
    location: "clock",
    act: 2,
    prerequisites: ["p02"],
    needs: [correction, gate, outward],
    kind: "timeline",
    prompt:
      "Align the radio override with Inez’s corrected clock. Then identify which event happened first.",
    slots: [
      slot("00:03 on the radio is actually", "23:59", "00:07", "00:03"),
      slot(
        "Earlier event",
        "Voss’s override",
        "Inez opens the return gate",
        "The midnight capture",
      ),
    ],
    answer: ["23:59", "Inez opens the return gate"],
    hints: [
      "Inez corrected the tower, not the radio.",
      "Radio timestamps run four minutes fast. Her gate note uses true time.",
      "00:03 radio means 23:59. Inez opened the gate at 23:58, before the override.",
    ],
    wrong:
      "Use the same clock standard for both events. The service log gives the direction of the correction.",
    result:
      "The clocks align. Inez attempted a rescue before the disaster. An outward path still exists.",
    purpose: "A concrete temporal inconsistency becomes a causal clue.",
  },
  {
    id: "p06",
    title: "The severed return",
    location: "power",
    act: 2,
    prerequisites: ["p03"],
    needs: [cut, tool, crossing],
    kind: "forensics",
    prompt:
      "Determine whether the safety failure was accidental. Choose both the mechanism and the evidence that links a person to it.",
    slots: [
      slot(
        "Failure mechanism",
        "Lightning melted both lines",
        "The return was deliberately cut",
        "Inez overloaded the clock",
      ),
      slot(
        "Physical attribution",
        "Voss’s cutter and matching approach",
        "The radio’s accusation",
        "A distant clock adjustment",
      ),
    ],
    answer: [
      "The return was deliberately cut",
      "Voss’s cutter and matching approach",
    ],
    hints: [
      "An overload and a tool leave different damage.",
      "The cutter alone might move; the undisturbed approach trace constrains that theory.",
      "The return was deliberately cut. Voss’s cutter and matching approach identify him.",
    ],
    wrong:
      "An accusation is not physical attribution. Combine damage, tool and route.",
    result:
      "The team identifies sabotage. The forward supply remained live while the safe return was severed.",
    purpose:
      "Require three complementary roles to establish deliberate physical causation.",
  },
  {
    id: "p07",
    title: "Two voices, one man",
    location: "radio",
    act: 2,
    prerequisites: ["p04"],
    needs: [splice, identity, daughter],
    kind: "signal",
    prompt:
      "The radio offers help. Separate its newer instructions from the underlying abort and authenticate the speaker using a second source.",
    slots: [
      slot("The guide is", "An unknown survivor", "Elian Voss", "Inez Reed"),
      slot(
        "Original instruction underneath",
        "Restart the forward ring",
        "Carry the return outward",
        "Erase the occupancy roll",
      ),
    ],
    answer: ["Elian Voss", "Carry the return outward"],
    hints: [
      "Compare the restored dedication with the carrier voice.",
      "The signature independently identifies who could issue an override.",
      "The guide is Voss. The original track says carry the return outward.",
    ],
    wrong:
      "Use the authenticated log and the restored voice together; the loudest layer is not the oldest.",
    result:
      "The guide is Voss. Beneath his promise, the original abort survives. The underground access unlocks when the three branch findings are complete.",
    purpose:
      "Reveal identity through overlapping, independently checkable audio and cryptography.",
  },
  {
    id: "p08",
    title: "The last ten minutes",
    location: "chamber",
    act: 2,
    prerequisites: ["p05", "p06", "p07"],
    needs: [chronology, correction, cut, gate],
    kind: "timeline",
    prompt:
      "Place the four decisive events in true chronological order. Use the corrected clock, not the printed radio stamp.",
    slots: [1, 2, 3, 4].map((n) =>
      slot(
        "Event " + n,
        "Voss overrides the abort",
        "Recording begins",
        "Inez opens return",
        "Voss cuts the return",
      ),
    ),
    answer: [
      "Recording begins",
      "Voss cuts the return",
      "Inez opens return",
      "Voss overrides the abort",
    ],
    hints: [
      "Recording begins before any sabotage.",
      "The cable is cut at 23:57, Inez acts at 23:58, and override is 23:59.",
      "Order: recording begins → Voss cuts return → Inez opens return → Voss overrides abort.",
    ],
    wrong:
      "One event is out of causal order. Compare the severed-return alert with the corrected gate and override times.",
    result:
      "The sequence is reconstructed: 23:50 record; 23:57 sabotage; 23:58 attempted return; 23:59 override; midnight capture.",
    purpose: "Integrate three parallel branches into one chronology.",
  },
  {
    id: "p09",
    title: "A case against the guide",
    location: "police",
    act: 2,
    prerequisites: ["p06", "p07"],
    needs: [tool, crossing, identity],
    kind: "deduction",
    prompt:
      "Build a defensible account of responsibility. The evidence must establish both physical sabotage and authority over the experiment.",
    slots: [
      slot("Responsible person", "Inez Reed", "Elian Voss", "Mara Vale"),
      slot(
        "Independent pair of proofs",
        "Cutter approach + signed override",
        "Radio claim + fear",
        "Clock error + unopened medicine",
      ),
    ],
    answer: ["Elian Voss", "Cutter approach + signed override"],
    hints: [
      "Distinguish who could open a gate from who could authorize forward capture.",
      "The cable scene establishes physical action; the radio log establishes authority.",
      "Elian Voss: cutter approach plus signed override.",
    ],
    wrong:
      "A clock error explains a misleading timestamp, not a severed wire or an authorized override.",
    result:
      "The case links Voss to both sabotage and capture. Inez and Mara are cleared.",
    purpose:
      "Avoid making a voice match alone sufficient proof of culpability.",
  },
  {
    id: "p10",
    title: "The person he cannot bring back",
    location: "archive",
    act: 3,
    prerequisites: ["p08", "p09"],
    needs: [daughter, intent, living],
    kind: "comparison",
    prompt:
      "Explain why Voss needs the investigators and why the promised rescue cannot achieve his private goal.",
    slots: [
      slot(
        "His private goal",
        "Recover Ada",
        "Evacuate a fire",
        "Repair a municipal clock",
      ),
      slot(
        "The fatal contradiction",
        "Ada died before any recording",
        "The town has no electricity",
        "The investigators cannot enter",
      ),
    ],
    answer: ["Recover Ada", "Ada died before any recording"],
    hints: [
      "His private memo changes how the dedication reads.",
      "Compare Ada’s death date with the first recording boundary.",
      "He wants Ada back, but she died before any recording.",
    ],
    wrong:
      "A longer or repeated capture cannot add someone who was never recorded. Read the occupancy roll against the memorial.",
    result:
      "Voss wanted another chance with his daughter. The machine could never give it to him. He needs unrecorded hands to restart it.",
    purpose:
      "Give the antagonist an understandable motive without excusing the harm.",
  },
  {
    id: "p11",
    title: "The offer",
    location: "chamber",
    act: 3,
    prerequisites: ["p10"],
    needs: [fresh, isolator, symbols, pulse],
    kind: "decision",
    prompt:
      "“Restart it. Please. I can still fix this.” The console offers two routes. Decide what the evidence supports. A safety trip protects the first mistaken restart.",
    slots: [
      slot(
        "Choose a protocol",
        "Restart the experiment",
        "Reverse through the return",
      ),
      slot(
        "Who belongs in the return?",
        "The original recorded residents",
        "Residents and new investigators",
        "Ada and every remembered person",
      ),
    ],
    answer: ["Reverse through the return", "The original recorded residents"],
    hints: [
      "Study the six extra silhouettes before trusting the label “rescue”.",
      "Restart records again. Return sends the original interval outward through Inez’s gate.",
      "Reverse through the return, addressed to the original recorded residents.",
    ],
    wrong:
      "The proposed capture includes six new silhouettes. The trip isolates the ring. No progress is lost. Reconsider the meaning of RESET and RETURN.",
    result:
      "The forward protocol is rejected. The return manifold wakes. Six stable latches await a deliberate configuration.",
    purpose:
      "Offer a fair recoverable misleading choice with a visible consequence.",
  },
  {
    id: "p12",
    title: "Build a way home",
    location: "power",
    act: 3,
    prerequisites: ["p11"],
    needs: [cut, outward, address],
    kind: "circuit",
    prompt:
      "Restore the physical return path in a safe sequence. An outward gate cannot help while the forward supply still drives the ring.",
    slots: [1, 2, 3].map((n) =>
      slot(
        "Service step " + n,
        "Bridge return",
        "Isolate forward",
        "Open outward gate",
      ),
    ),
    answer: ["Isolate forward", "Bridge return", "Open outward gate"],
    hints: [
      "Read the conductor diagnosis before bridging anything.",
      "Remove the source that would feed the ring; then repair the route; then open it.",
      "Isolate forward → bridge return → open outward gate.",
    ],
    wrong:
      "That order could feed the ring before a safe return exists. The diagnostic explicitly describes the hazard.",
    result:
      "The repaired return glows toward the street. Power flows into the safe path. The first dawn-colored light touches the cables.",
    purpose:
      "Apply a known electrical rule rather than introduce a finale exception.",
  },
  {
    id: "p13",
    title: "Call them by their names",
    location: "clinic",
    act: 3,
    prerequisites: ["p11"],
    needs: [living, address, dose, splice],
    kind: "address",
    prompt:
      "Prepare the return message. Who are you calling, and which surviving signal can carry the original abort?",
    slots: [
      slot(
        "Address source",
        "Ada’s memorial archive",
        "The 23:50 occupancy roll",
        "A new investigator register",
      ),
      slot(
        "Carrier",
        "The original abort beneath the guide",
        "Voss’s restart instruction",
        "The evacuation siren",
      ),
    ],
    answer: [
      "The 23:50 occupancy roll",
      "The original abort beneath the guide",
    ],
    hints: [
      "The destination is people who were present, not people who are remembered.",
      "The original abort was never erased; it remains under the guide’s stronger layer.",
      "Use the 23:50 occupancy roll and the original abort beneath the guide.",
    ],
    wrong:
      "The return must address real occupants through an existing signal. Neither the memorial nor an absent siren can do that.",
    result:
      "Mara. Kit. Inez. One hundred and eighty-four more names. The carrier answers, faintly: “We’re here.”",
    purpose: "Turn technical addressing into an emotionally grounded act.",
  },
  {
    id: "p14",
    title: "Let morning come",
    location: "chamber",
    act: 4,
    prerequisites: ["p12", "p13"],
    needs: [perimeter, splice, address, cut, living, pulse],
    kind: "finale",
    prompt:
      "Take your six established tools to six return stations. Each latch holds; talk through the configuration, then arm it. There is no countdown.",
    slots: [],
    answer: [],
    hints: [
      "The six stations match the six things you have already learned.",
      "Find your role’s station on the map. Correct configurations stay armed while others work.",
      "Trace: street/outward. Audio: radio/original abort. Cipher: archive/OUT. Engineer: power/isolate forward. Forensic: clinic/living roll. Temporal: clock/23:58.",
    ],
    wrong: "Every return station must be configured by its investigator.",
    result:
      "The town returns to the present. For the first time in a very long night, the clock moves on.",
    purpose:
      "Use every established ability and the shared explanation in stable distributed coordination.",
  },
];
export const finale = [
  {
    role: "trace",
    location: "street",
    hotspot: "boundary",
    title: "Follow the return",
    prompt: "Which disturbance carries the town beyond the boundary?",
    options: [
      "Inward, toward the chair",
      "Outward, along Inez’s path",
      "Around the closed ring",
    ],
    answer: "Outward, along Inez’s path",
  },
  {
    role: "audio",
    location: "radio",
    hotspot: "broadcast",
    title: "Carry the original voice",
    prompt: "Choose the recovered signal to carry to the return bus.",
    options: [
      "Voss’s newer restart layer",
      "The original abort beneath it",
      "The three dispatch knocks",
    ],
    answer: "The original abort beneath it",
  },
  {
    role: "cipher",
    location: "archive",
    hotspot: "ledger",
    title: "Give the interval a destination",
    prompt: "Translate the service chevron into a manifold route.",
    options: [
      "RESET / fresh recording",
      "OUT / open return",
      "LOOP / closed ring",
    ],
    answer: "OUT / open return",
  },
  {
    role: "engineer",
    location: "power",
    hotspot: "conductor",
    title: "Hold the safe supply state",
    prompt:
      "What must stay isolated while the repaired return carries the town?",
    options: [
      "The outward return",
      "The municipal battery",
      "The forward supply",
    ],
    answer: "The forward supply",
  },
  {
    role: "forensic",
    location: "clinic",
    hotspot: "ward",
    title: "Account for the living",
    prompt: "Which people can this interval actually release?",
    options: [
      "The 23:50 living occupancy roll",
      "Everyone in the memorial",
      "The six new investigators",
    ],
    answer: "The 23:50 living occupancy roll",
  },
  {
    role: "temporal",
    location: "clock",
    hotspot: "clockwork",
    title: "Hold the moment before override",
    prompt: "Align with the corrected moment when Inez opened return.",
    options: [
      "00:03 radio, uncorrected",
      "23:58 true time",
      "Midnight capture",
    ],
    answer: "23:58 true time",
  },
] satisfies {
  role: Role;
  location: LocationId;
  hotspot: string;
  title: string;
  prompt: string;
  options: string[];
  answer: string;
}[];
