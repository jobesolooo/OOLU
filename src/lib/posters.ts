/** "Stay in Motion" campaign posters (F/W 2026). All 3:4. */
export type Poster = { src: string; alt: string; title: string };

const p = (name: string, title: string, alt: string): Poster => ({ src: `/images/posters/${name}.jpg`, title, alt });

export const POSTERS = {
  trackSet: p("roots-journey-track-set", "Roots and Journey — Track Set 01", "Hooded close-up with Roots and Journey across the shoulders, gold brush strokes and hand-drawn notes"),
  keepMovingNavy: p("keep-moving-navy", "Keep Moving", "Keep Moving poster: three models walking in OOLU tracksuits and a hooded portrait, navy print"),
  keepMovingGraffiti: p("keep-moving-graffiti", "Keep Moving — Motion Walk", "Keep Moving in red spray paint over a halftone collage of OOLU tracksuits walking"),
  keepMovingCollage: p("keep-moving-collage", "Keep Moving — Urban Study", "Comic-panel collage: four models walking in OOLU tracksuits, a hooded portrait and hand-drawn OOLU tags"),
  stayGraffiti: p("stay-in-motion-graffiti", "Stay in Motion", "Two models in OOLU tracksuits outlined in red, with Stay in Motion sprayed above and below"),
  stayRed: p("stay-in-motion-red", "Stay in Motion — Overhead Street Study", "Red and navy poster: three models seen from above and two standing between tall buildings"),
  stayBlue: p("stay-in-motion-blue", "Stay in Motion — True Urban Systems", "Three models standing still in a moving crowd, with a studio shot of two in the OOLU tracksuit"),
  inMotion: p("in-motion-red", "In Motion — Track Study", "In Motion poster in red and navy: models walking in OOLU tracksuits and a hooded portrait"),
  giant: p("oolu-giant", "OOLU", "Giant red OOLU letters around a low-angle shot of a model in the zip hoodie set and a crouching model"),
  darkMotion: p("dark-motion", "Dark Motion", "Dark studio collage: the OOLU zip hoodie and sweatpants, and the crouch study in streaks of light"),
  inMotionLookbook: p("oolu-in-motion", "OOLU in Motion — Fall lookbook", "Fall lookbook collage: the OOLU zip hoodie and the track set walking through warm light"),
  newYear: p("new-year-motion", "New Year Motion", "New Year Motion collage: three models in a moving crowd and a hooded close-up, with taped polaroids"),
} as const;

export type PosterKey = keyof typeof POSTERS;
export const ALL_POSTERS: Poster[] = Object.values(POSTERS);
