// Layered Martian distance. Photo is art; UI stays HTML above it.

export function MarsHorizon() {
  return (
    <div className="mars-horizon" aria-hidden="true">
      <picture>
        <source
          srcSet="/images/mars-horizon.webp"
          type="image/webp"
          sizes="100vw"
        />
        <img
          className="mars-horizon-photo"
          src="/images/mars-horizon.jpg"
          alt=""
          width={1600}
          height={900}
          sizes="100vw"
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
      </picture>
      <div className="mars-horizon-grade" />
      <div className="mars-horizon-haze" />
      <div className="mars-horizon-atmosphere" />
      <div className="mars-horizon-vignette" />
    </div>
  );
}
