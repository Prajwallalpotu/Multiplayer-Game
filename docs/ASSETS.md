# Asset provenance

All town environments, roofs, trees, lamps, interiors, props, investigator silhouettes, role marks, icon paths, fog, grain, waveform illustrations and dawn variants were originally authored as source in `src/Scene.tsx`, `src/App.tsx` and CSS for this project. They are not copied from an external game or asset pack. No downloaded photographs, generated bitmap images, proprietary fonts or third-party sound recordings are used.

Georgia/Times New Roman and Arial/Helvetica are browser/system font references; font binaries are not distributed. QR images are generated at runtime by the MIT-licensed `qrcode` dependency. Application dependencies retain their own licenses in installed packages and the lockfile records exact versions.

Atmosphere and feedback tones are original Web Audio oscillator compositions. Optional spoken evidence uses the browser’s built-in speech synthesis voice; availability/quality varies by OS. It is explicitly labeled synthesized. Voice conversations are never recorded.

The procedural visual style is the delivered art system, not a hidden downloaded placeholder set. Remaining production limitations: geometric characters, limited facial/body acting, no voiced actor performances, no authored Foley recordings, and no bespoke character portraits. Those additions would require a separate art/audio production pass. There are no temporary assets silently presented as licensed final artwork.

## Hands-on trail

The archive picture is an original inline SVG (kite, river, mountains and sun), split into four rotating views in `src/HandsOn.tsx`. Cupboard wheels, the brass key, music-box channels and sunrise reward use native SVG, CSS and text symbols. `playMorningMelody` in `src/audio.ts` synthesizes an original eight-note phrase with Web Audio; no sampled recording or external image is used. The existing reduced-motion preference disables tile/reward animations.
