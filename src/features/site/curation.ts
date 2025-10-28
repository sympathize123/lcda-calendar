export type HeroMedia =
  | { type: "image"; src: string; alt?: string }
  | {
      type: "video";
      src: string;
      poster?: string;
      start?: number;
      end?: number;
    };

// Curated media for the landing hero (rock/poster vibe)
export const heroMedia: HeroMedia[] = [
  {
    type: "video",
    src: "/club/hero.mp4",
    poster: "/club/hero.jpg",
    start: 14,
    end: 22,
  },
  { type: "image", src: "/club/poster1.jpg", alt: "LCDA Rock Poster 1" },
  { type: "image", src: "/club/poster2.jpg", alt: "LCDA Rock Poster 2" },
  { type: "image", src: "/club/hero_bw.jpg", alt: "LCDA Black & White" },
  { type: "image", src: "/club/hero.jpg", alt: "LCDA Stage" },
];

// Curated gallery list (6 images)
export const galleryImages: string[] = [
  "/club/1.jpg",
  "/club/2.jpg",
  "/club/3.jpg",
  "/club/4.jpg",
  "/club/5.jpg",
  "/club/6.jpg",
];
