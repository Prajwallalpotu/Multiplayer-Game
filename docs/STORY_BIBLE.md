# The Last Ten Minutes — episode 1: Bellwether

## Canon, written before implementation
Bellwether is a river town built around the municipal observatory. Dr. Elian Voss built the Mnemosyne array to replay a ten-minute interval. He promised the council a way to investigate industrial accidents. Privately he wanted to recover the last conversation with his daughter Ada, who died the previous winter. He knew a recording was not a person. Grief made him erase that distinction.

At 23:50 the outer ring began recording. At 23:52 nurse Mara Vale crossed the clinic carrying insulin to young Kit Mercer. At 23:54 clockkeeper Inez Reed found the synchronizer four minutes fast and wrote down the error. At 23:56 Mara's distress call reached police; it describes a pulse, not a fire. At 23:57 Voss physically cut the safety return conductor; his blood and his insulated cutter remain. At 23:58 Inez opened the clock's return gate to protect the residents. At 23:59 Voss overrode her abort and drove the array forward. At 00:00 the outer ring captured every person inside at 23:50, and folded them into the recorded interval. The radio clock reads 00:03 at real 23:59 because it uses the uncorrected synchronizer. Nobody fled. Nobody burned.

## Fixed rules and causal resolution
The interval repeats 23:50–00:00. Only recorded people and powered resonant objects repeat. Unpowered physical evidence persists outside it. The exterior route was outside the recording ring at 23:50: six later arrivals can enter freely. They are not yet recorded. Voss is also caught. He can modulate the still-powered radio carrier, but cannot change physical equipment outside the interval. He needs six unrecorded people to hold six geographically separated return paths open. His restart would make a new 23:50 boundary now, recording the investigators as well and extending his control. It cannot bring Ada back: she predates the recorded interval.

Reversal is possible because Inez opened a return gate before capture. The ring has an output path, not a reset switch. The team must isolate the forward supply, restore the cut return, align to the corrected clock, address the recorded living residents, decode the outward direction, and carry the original abort into the chamber. These steps are all evidenced before the finale. Six latches can be armed in any order and remain stable; no latency test. Voss's restart instructions trigger a safe isolation trip, a visible phantom seventh trace, and a recorder showing the investigators being added. Progress remains intact; they reconsider and select reversal.

## People who come home
Mara's unfinished note: “Kit, I will be there before midnight. Keep the light on.” Kit's folded paper boat is wedged beside the clinic drain. Inez has left a cup for her night-shift apprentice and the clock's handwritten correction. Their fragments recur in each location. At dawn Mara reaches Kit, the paper boat moves down the gutter, Inez finally finishes winding the clock, and Voss is returned alive to answer for his actions. Ada does not return; the case acknowledges this loss.

## Five acts and dependency graph
I Arrival: p01 perimeter.
II Names in the silence: p02 police, p03 clinic, p04 archive in parallel after p01.
III A town out of order: p05 clock after p02; p06 substation after p03; p07 radio after p04. p08 chronology requires p05+p06+p07. p09 culpability requires p06+p07.
IV The voice is lying: p10 purpose after p08+p09; p11 choose reversal after p10; p12 return circuit after p11; p13 address the living after p11.
V The last ten minutes: p14 six station configurations after p12+p13. Completion releases the town.

All clue objects are accessible when their location opens, even before their deduction is unlocked. Arrival opens police/archive/clinic; the three investigations open clock/power/radio respectively. Chamber opens after the three branch investigations. Every clue is indefinitely reinspectable. Failed answers consume no objects. Server retains discoveries, shared evidence, solved puzzles and finale latches in SQLite.

## Role matrix
Trace: perimeter, clinic route, cut cable trajectory, restart boundary, clock return trace, finale outer path.
Audio: police call, archive recording, radio splice, motive tape, living carrier, finale original abort.
Cipher: civic symbols, clock log, radio identity, reversal route, address ledger, finale OUT routing.
Engineer: perimeter power, clinic equipment, cut cable, forward isolator, return network, finale isolated supply.
Forensic: police soot, clinic dose, cutter injury, Voss responsibility, resident ledger, finale living targets.
Temporal: archive fragment, clock correction, real chronology, restart capture, return pulse, finale corrected 23:58.
Each sequence combines two or more roles' observations. Revealing is exclusive; reasoning and submitting are shared. Finale configuration is role-scoped and requires travelling to six different established locations.

## Art / architecture decisions
Original procedural canvas illustrations: angled roofs, ink-dark pines, river fog, warm paper windows, copper instruments and restrained amber. No external art or font dependency. Scene rendering stays separate from authoritative rules. Canvas 2D instead of Phaser keeps the small, fixed authored environments light and inspectable. React handles accessible dialogs mirrored to the phone; Socket.IO handles authenticated devices and WebRTC signaling; SQLite checkpoints are transactionally persisted. Six-phone WebRTC mesh is appropriate to this fixed room size; production needs TURN. The phone captures and plays voice, laptop only plays synthesized environmental sound. No AI at runtime.

The 90-minute target is a hypothesis. Content includes 14 deductions and six finale configurations, with parallel exploration and optional resident evidence. Only six-human playtests can establish actual duration and whether the deductions are sufficiently substantial.
