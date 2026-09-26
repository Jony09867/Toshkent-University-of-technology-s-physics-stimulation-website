import { createRoot } from "react-dom/client";
import { useEffect, useRef } from "react";
import AnimatedContent from "./AnimatedContent.jsx";
import FadeContent from "./FadeContent.jsx";
import SplitText from "./SplitText.jsx";
import ScrollStack, { ScrollStackItem } from "./ScrollStack.jsx";
import GradualBlur from "./GradualBlur.jsx";
import GlareHover from "./GlareHover.jsx";
import Magnet from "./Magnet.jsx";
import { mountParticleText } from "./ParticleText.js";
import { mountFloatingLines } from "./FloatingLines.js";
import "./HomeExperience.css";

function Markup({ html, className = "" }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Arrow() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function HeroPreview({ preview }) {
  return (
    <AnimatedContent distance={62} duration={1.05} scale={0.975} threshold={0.04} className="linear-preview-wrap">
      <div className="linear-product-window">
        <div className="product-window-bar">
          <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
          <span>TT PHYSICS LAB / TAJRIBA 01</span>
          <span className="window-live"><i /> Jonli model</span>
        </div>
        <div className="product-window-body">
          <aside className="preview-controls" aria-hidden="true">
            <span className="preview-label">PARAMETRLAR</span>
            <div><small>Massa</small><b>5.0 kg</b><i><em style={{ width: "42%" }} /></i></div>
            <div><small>Kuch</small><b>20 N</b><i><em style={{ width: "66%" }} /></i></div>
            <div><small>Ishqalanish</small><b>0.12</b><i><em style={{ width: "28%" }} /></i></div>
            <a href={preview.href}>Tajribani ochish <Arrow /></a>
          </aside>
          <div className="preview-stage">
            <div className="preview-stage-head"><span>NYUTONNING IKKINCHI QONUNI</span><Markup html={preview.formula} /></div>
            <div className="preview-art" dangerouslySetInnerHTML={{ __html: preview.art }} />
            <div className="preview-results" aria-hidden="true">
              <div><span>Tezlanish</span><b>4.00</b><small>m/s²</small></div>
              <div><span>Natijaviy kuch</span><b>20.0</b><small>N</small></div>
              <div><span>Tezlik</span><b>12.0</b><small>m/s</small></div>
            </div>
          </div>
        </div>
        <GradualBlur position="bottom" height="5rem" strength={0.75} divCount={5} zIndex={2} />
      </div>
    </AnimatedContent>
  );
}

function PrincipleIcon({ type }) {
  if (type === "control") return <div className="principle-control"><i /><i /><i /></div>;
  if (type === "observe") return <div className="principle-orbit"><i /><i /><b /></div>;
  return <div className="principle-chart"><i /><i /><i /><i /></div>;
}

function FeatureWindow({ feature }) {
  return (
    <div className="feature-window">
      <div className="feature-window-bar">
        <span><i /> {feature.lab}</span>
        <span>{String(feature.index + 1).padStart(2, "0")} / 04</span>
      </div>
      <div className="feature-window-grid">
        <aside aria-hidden="true">
          <span>MODEL PARAMETRLARI</span>
          {feature.params.map((param, index) => (
            <div key={param}><small>{param}</small><i><em style={{ width: `${36 + index * 19}%` }} /></i></div>
          ))}
          <div className="feature-levels"><b>Oson</b><span>O‘rta</span><span>Qiyin</span></div>
        </aside>
        <div className="feature-canvas">
          <div className="feature-formula"><span>ASOSIY FORMULA</span><Markup html={feature.formula} /></div>
          <div className="feature-art" dangerouslySetInnerHTML={{ __html: feature.art }} />
          <div className="feature-readouts">
            <span><i /> Real vaqt</span><span>Grafik</span><span>Natijalar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeExperience({ copy, links, preview, stats, features, featuredCardsHtml }) {
  const particleRef = useRef(null);
  const linesRef = useRef(null);

  useEffect(() => {
    const cleanParticle = mountParticleText(particleRef.current, {
      text: `${copy.heroTitle}\n${copy.heroAccent}`,
      color: "#fffaf7",
      highlightColor: "#f1592a",
      align: "center",
      maxFontSize: 104,
      fontWeight: 520,
      lineHeight: 1.05,
      accentLine: 1,
      density: 3,
      particleSize: 2,
      maxParticles: 7200,
      duration: 1050,
      scatter: 80,
      replayOnHover: false,
    });
    const cleanLines = mountFloatingLines(linesRef.current, { orange: "#f1592a", warm: "#fff8f3" });
    return () => {
      cleanParticle();
      cleanLines();
    };
  }, [copy.heroAccent, copy.heroTitle]);

  return (
    <div className="linear-home">
      <section className="linear-hero">
        <div ref={linesRef} className="floating-lines linear-hero-lines" aria-hidden="true" />
        <div className="linear-grid" aria-hidden="true" />
        <div className="container linear-hero-content">
          <FadeContent duration={700} className="linear-kicker"><i /> INTERAKTIV FIZIKA LABORATORIYASI</FadeContent>
          <h1 ref={particleRef} className="particle-text linear-particle-title" />
          <FadeContent blur duration={900} delay={120} className="linear-hero-copy">{copy.heroText}</FadeContent>
          <FadeContent duration={800} delay={200} className="linear-actions">
            <Magnet padding={36} magnetStrength={24}>
              <a className="linear-button primary" href={links.start}>{copy.start}<Arrow /></a>
            </Magnet>
            <a className="linear-button secondary" href={links.topics}>{copy.browse}</a>
          </FadeContent>
          <HeroPreview preview={preview} />
        </div>
      </section>

      <section className="linear-stat-strip" aria-label="Platforma ko‘rsatkichlari">
        <div className="container">
          {stats.map(([value, label]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}
        </div>
      </section>

      <section className="container linear-manifesto">
        <span className="linear-figure-label">FIZIKA / YANGI YONDASHUV</span>
        <SplitText
          tag="h2"
          className="linear-manifesto-title"
          text="Formula faqat yozuv emas. Uni boshqaring, o‘zgarishni ko‘ring va qonuniyatni o‘zingiz kashf eting."
          splitType="lines"
          duration={0.9}
          delay={90}
        />
        <div className="linear-principles">
          {[
            ["control", "01", "Parametrni boshqaring", "Har bir belgi boshqariladigan qiymatga aylanadi."],
            ["observe", "02", "Hodisani kuzating", "Animatsiya kuch, harakat va vaqt orasidagi aloqani ko‘rsatadi."],
            ["understand", "03", "Natijani tushuning", "Grafik va hisoblash bir xil qonuniyatni ikki tomondan ochadi."],
          ].map(([type, number, title, text]) => (
            <GlareHover key={number} className="principle-card" glareOpacity={0.09}>
              <span className="linear-figure-label">FIG {number}</span>
              <PrincipleIcon type={type} />
              <h3>{title}</h3>
              <p>{text}</p>
            </GlareHover>
          ))}
        </div>
      </section>

      <section className="container linear-stories">
        <FadeContent className="linear-section-intro">
          <div><span className="linear-figure-label">JONLI LABORATORIYA</span><h2>Fizikaning har bir yo‘nalishi — bitta tajriba maydonida.</h2></div>
          <div><p>Mexanikadan elektrgacha: parametrni o‘zgartiring, model javobini kuzating va natijani formulaga bog‘lang.</p><a href={links.topics}>Barcha yo‘nalishlar <Arrow /></a></div>
        </FadeContent>
        <ScrollStack itemDistance={105} itemStackDistance={14} baseScale={0.93} blurAmount={0.55}>
          {features.map(feature => (
            <ScrollStackItem key={feature.key} itemClassName={`story-card story-${feature.key}`}>
              <div className="story-copy">
                <div><span className="linear-figure-label">{feature.eyebrow}</span><h3>{feature.heading}</h3></div>
                <div><p>{feature.description}</p><a href={feature.href}>Tajribani boshlash <Arrow /></a></div>
              </div>
              <FeatureWindow feature={feature} />
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </section>

      <section className="linear-library">
        <div className="container">
          <FadeContent className="linear-section-intro library-intro">
            <div><span className="linear-figure-label">TAJRIBALAR KUTUBXONASI</span><h2>Tayyor simulyatsiyalarni tanlang.</h2></div>
            <div><p>Har bir tajriba uch daraja, jonli grafik va muhandislikdagi amaliy misollar bilan tuzilgan.</p><a href={links.ready}>Barcha simulyatsiyalar <Arrow /></a></div>
          </FadeContent>
          <div className="linear-sim-grid" dangerouslySetInnerHTML={{ __html: featuredCardsHtml }} />
        </div>
      </section>

      <section className="container linear-how">
        <FadeContent blur className="linear-how-copy">
          <span className="linear-figure-label">QANDAY ISHLAYDI?</span>
          <h2>O‘qishdan tajribaga uch qadam.</h2>
        </FadeContent>
        <div className="linear-how-steps">
          {copy.how.map(([number, title, text]) => <div key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}
        </div>
        <Magnet padding={52} magnetStrength={26} wrapperClassName="linear-final-action">
          <a className="linear-button primary large" href={links.start}>Birinchi tajribani boshlash <Arrow /></a>
        </Magnet>
      </section>
    </div>
  );
}

export function mountHomeExperience(element, props) {
  if (!element) return () => {};
  const root = createRoot(element);
  root.render(<HomeExperience {...props} />);
  return () => root.unmount();
}
