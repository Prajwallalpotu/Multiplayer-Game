import type { HandsOnState } from "./handsOn";
export const VERSION = "bellwether-1.0";
export const ROLES = [
  {
    id: "trace",
    name: "Trace Analyst",
    short: "Trace",
    tool: "Trace light",
    mark: "01",
    color: "#cfaa70",
    description:
      "Find the marks the town tried to erase. Follow movements that ordinary light cannot reveal.",
  },
  {
    id: "audio",
    name: "Audio Specialist",
    short: "Audio",
    tool: "Signal isolate",
    mark: "02",
    color: "#8bbeb8",
    description:
      "Separate voices from interference. Restore the fragments someone wanted buried.",
  },
  {
    id: "cipher",
    name: "Cryptographer",
    short: "Cipher",
    tool: "Decode",
    mark: "03",
    color: "#b5a4cd",
    description:
      "Read the town’s private language. Turn shared context into a way forward.",
  },
  {
    id: "engineer",
    name: "Field Engineer",
    short: "Engineer",
    tool: "Diagnose",
    mark: "04",
    color: "#c79a7d",
    description:
      "Understand what still has power, what was cut, and what can safely be restored.",
  },
  {
    id: "forensic",
    name: "Forensic Investigator",
    short: "Forensic",
    tool: "Examine",
    mark: "05",
    color: "#b7c798",
    description:
      "Let physical evidence challenge a convincing story. Separate cause from coincidence.",
  },
  {
    id: "temporal",
    name: "Temporal Analyst",
    short: "Temporal",
    tool: "Observe echo",
    mark: "06",
    color: "#8caec7",
    description:
      "Watch the moments that refuse to end. Put inconsistent clocks into one true sequence.",
  },
] as const;
export type Role = (typeof ROLES)[number]["id"];
export const LOCATIONS = [
  {
    id: "street",
    name: "Bellwether",
    subtitle: "The edge of a missing town",
    kind: "outside",
    x: 49,
    y: 74,
    requires: [],
    links: ["police", "archive", "clinic", "clock", "power", "radio"],
    description:
      "Rain hangs above the road. Somewhere, a telephone rings for the third time.",
  },
  {
    id: "police",
    name: "Police station",
    subtitle: "An unanswered call",
    kind: "interior",
    x: 23,
    y: 58,
    requires: ["p01"],
    links: ["street", "archive"],
    description:
      "The dispatch lamp is still on. The evacuation board is perfectly blank.",
  },
  {
    id: "archive",
    name: "Municipal archive",
    subtitle: "Things worth keeping",
    kind: "interior",
    x: 25,
    y: 31,
    requires: ["p01"],
    links: ["street", "police", "clock"],
    description:
      "An exhibition on memory. A council ledger with one page carefully removed.",
  },
  {
    id: "clinic",
    name: "St. Agnes clinic",
    subtitle: "Keep the light on",
    kind: "interior",
    x: 73,
    y: 62,
    requires: ["p01"],
    links: ["street", "power"],
    description:
      "A small coat hangs by the door. A paper boat waits in a dry basin.",
  },
  {
    id: "clock",
    name: "Clock tower",
    subtitle: "Four minutes too late",
    kind: "interior",
    x: 48,
    y: 18,
    requires: ["p02"],
    links: ["street", "archive", "radio"],
    description:
      "The second hand reaches twelve. Then it reaches twelve again.",
  },
  {
    id: "power",
    name: "Power substation",
    subtitle: "The severed return",
    kind: "outside",
    x: 83,
    y: 36,
    requires: ["p03"],
    links: ["street", "clinic", "chamber"],
    description:
      "Copper hums under wet ceramic. One clean cut has changed everything.",
  },
  {
    id: "radio",
    name: "Radio station",
    subtitle: "A familiar stranger",
    kind: "interior",
    x: 64,
    y: 33,
    requires: ["p04"],
    links: ["street", "clock", "chamber"],
    description:
      "“You made it. Good. We have very little time.” The microphone is unplugged.",
  },
  {
    id: "chamber",
    name: "The Mnemosyne array",
    subtitle: "The last ten minutes",
    kind: "interior",
    x: 65,
    y: 11,
    requires: ["p05", "p06", "p07"],
    links: ["power", "radio"],
    description:
      "Six return paths surround an empty chair. The air remembers a person.",
  },
] as const;
export type LocationId = (typeof LOCATIONS)[number]["id"];
export type Hotspot = {
  id: string;
  location: LocationId;
  name: string;
  x: number;
  y: number;
  roles: Role[];
  description: string;
};
export const HOTSPOTS: Hotspot[] = [
  {
    id: "boundary",
    location: "street",
    name: "The boundary marker",
    x: 45,
    y: 62,
    roles: ["trace", "engineer"],
    description:
      "Six ceramic posts. A painted arrow points into town; a second arrow has been scrubbed away.",
  },
  {
    id: "dispatch",
    location: "police",
    name: "Dispatch desk",
    x: 38,
    y: 55,
    roles: ["audio", "forensic"],
    description:
      "A red telephone, a water-damaged dispatch reel, and a clean windowsill.",
  },
  {
    id: "ward",
    location: "clinic",
    name: "Mara’s treatment table",
    x: 42,
    y: 53,
    roles: ["trace", "engineer", "forensic"],
    description:
      "A metal tray, a cooling kettle, and a note addressed to Kit Mercer.",
  },
  {
    id: "ledger",
    location: "archive",
    name: "The municipal collection",
    x: 42,
    y: 52,
    roles: ["cipher", "temporal", "audio"],
    description:
      "The Mnemosyne proposal rests beneath a photograph of a girl with a red kite.",
  },
  {
    id: "clockwork",
    location: "clock",
    name: "Inez’s clockwork",
    x: 46,
    y: 52,
    roles: ["cipher", "temporal", "trace"],
    description:
      "A grease pencil correction lies beside the untouched radio synchronizer.",
  },
  {
    id: "conductor",
    location: "power",
    name: "Return conductor",
    x: 47,
    y: 54,
    roles: ["engineer", "trace", "forensic"],
    description:
      "One return cable is neatly severed. There is no blast damage.",
  },
  {
    id: "broadcast",
    location: "radio",
    name: "The midnight broadcast",
    x: 43,
    y: 53,
    roles: ["audio", "cipher"],
    description:
      "Two signals share a carrier. The stronger one knows your names.",
  },
  {
    id: "array",
    location: "chamber",
    name: "Mnemosyne console",
    x: 48,
    y: 53,
    roles: ["temporal", "engineer", "audio", "forensic", "cipher", "trace"],
    description:
      "A new capture control glows beside a dark return bus. The console calls both of them rescue.",
  },
  {
    id: "boat",
    location: "clinic",
    name: "A paper boat",
    x: 69,
    y: 67,
    roles: [],
    description:
      "Kit folded this from a spelling exercise. Inside: “Mara says rivers always find the sea.”",
  },
  {
    id: "cup",
    location: "clock",
    name: "The second cup",
    x: 70,
    y: 65,
    roles: [],
    description:
      "Inez has set out two cups. A note: “First night on the job? Tea helps. — I.”",
  },
  {
    id: "kite",
    location: "archive",
    name: "The red kite",
    x: 69,
    y: 64,
    roles: [],
    description:
      "Ada Voss, winter fête. On the back: “Again, Dad. Let’s do it again.” The date is eight months before the experiment.",
  },
];
export const ACTS = [
  "Arrival",
  "Names in the silence",
  "A town out of order",
  "The voice is lying",
  "Let morning come",
];
export type PuzzleView = {
  id: string;
  title: string;
  location: LocationId;
  act: number;
  prompt: string;
  kind: string;
  slots: { label: string; options: string[] }[];
  needs: {
    id: string;
    label: string;
    role: Role;
    location: LocationId;
    shared: boolean;
  }[];
  solved: boolean;
  result?: string;
  hintLevel: number;
  hints: string[];
  ready: boolean;
};
export type PlayerView = {
  id: string;
  name: string;
  role?: Role;
  roles?: Role[];
  controller?: "laptop" | "phone";
  location: LocationId;
  x: number;
  y: number;
  ready: boolean;
  laptop: boolean;
  phone: boolean;
  checked: boolean;
  voice: string;
  speaking: boolean;
  simulated?: boolean;
};
export type EvidenceView = {
  id: string;
  title: string;
  text: string;
  role?: Role;
  roles?: Role[];
  controller?: "laptop" | "phone";
  location: LocationId;
  shared: boolean;
  optional?: boolean;
};
export type GameView = {
  handsOn?: HandsOnState;
  code: string;
  name: string;
  mode: string;
  public: boolean;
  status: "lobby" | "playing" | "complete";
  version: string;
  you: string;
  device: "laptop" | "phone";
  host: string;
  players: PlayerView[];
  solved: string[];
  evidence: EvidenceView[];
  puzzles: PuzzleView[];
  finale: any[];
  armed: Role[];
  hints: number;
  elapsed: number;
  paused: boolean;
  pauseReason: string;
  manualPause: boolean;
  restartTrip: boolean;
  events: string[];
  chat: { name: string; text: string }[];
  panel: string;
  drafts: Record<string, string[]>;
  pair?: { code: string; expires: number };
  report?: any;
  simulated: boolean;
};

// Door positions use the same world coordinates as objects and investigators.
export function entrances(location: LocationId) {
  const links = LOCATIONS.find(l => l.id === location)!.links;
  const streetDoors: Record<string, { x: number; y: number }> = {
    police: { x: 23, y: 56 }, archive: { x: 29, y: 42 },
    clinic: { x: 77, y: 61 }, clock: { x: 51, y: 41 },
    power: { x: 82, y: 43 }, radio: { x: 66, y: 43 },
  };
  return links.map((id, i) => ({
    id, name: LOCATIONS.find(l => l.id === id)!.name,
    ...(location === "street" ? streetDoors[id] : { x: 24 + i * 26, y: 78 }),
  }));
}
export function ownedRoles(p: { role?: Role; roles?: Role[] }): Role[] {
  return p.roles ?? (p.role ? [p.role] : []);
}

HOTSPOTS.push(
  {id:"play-frame",location:"archive",name:"The scrambled picture",x:28,y:68,roles:[],description:"Four picture tiles sit crooked in a wooden frame. A tiny cupboard emblem is carved into its edge."},
  {id:"play-cupboard",location:"clinic",name:"The locked cupboard",x:27,y:70,roles:[],description:"Four brass number wheels guard a small drawer. The label reads: ‘The archive picture remembers the combination.’"},
  {id:"play-music",location:"clock",name:"Inez’s music box",x:29,y:70,roles:[],description:"A winding socket and nine rotating air channels. A note reads: ‘My spare key is in the clinic cupboard. Let every pipe sing.’"},
);
