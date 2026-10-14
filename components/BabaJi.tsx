// Original Baba ji artwork. Default seated elder throughout the temple.
// Home world gateway may use the dedicated home portrait. Never stretch. Never emoji.

export type BabaPose = "inbox" | "phone" | "sigh" | "up";
export type BabaPortrait = "seated" | "home";

const PORTRAIT: Record<BabaPortrait, { webp: string; jpg: string; width: number; height: number }> = {
  seated: {
    webp: "/images/baba-ji-seated.webp",
    jpg: "/images/baba-ji-seated.jpg",
    width: 800,
    height: 1067,
  },
  home: {
    webp: "/images/baba-ji-home.webp",
    jpg: "/images/baba-ji-home.jpg",
    width: 1024,
    height: 1536,
  },
};

export function BabaJi({
  pose = "inbox",
  priority = false,
  portrait = "seated",
}: {
  pose?: BabaPose;
  /** Altar LCP: high. Ritual reuse: leave false. */
  priority?: boolean;
  /** World home uses the home portrait; ritual pages keep seated. */
  portrait?: BabaPortrait;
}) {
  const asset = PORTRAIT[portrait];
  return (
    <div className="baba-portrait" data-pose={pose} data-portrait={portrait} aria-hidden="true">
      <picture>
        <source
          srcSet={asset.webp}
          type="image/webp"
          sizes="(max-width: 767px) 72vw, (max-width: 1199px) 16.5rem, 18rem"
        />
        <img
          className="baba-portrait-photo"
          src={asset.jpg}
          alt=""
          width={asset.width}
          height={asset.height}
          sizes="(max-width: 767px) 72vw, (max-width: 1199px) 16.5rem, 18rem"
          decoding={priority ? "sync" : "async"}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>
      <div className="baba-portrait-shade" />
      <div className="baba-portrait-glow" />
    </div>
  );
}
