import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- Phase narration synced to scroll progress ---
type Phase = {
  id: string;
  index: string;
  title: string;
  desc: string;
  range: [number, number];
};

const PHASES: Phase[] = [
  {
    id: 'site',
    index: '01',
    title: 'Site & Foundation',
    desc: 'Every form begins with the ground. We survey, set the datum line, and lay a foundation engineered for permanence.',
    range: [0, 0.3],
  },
  {
    id: 'frame',
    index: '02',
    title: 'Structural Frame',
    desc: 'Load-bearing pilotis and the ground storey rise — the disciplined skeleton beneath the architecture.',
    range: [0.3, 0.52],
  },
  {
    id: 'floors',
    index: '03',
    title: 'The Cantilever',
    desc: 'A second volume floats free of the base, the signature gesture that gives the residence its weightless poise.',
    range: [0.52, 0.72],
  },
  {
    id: 'envelope',
    index: '04',
    title: 'Roof & Envelope',
    desc: 'The parapet caps the composition and the envelope is sealed against light, weather, and time.',
    range: [0.72, 0.84],
  },
  {
    id: 'finishes',
    index: '05',
    title: 'Glazing & Light',
    desc: 'Full-height glazing is set and the interiors come alive — warmth spilling out as the home first breathes.',
    range: [0.84, 0.94],
  },
  {
    id: 'handover',
    index: '06',
    title: 'Handover',
    desc: 'Landscape softens the edges and the drawing resolves into the finished work. Vision, realised.',
    range: [0.94, 1],
  },
];

const progressToIndex = (p: number): number => {
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (p >= PHASES[i].range[0]) return i;
  }
  return 0;
};

export const ConstructionSequence = () => {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Reduced motion: render the finished building, no pin, no scrub.
      if (reduce) {
        gsap.set(
          ['.cs-foundation', '.cs-frame', '.cs-cantilever', '.cs-roof', '.cs-window', '.cs-tree', '.cs-glow'],
          { opacity: 1, scaleX: 1, scaleY: 1, y: 0 },
        );
        gsap.set('.cs-glow', { opacity: 0.8 });
        gsap.set('.cs-blueprint', { opacity: 0.12 });
        gsap.set('.cs-stamp', { opacity: 1, scale: 1 });
        gsap.set('.cs-dim', { opacity: 0 });
        setActive(PHASES.length - 1);
        setProgress(1);
        return;
      }

      // Initial hidden states ---------------------------------------------
      gsap.set('.cs-blueprint', { opacity: 0 });
      gsap.set('.cs-ground', { scaleX: 0, transformOrigin: '50% 50%' });
      gsap.set('.cs-dim', { opacity: 0 });
      gsap.set('.cs-foundation', { scaleY: 0, transformOrigin: '50% 100%' });
      gsap.set(['.cs-frame', '.cs-column'], { scaleY: 0, transformOrigin: '50% 100%' });
      gsap.set('.cs-cantilever', { y: -90, opacity: 0 });
      gsap.set('.cs-roof', { scaleX: 0, transformOrigin: '50% 50%' });
      gsap.set('.cs-window', { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' });
      gsap.set('.cs-glow', { opacity: 0 });
      gsap.set('.cs-facade', { strokeDashoffset: 1 });
      gsap.set('.cs-tree', { scaleY: 0, opacity: 0, transformOrigin: '50% 100%' });
      gsap.set('.cs-stamp', { opacity: 0, scale: 0.85 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: '+=2800',
          scrub: 0.6,
          pin: '.cs-stage',
          anticipatePin: 1,
          onUpdate: (self) => {
            setProgress(self.progress);
            setActive(progressToIndex(self.progress));
          },
        },
      });

      // 01 — Site & foundation
      tl.to('.cs-blueprint', { opacity: 0.16, duration: 0.06 }, 0)
        .to('.cs-ground', { scaleX: 1, duration: 0.08, ease: 'power2.out' }, 0.04)
        .to('.cs-dim', { opacity: 0.55, duration: 0.06 }, 0.1)
        .to('.cs-foundation', { scaleY: 1, duration: 0.1, ease: 'power3.out' }, 0.18);

      // 02 — Structural frame
      tl.to('.cs-column', { scaleY: 1, duration: 0.08, stagger: 0.015, ease: 'power2.out' }, 0.3)
        .to('.cs-frame', { scaleY: 1, duration: 0.1, ease: 'power3.out' }, 0.36)
        .to(
          '.cs-window-l1',
          { opacity: 1, scale: 1, duration: 0.06, stagger: 0.02, ease: 'back.out(1.7)' },
          0.44,
        );

      // 03 — Cantilever floats into place
      tl.to('.cs-cantilever', { y: 0, opacity: 1, duration: 0.12, ease: 'power3.out' }, 0.54).to(
        '.cs-window-l2',
        { opacity: 1, scale: 1, duration: 0.06, stagger: 0.02, ease: 'back.out(1.7)' },
        0.64,
      );

      // 04 — Roof & envelope
      tl.to('.cs-roof', { scaleX: 1, duration: 0.09, ease: 'power3.out' }, 0.72).to(
        '.cs-facade',
        { strokeDashoffset: 0, duration: 0.08, ease: 'power1.inOut' },
        0.78,
      );

      // 05 — Glazing lights up
      tl.to('.cs-glow', { opacity: 0.8, duration: 0.08, stagger: 0.015 }, 0.84);

      // 06 — Landscape + resolve to finished drawing
      tl.to('.cs-tree', { scaleY: 1, opacity: 1, duration: 0.08, stagger: 0.04, ease: 'back.out(1.4)' }, 0.88)
        .to('.cs-dim', { opacity: 0, duration: 0.06 }, 0.92)
        .to('.cs-blueprint', { opacity: 0.06, duration: 0.06 }, 0.93)
        .to('.cs-stamp', { opacity: 1, scale: 1, duration: 0.06, ease: 'back.out(1.7)' }, 0.95);
    },
    { scope: rootRef },
  );

  return (
    <section
      id="build"
      ref={rootRef}
      className="relative bg-stone-950 text-white noise-overlay"
      aria-label="Watch a residence take shape"
    >
      <div className="cs-stage relative h-screen w-full overflow-hidden flex items-center">
        {/* Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(var(--accent-rgb),0.08),transparent_55%)]" />
        <div className="absolute inset-0 cs-grid-bg opacity-[0.4]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Caption panel */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-accent mb-5 uppercase">
              The Build · Scroll to construct
            </span>
            <div className="relative min-h-[220px]">
              {PHASES.map((phase, i) => (
                <div
                  key={phase.id}
                  className={`absolute inset-0 transition-all duration-500 ${
                    i === active
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4 pointer-events-none'
                  }`}
                >
                  <div className="flex items-baseline gap-4 mb-4">
                    <span className="font-serif text-5xl md:text-6xl text-stone-700 leading-none nums">
                      {phase.index}
                    </span>
                    <span className="w-10 h-px bg-accent translate-y-[-0.6rem]" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-serif mb-4 leading-[1.1]">{phase.title}</h3>
                  <p className="text-stone-400 text-sm md:text-base leading-relaxed max-w-md">{phase.desc}</p>
                </div>
              ))}
            </div>

            {/* Phase ticker */}
            <div className="flex items-center gap-2 mt-10">
              {PHASES.map((phase, i) => (
                <span
                  key={phase.id}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === active ? 'w-8 bg-accent' : i < active ? 'w-4 bg-stone-600' : 'w-4 bg-stone-800'
                  }`}
                />
              ))}
              <span className="ml-3 text-[0.65rem] font-mono text-stone-500 tracking-wider">
                {String(Math.round(progress * 100)).padStart(2, '0')}%
              </span>
            </div>
          </div>

          {/* The building blueprint that constructs itself */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <svg
              viewBox="0 0 800 600"
              className="w-full h-auto max-h-[68vh] mx-auto overflow-visible"
              role="img"
              aria-label="An architectural elevation assembling from foundation to finished residence"
            >
              {/* Blueprint annotation grid */}
              <g className="cs-blueprint" stroke="var(--color-accent)" strokeWidth="0.5">
                {Array.from({ length: 17 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="600" />
                ))}
                {Array.from({ length: 13 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} />
                ))}
              </g>

              {/* Dimension annotations (blueprint, fade out when built) */}
              <g className="cs-dim" stroke="#e7e5e4" strokeWidth="1" fill="#e7e5e4">
                <line x1="150" y1="500" x2="650" y2="500" strokeDasharray="4 4" />
                <line x1="150" y1="492" x2="150" y2="508" />
                <line x1="650" y1="492" x2="650" y2="508" />
                <text x="400" y="522" fontSize="13" textAnchor="middle" className="font-mono" stroke="none">
                  18.40 m
                </text>
                <line x1="120" y1="200" x2="120" y2="470" strokeDasharray="4 4" />
                <text
                  x="104"
                  y="340"
                  fontSize="13"
                  textAnchor="middle"
                  className="font-mono"
                  stroke="none"
                  transform="rotate(-90 104 340)"
                >
                  9.10 m
                </text>
              </g>

              {/* Ground datum line */}
              <line className="cs-ground" x1="80" y1="470" x2="720" y2="470" stroke="var(--color-accent)" strokeWidth="2" />

              {/* Foundation slab */}
              <rect className="cs-foundation" x="205" y="448" width="390" height="24" fill="#292524" stroke="#57534e" strokeWidth="1.5" />

              {/* Pilotis / columns */}
              <g className="cs-column-group">
                {[250, 330, 470, 550].map((x) => (
                  <rect key={x} className="cs-frame cs-column" x={x} y="330" width="14" height="120" fill="#44403c" />
                ))}
              </g>

              {/* Ground storey wall */}
              <rect className="cs-frame" x="232" y="330" width="336" height="120" fill="#1c1917" stroke="#57534e" strokeWidth="1.5" />

              {/* Ground floor glazing */}
              <g>
                {[256, 322, 388, 454, 520].map((x) => (
                  <g key={x}>
                    <rect className="cs-window cs-window-l1" x={x} y="350" width="44" height="80" fill="#0c0a09" stroke="#78716c" strokeWidth="1" />
                    <rect className="cs-glow" x={x} y="350" width="44" height="80" fill="var(--color-accent)" opacity="0" />
                  </g>
                ))}
              </g>

              {/* Cantilevered upper volume (floats down into place) */}
              <g className="cs-cantilever">
                <rect x="180" y="208" width="440" height="118" fill="#292524" stroke="#78716c" strokeWidth="1.5" />
                {/* Upper glazing band */}
                {[206, 272, 338, 404, 470, 536].map((x) => (
                  <g key={x}>
                    <rect className="cs-window cs-window-l2" x={x} y="228" width="48" height="78" fill="#0c0a09" stroke="#78716c" strokeWidth="1" />
                    <rect className="cs-glow" x={x} y="228" width="48" height="78" fill="var(--color-accent)" opacity="0" />
                  </g>
                ))}
                {/* Facade reveal lines */}
                <line className="cs-facade" x1="180" y1="267" x2="620" y2="267" stroke="#a8a29e" strokeWidth="1" pathLength={1} strokeDasharray="1" />
              </g>

              {/* Roof parapet */}
              <rect className="cs-roof" x="168" y="190" width="464" height="20" fill="#0c0a09" stroke="var(--color-accent)" strokeWidth="1.5" />

              {/* Landscaping */}
              <g fill="#44403c" stroke="#57534e" strokeWidth="1">
                <g className="cs-tree">
                  <rect x="128" y="440" width="6" height="30" fill="#57534e" />
                  <circle cx="131" cy="432" r="20" />
                </g>
                <g className="cs-tree">
                  <rect x="668" y="446" width="6" height="24" fill="#57534e" />
                  <circle cx="671" cy="438" r="16" />
                </g>
              </g>

              {/* Completion stamp */}
              <g className="cs-stamp">
                <rect x="556" y="120" width="180" height="46" rx="4" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
                <text x="646" y="142" fontSize="13" letterSpacing="3" textAnchor="middle" fill="var(--color-accent)" className="font-mono">
                  PROJECT
                </text>
                <text x="646" y="158" fontSize="13" letterSpacing="3" textAnchor="middle" fill="var(--color-accent)" className="font-mono">
                  REALISED
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[0.55rem] tracking-[0.3em] uppercase text-stone-600 font-medium hidden md:block">
          {progress < 0.02 ? 'Keep scrolling' : progress > 0.97 ? 'Complete' : ''}
        </div>
      </div>
    </section>
  );
};
