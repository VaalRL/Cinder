import type { Copy } from "../copy.js";
import { CinderMark } from "../Brand.js";
import { OFFICIAL_DONATIONS } from "../donations.js";
import { GITHUB_URL } from "../App.js";

export function Home({ c }: { c: Copy }): JSX.Element {
  const features = [
    { t: c.feat_e2e_t, b: c.feat_e2e_b },
    { t: c.feat_decentral_t, b: c.feat_decentral_b },
    { t: c.feat_local_t, b: c.feat_local_b },
    { t: c.feat_free_t, b: c.feat_free_b },
  ];
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="hero__mark">
            <CinderMark size={72} />
          </div>
          <h1>{c.hero_title}</h1>
          <p>{c.hero_subtitle}</p>
          <div className="cta">
            <a className="btn btn--primary" href={`${GITHUB_URL}/releases`} target="_blank" rel="noreferrer">
              {c.hero_download}
            </a>
            <a className="btn" href={GITHUB_URL} target="_blank" rel="noreferrer">
              {c.hero_github}
            </a>
          </div>
        </div>
      </header>

      <section className="sec">
        <div className="wrap">
          <h2>{c.features_title}</h2>
          <div className="grid">
            {features.map((f) => (
              <div className="card" key={f.t}>
                <h3>{f.t}</h3>
                <p>{f.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <h2>{c.download_title}</h2>
          <p className="hint">{c.download_desktop}</p>
          <p className="hint">{c.download_mobile}</p>
          <div className="cta" style={{ justifyContent: "flex-start", marginTop: 12 }}>
            <a className="btn btn--primary" href={`${GITHUB_URL}/releases`} target="_blank" rel="noreferrer">
              {c.download_releases}
            </a>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <h2>{c.donate_title}</h2>
          <p className="hint">{c.donate_intro}</p>
          <div className="chips">
            {OFFICIAL_DONATIONS.map((d) => (
              <a className="btn" key={d.channel} href={d.url} target="_blank" rel="noreferrer">
                {d.label}
              </a>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            {c.donate_disclaimer}
          </p>
        </div>
      </section>
    </>
  );
}
