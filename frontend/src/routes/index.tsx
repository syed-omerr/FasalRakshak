import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import heroField from "@/assets/hero-field.jpg";
import ear from "@/assets/ear.jpg";
import seed from "@/assets/seed.jpg";
import aerial from "@/assets/aerial.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kernel — The Corn Revolution" },
      {
        name: "description",
        content:
          "Six generations of breeding, one kernel. Scroll through the story of the seed rewriting the world's most planted crop.",
      },
      { property: "og:title", content: "Kernel — The Corn Revolution" },
      {
        property: "og:description",
        content:
          "A cinematic scroll through the seed rewriting the world's most planted crop.",
      },
    ],
  }),
  component: Index,
});

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return y;
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  );
}

const chapters = [
  { id: "seed", label: "The Seed" },
  { id: "field", label: "The Field" },
  { id: "yield", label: "The Yield" },
  { id: "future", label: "The Future" },
];

const stats = [
  { value: "1.2B", label: "Tonnes harvested each year" },
  { value: "197M", label: "Hectares under cultivation" },
  { value: "6", label: "Generations of breeding" },
  { value: "42%", label: "Less water per tonne" },
];

const traits = [
  {
    n: "01",
    title: "Deep root architecture",
    body: "Roots that drive a third deeper in the first twenty days, reaching moisture that shallow lines never touch.",
  },
  {
    n: "02",
    title: "Heat-stable pollen",
    body: "Pollination holds through a 38°C afternoon, protecting kernel set when the season turns hostile.",
  },
  {
    n: "03",
    title: "Standing power",
    body: "Thicker lower internodes keep stalks upright through late-season storms, so the harvest stays harvestable.",
  },
  {
    n: "04",
    title: "Nitrogen efficiency",
    body: "More grain from every unit applied — less runoff downstream, less cost at the gate.",
  },
];

function Index() {
  const y = useScrollY();

  return (
    <main className="overflow-x-hidden bg-background">
      <Nav />
      <Hero y={y} />
      <Marquee />
      <SeedSection y={y} />
      <StatsBand />
      <FieldSection y={y} />
      <TraitsSection />
      <YieldSection />
      <FutureSection />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-10">
        <a href="#top" className="display text-2xl tracking-widest text-foreground">
          Kernel<span className="text-primary">.</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {chapters.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-primary"
            >
              {c.label}
            </a>
          ))}
        </nav>
        <a
          href="#future"
          className="rounded-full border border-primary/60 px-5 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          The Field Guide
        </a>
      </div>
    </header>
  );
}

function Hero({ y }: { y: number }) {
  return (
    <section
      id="top"
      className="grain relative flex h-[100svh] min-h-[620px] items-end overflow-hidden"
    >
      <img
        src={heroField}
        alt="Corn stalks at night lit from below by warm light"
        width={1920}
        height={1200}
        className="absolute inset-0 h-[118%] w-full object-cover"
        style={{ transform: `translateY(${y * -0.18}px) scale(1.04)` }}
      />
      <div className="dusk-veil absolute inset-0" />
      <div className="absolute inset-0 bg-soil/35" />
      <div className="relative mx-auto w-full max-w-[1600px] px-6 pb-16 md:px-10 md:pb-24">
        <p className="eyebrow animate-rise">Chapter zero — a single kernel</p>
        <h1
          className="animate-rise mt-4 max-w-5xl text-[clamp(3.4rem,12vw,11rem)] text-foreground"
          style={{ animationDelay: "120ms" }}
        >
          The corn
          <br />
          revolution
        </h1>
        <div
          className="animate-rise mt-8 flex flex-col gap-8 border-t border-border pt-8 md:flex-row md:items-end md:justify-between"
          style={{ animationDelay: "240ms" }}
        >
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Every kernel is a hundred years of decisions compressed into something
            you can hold between two fingers. This is how it changed the ground
            beneath us.
          </p>
          <a
            href="#seed"
            className="group inline-flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-foreground"
          >
            <span className="grid size-11 place-items-center rounded-full border border-primary/60 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              ↓
            </span>
            Begin the descent
          </a>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const words = [
    "Deep roots",
    "Heat tolerant",
    "Nitrogen smart",
    "Storm proof",
    "Higher yield",
  ];
  return (
    <div className="border-y border-border bg-soil py-5">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex gap-10">
            {words.map((w) => (
              <span
                key={w}
                className="display text-3xl tracking-wide text-muted-foreground md:text-4xl"
              >
                {w}
                <span className="ml-10 text-primary">✳</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SeedSection({ y }: { y: number }) {
  return (
    <section id="seed" className="relative overflow-hidden py-28 md:py-40">
      <div className="mx-auto grid max-w-[1600px] items-center gap-14 px-6 md:grid-cols-2 md:px-10">
        <Reveal>
          <p className="eyebrow">Chapter one — the seed</p>
          <h2 className="mt-5 text-[clamp(2.6rem,6vw,5.5rem)]">
            It starts
            <br />
            underground
          </h2>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Seventy-two hours after planting, the kernel has already committed.
            Water moves in, starch breaks down, and the first root pushes into cold
            soil looking for a reason to keep going.
          </p>
          <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
            Breeders spend decades on those seventy-two hours. Emergence speed,
            root angle, cold vigour — the traits nobody photographs are the ones
            that decide the season.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8">
            <div>
              <dt className="eyebrow">Germination</dt>
              <dd className="display mt-2 text-4xl text-foreground">72h</dd>
            </div>
            <div>
              <dt className="eyebrow">Root depth, day 20</dt>
              <dd className="display mt-2 text-4xl text-foreground">+34%</dd>
            </div>
          </dl>
        </Reveal>
        <Reveal delay={120} className="relative">
          <div className="glow relative overflow-hidden rounded-sm border border-border">
            <img
              src={seed}
              alt="Macro photograph of a corn kernel germinating in dark soil"
              width={1200}
              height={900}
              loading="lazy"
              className="h-[420px] w-full object-cover md:h-[560px]"
              style={{ transform: `translateY(${Math.min(0, (y - 700) * 0.03)}px)` }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StatsBand() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px px-6 md:grid-cols-4 md:px-10">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 90}>
            <div className="px-2 py-12 md:py-16">
              <p className="display text-[clamp(2.6rem,5vw,4.5rem)] text-primary">
                {s.value}
              </p>
              <p className="mt-3 max-w-[14rem] text-sm leading-snug text-muted-foreground">
                {s.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FieldSection({ y }: { y: number }) {
  return (
    <section id="field" className="grain relative h-[110svh] min-h-[640px] overflow-hidden">
      <img
        src={aerial}
        alt="Aerial view of geometric farmland rows at dusk"
        width={1600}
        height={900}
        loading="lazy"
        className="absolute inset-0 h-[120%] w-full object-cover"
        style={{ transform: `translateY(${(y - 1600) * -0.06}px)` }}
      />
      <div className="absolute inset-0 bg-soil/55" />
      <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-center px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">Chapter two — the field</p>
          <h2 className="mt-5 max-w-4xl text-[clamp(2.8rem,8vw,7rem)]">
            One crop, drawn
            <br />
            over the planet
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-foreground/80">
            Corn covers more ground than any other crop on Earth. Seen from above,
            a season is a grid of decisions: row spacing, population, timing — each
            one multiplied by two hundred million hectares.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function TraitsSection() {
  return (
    <section className="py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">Four traits</p>
          <h2 className="mt-5 max-w-3xl text-[clamp(2.4rem,6vw,5rem)]">
            What we bred for
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-px border-t border-border md:grid-cols-2">
          {traits.map((t, i) => (
            <Reveal key={t.n} delay={i * 90}>
              <article className="group border-b border-border py-10 transition-colors md:px-8 md:hover:bg-card">
                <p className="display text-5xl text-primary/70 transition-colors group-hover:text-primary">
                  {t.n}
                </p>
                <h3 className="mt-4 text-3xl">{t.title}</h3>
                <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
                  {t.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function YieldSection() {
  return (
    <section id="yield" className="relative overflow-hidden bg-soil py-28 md:py-40">
      <div className="mx-auto grid max-w-[1600px] items-center gap-16 px-6 md:grid-cols-[0.9fr_1.1fr] md:px-10">
        <Reveal className="order-2 md:order-1">
          <div className="relative animate-sway">
            <img
              src={ear}
              alt="A single ear of corn with the husk peeled back, lit dramatically"
              width={1024}
              height={1280}
              loading="lazy"
              className="mx-auto max-h-[640px] w-auto object-contain drop-shadow-2xl"
            />
          </div>
        </Reveal>
        <Reveal delay={120} className="order-1 md:order-2">
          <p className="eyebrow">Chapter three — the yield</p>
          <h2 className="mt-5 text-[clamp(2.6rem,6vw,5.5rem)]">
            Eight hundred
            <br />
            small verdicts
          </h2>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground">
            An ear carries roughly eight hundred kernels, and each one is a verdict
            on the season: how the rain fell, how the nights cooled, whether
            pollination held through the worst week of July.
          </p>
          <ul className="mt-10 space-y-4 border-t border-border pt-8">
            {[
              ["Kernels per ear", "~800"],
              ["Rows per ear", "16 – 20"],
              ["Days, planting to harvest", "110"],
            ].map(([k, v]) => (
              <li
                key={k}
                className="flex items-baseline justify-between gap-6 border-b border-border pb-4"
              >
                <span className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  {k}
                </span>
                <span className="display text-3xl text-primary">{v}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function FutureSection() {
  return (
    <section id="future" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">Chapter four — the future</p>
          <h2 className="mt-5 max-w-5xl text-[clamp(2.8rem,8vw,7rem)]">
            The next kernel
            <br />
            is already
            <br />
            in the ground
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-14 flex flex-col gap-10 border-t border-border pt-10 md:flex-row md:items-end md:justify-between">
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Hotter seasons, tighter water, thinner margins. The revolution isn't
              a single breakthrough — it's the slow, stubborn work of choosing
              better parents, one generation at a time.
            </p>
            <a
              href="#top"
              className="glow inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Back to the beginning ↑
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-soil py-12">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between md:px-10">
        <p className="display text-2xl tracking-widest">
          Kernel<span className="text-primary">.</span>
        </p>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          An original editorial concept about modern corn breeding. Figures are
          illustrative and not affiliated with any seed company.
        </p>
      </div>
    </footer>
  );
}
