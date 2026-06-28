import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  ChevronDown,
  Copy,
  Save,
  RotateCcw,
  Check,
  ArrowUp,
  ArrowDown,
  Palette,
  Type,
  Sparkles,
  Megaphone,
  Info,
  Award,
  LayoutGrid,
  Wrench,
  Quote as QuoteIcon,
  ListChecks,
  MessageSquareQuote,
  Phone,
  PanelBottom,
} from 'lucide-react';
import {
  getSiteContent,
  updateSiteContent,
  resetSiteContent,
  type SiteContent,
} from '../../lib/siteContent';

/* ──────────────────────────────────────────────
   Field primitives
   ────────────────────────────────────────────── */

const labelCls = 'text-[0.65rem] font-bold uppercase tracking-[0.18em] text-stone-400';
const inputCls =
  'w-full bg-stone-950 border border-stone-800 hover:border-stone-700/70 rounded-xl px-3.5 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all';

const Field = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className={labelCls}>{label}</label>
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  </div>
);

const TextArea = ({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className={labelCls}>{label}</label>
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} resize-none leading-relaxed`}
    />
  </div>
);

const ColorField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className={labelCls}>{label}</label>
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} colour picker`}
        className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-stone-800 bg-stone-950 p-1"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} font-mono uppercase`}
        placeholder="#f97316"
      />
      <div
        className="h-11 w-11 shrink-0 rounded-lg border border-stone-800"
        style={{ backgroundColor: value }}
        aria-hidden="true"
      />
    </div>
  </div>
);

/* List of plain strings (marquee items, badges, logos, feature bullets). */
const StringListEditor = ({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) => {
  const setAt = (i: number, v: string) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      <label className={labelCls}>{label}</label>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              placeholder={placeholder}
              onChange={(e) => setAt(i, e.target.value)}
              className={inputCls}
            />
            <div className="flex shrink-0 items-center gap-1">
              <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp size={13} />
              </IconBtn>
              <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                <ArrowDown size={13} />
              </IconBtn>
              <IconBtn label="Remove" danger onClick={() => remove(i)}>
                <Trash2 size={13} />
              </IconBtn>
            </div>
          </div>
        ))}
      </div>
      <AddBtn onClick={() => onChange([...items, ''])} label="Add item" />
    </div>
  );
};

/* List of objects rendered as cards (stats, sectors, services, steps, testimonials). */
function ObjectListEditor<T>({
  label,
  items,
  onChange,
  template,
  titleOf,
  render,
}: {
  label: string;
  items: T[];
  onChange: (next: T[]) => void;
  template: () => T;
  titleOf: (item: T, i: number) => string;
  render: (item: T, onItemChange: (next: T) => void) => React.ReactNode;
}) {
  const setAt = (i: number, v: T) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const duplicate = (i: number) => {
    const next = [...items];
    next.splice(i + 1, 0, structuredClone(items[i]));
    onChange(next);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-3">
      <label className={labelCls}>{label}</label>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-stone-800 bg-stone-950/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="truncate text-xs font-semibold text-stone-300">
                {titleOf(item, i) || `Item ${i + 1}`}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp size={13} />
                </IconBtn>
                <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                  <ArrowDown size={13} />
                </IconBtn>
                <IconBtn label="Duplicate" onClick={() => duplicate(i)}>
                  <Copy size={13} />
                </IconBtn>
                <IconBtn label="Remove" danger onClick={() => remove(i)}>
                  <Trash2 size={13} />
                </IconBtn>
              </div>
            </div>
            <div className="flex flex-col gap-3">{render(item, (v) => setAt(i, v))}</div>
          </div>
        ))}
      </div>
      <AddBtn onClick={() => onChange([...items, template()])} label={`Add ${label.toLowerCase()}`} />
    </div>
  );
}

const IconBtn = ({
  children,
  onClick,
  label,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    disabled={disabled}
    className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
      danger
        ? 'border-red-950/40 bg-red-950/20 text-red-400 hover:bg-red-900/35 hover:text-red-300'
        : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-700 hover:bg-stone-800 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const AddBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center justify-center gap-1.5 self-start rounded-lg border border-dashed border-stone-700 bg-stone-900/40 px-3.5 py-2 text-[0.7rem] font-semibold uppercase tracking-wider text-stone-400 transition-all hover:border-accent/60 hover:text-white"
  >
    <Plus size={13} /> {label}
  </button>
);

/* ──────────────────────────────────────────────
   Accordion section
   ────────────────────────────────────────────── */

const Section = ({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-800/80 bg-stone-900/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-stone-900/60"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Icon size={16} />
          </span>
          <span className="font-serif text-lg font-bold text-white">{title}</span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-stone-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col gap-4 border-t border-stone-800/80 p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ──────────────────────────────────────────────
   Main editor
   ────────────────────────────────────────────── */

export const SiteContentEditor = () => {
  const [content, setContent] = useState<SiteContent>(() => getSiteContent());
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  // Immutable patch helper: shallow-merge a partial onto a top-level section.
  const patch = <K extends keyof SiteContent>(key: K, value: Partial<SiteContent[K]>) => {
    setContent((c) => ({ ...c, [key]: { ...(c[key] as object), ...value } }));
    setDirty(true);
    setSaved(false);
  };

  // Replace a whole top-level field (used for the marquee string array).
  const setField = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => {
    setContent((c) => ({ ...c, [key]: value }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = () => {
    updateSiteContent(content);
    setDirty(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (!confirm('Reset ALL site content back to the original defaults? This cannot be undone.')) return;
    resetSiteContent();
    setContent(getSiteContent());
    setDirty(false);
    setSaved(false);
  };

  const c = content;

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="rounded-2xl border border-stone-800/80 bg-stone-900/40 p-6">
        <h3 className="font-serif text-2xl font-bold text-white">Website Content</h3>
        <p className="mt-1 text-sm text-stone-400">
          Edit every section of the public site. Changes preview live and are saved to this browser
          when you press <span className="text-accent">Save changes</span>.
        </p>
      </div>

      <div className="space-y-3">
        {/* Theme */}
        <Section title="Theme & Colour" icon={Palette} defaultOpen>
          <ColorField
            label="Brand accent colour"
            value={c.theme.accent}
            onChange={(v) => patch('theme', { accent: v })}
          />
          <p className="text-xs text-stone-500">
            This colour drives every highlight, button and hover across the entire site.
          </p>
        </Section>

        {/* Brand */}
        <Section title="Brand" icon={Type}>
          <Field
            label="Brand name"
            value={c.brand.nameDevanagari}
            onChange={(v) => patch('brand', { nameDevanagari: v })}
          />
          <Field
            label="Subtitle"
            value={c.brand.subtitle}
            onChange={(v) => patch('brand', { subtitle: v })}
          />
        </Section>

        {/* Hero */}
        <Section title="Hero" icon={Sparkles}>
          <Field label="Badge" value={c.hero.badge} onChange={(v) => patch('hero', { badge: v })} />
          <Field
            label="Title line 1"
            value={c.hero.titleLine1}
            onChange={(v) => patch('hero', { titleLine1: v })}
          />
          <Field
            label="Title line 2 (italic)"
            value={c.hero.titleLine2}
            onChange={(v) => patch('hero', { titleLine2: v })}
          />
          <TextArea
            label="Description"
            value={c.hero.description}
            onChange={(v) => patch('hero', { description: v })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Primary button"
              value={c.hero.primaryCta}
              onChange={(v) => patch('hero', { primaryCta: v })}
            />
            <Field
              label="Secondary button"
              value={c.hero.secondaryCta}
              onChange={(v) => patch('hero', { secondaryCta: v })}
            />
          </div>
          <StringListEditor
            label="Feature badges"
            items={c.hero.badges}
            onChange={(badges) => patch('hero', { badges })}
          />
        </Section>

        {/* Marquee */}
        <Section title="Marquee Ticker" icon={Megaphone}>
          <StringListEditor
            label="Ticker items"
            items={c.marquee}
            onChange={(marquee) => setField('marquee', marquee)}
          />
        </Section>

        {/* About */}
        <Section title="About" icon={Info}>
          <Field label="Eyebrow" value={c.about.eyebrow} onChange={(v) => patch('about', { eyebrow: v })} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Heading line 1"
              value={c.about.heading1}
              onChange={(v) => patch('about', { heading1: v })}
            />
            <Field
              label="Heading line 2 (italic)"
              value={c.about.heading2}
              onChange={(v) => patch('about', { heading2: v })}
            />
          </div>
          <TextArea
            label="Paragraph 1"
            value={c.about.paragraph1}
            onChange={(v) => patch('about', { paragraph1: v })}
          />
          <TextArea
            label="Paragraph 2"
            value={c.about.paragraph2}
            onChange={(v) => patch('about', { paragraph2: v })}
          />
          <Field label="Image URL" value={c.about.image} onChange={(v) => patch('about', { image: v })} />
          <TextArea
            label="Quote (floating card)"
            value={c.about.quote}
            onChange={(v) => patch('about', { quote: v })}
            rows={2}
          />
          <ObjectListEditor
            label="Stats"
            items={c.about.stats}
            onChange={(stats) => patch('about', { stats })}
            template={() => ({ value: '0+', label: 'New stat' })}
            titleOf={(s) => `${s.value} — ${s.label}`}
            render={(s, set) => (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Value" value={s.value} onChange={(v) => set({ ...s, value: v })} />
                <Field label="Label" value={s.label} onChange={(v) => set({ ...s, label: v })} />
              </div>
            )}
          />
        </Section>

        {/* Trusted By */}
        <Section title="Trusted By" icon={Award}>
          <Field
            label="Eyebrow"
            value={c.trustedBy.eyebrow}
            onChange={(v) => patch('trustedBy', { eyebrow: v })}
          />
          <StringListEditor
            label="Logos / publication names"
            items={c.trustedBy.logos}
            onChange={(logos) => patch('trustedBy', { logos })}
          />
        </Section>

        {/* Sectors */}
        <Section title="Sectors" icon={LayoutGrid}>
          <Field
            label="Eyebrow"
            value={c.sectors.eyebrow}
            onChange={(v) => patch('sectors', { eyebrow: v })}
          />
          <Field
            label="Heading"
            value={c.sectors.heading}
            onChange={(v) => patch('sectors', { heading: v })}
          />
          <ObjectListEditor
            label="Sectors"
            items={c.sectors.items}
            onChange={(items) => patch('sectors', { items })}
            template={() => ({ title: 'New Sector', description: '', image: '' })}
            titleOf={(s) => s.title}
            render={(s, set) => (
              <>
                <Field label="Title" value={s.title} onChange={(v) => set({ ...s, title: v })} />
                <TextArea
                  label="Description"
                  value={s.description}
                  onChange={(v) => set({ ...s, description: v })}
                  rows={2}
                />
                <Field label="Image URL" value={s.image} onChange={(v) => set({ ...s, image: v })} />
              </>
            )}
          />
        </Section>

        {/* Services */}
        <Section title="Services" icon={Wrench}>
          <Field
            label="Eyebrow"
            value={c.services.eyebrow}
            onChange={(v) => patch('services', { eyebrow: v })}
          />
          <Field
            label="Heading"
            value={c.services.heading}
            onChange={(v) => patch('services', { heading: v })}
          />
          <ObjectListEditor
            label="Services"
            items={c.services.items}
            onChange={(items) => patch('services', { items })}
            template={() => ({ icon: '00', title: 'New Service', description: '', features: [] })}
            titleOf={(s) => s.title}
            render={(s, set) => (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Number / icon" value={s.icon} onChange={(v) => set({ ...s, icon: v })} />
                  <div className="sm:col-span-2">
                    <Field label="Title" value={s.title} onChange={(v) => set({ ...s, title: v })} />
                  </div>
                </div>
                <TextArea
                  label="Description"
                  value={s.description}
                  onChange={(v) => set({ ...s, description: v })}
                  rows={2}
                />
                <StringListEditor
                  label="Features"
                  items={s.features}
                  onChange={(features) => set({ ...s, features })}
                />
              </>
            )}
          />
        </Section>

        {/* Quote */}
        <Section title="Parallax Quote" icon={QuoteIcon}>
          <TextArea label="Quote text" value={c.quote.text} onChange={(v) => patch('quote', { text: v })} />
          <Field label="Background image URL" value={c.quote.image} onChange={(v) => patch('quote', { image: v })} />
        </Section>

        {/* Process */}
        <Section title="Process" icon={ListChecks}>
          <Field
            label="Eyebrow"
            value={c.process.eyebrow}
            onChange={(v) => patch('process', { eyebrow: v })}
          />
          <Field
            label="Heading"
            value={c.process.heading}
            onChange={(v) => patch('process', { heading: v })}
          />
          <ObjectListEditor
            label="Steps"
            items={c.process.steps}
            onChange={(steps) => patch('process', { steps })}
            template={() => ({ number: '00', title: 'New Step', desc: '' })}
            titleOf={(s) => `${s.number}. ${s.title}`}
            render={(s, set) => (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Number" value={s.number} onChange={(v) => set({ ...s, number: v })} />
                  <div className="sm:col-span-2">
                    <Field label="Title" value={s.title} onChange={(v) => set({ ...s, title: v })} />
                  </div>
                </div>
                <TextArea label="Description" value={s.desc} onChange={(v) => set({ ...s, desc: v })} rows={2} />
              </>
            )}
          />
        </Section>

        {/* Testimonials */}
        <Section title="Testimonials" icon={MessageSquareQuote}>
          <Field
            label="Heading"
            value={c.testimonials.heading}
            onChange={(v) => patch('testimonials', { heading: v })}
          />
          <ObjectListEditor
            label="Testimonials"
            items={c.testimonials.items}
            onChange={(items) => patch('testimonials', { items })}
            template={() => ({ text: '', author: 'New Client', role: '' })}
            titleOf={(t) => t.author}
            render={(t, set) => (
              <>
                <TextArea label="Quote" value={t.text} onChange={(v) => set({ ...t, text: v })} rows={3} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Author" value={t.author} onChange={(v) => set({ ...t, author: v })} />
                  <Field label="Role" value={t.role} onChange={(v) => set({ ...t, role: v })} />
                </div>
              </>
            )}
          />
        </Section>

        {/* CTA */}
        <Section title="CTA Banner" icon={Sparkles}>
          <Field label="Eyebrow" value={c.cta.eyebrow} onChange={(v) => patch('cta', { eyebrow: v })} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Title line 1"
              value={c.cta.titleLine1}
              onChange={(v) => patch('cta', { titleLine1: v })}
            />
            <Field
              label="Title line 2 (italic)"
              value={c.cta.titleLine2}
              onChange={(v) => patch('cta', { titleLine2: v })}
            />
          </div>
          <TextArea
            label="Description"
            value={c.cta.description}
            onChange={(v) => patch('cta', { description: v })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Primary button"
              value={c.cta.primaryCta}
              onChange={(v) => patch('cta', { primaryCta: v })}
            />
            <Field
              label="Secondary button"
              value={c.cta.secondaryCta}
              onChange={(v) => patch('cta', { secondaryCta: v })}
            />
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact" icon={Phone}>
          <Field label="Eyebrow" value={c.contact.eyebrow} onChange={(v) => patch('contact', { eyebrow: v })} />
          <Field label="Heading" value={c.contact.heading} onChange={(v) => patch('contact', { heading: v })} />
          <TextArea
            label="Description"
            value={c.contact.description}
            onChange={(v) => patch('contact', { description: v })}
          />
          <TextArea
            label="Office address"
            value={c.contact.office}
            onChange={(v) => patch('contact', { office: v })}
            rows={2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" value={c.contact.email} onChange={(v) => patch('contact', { email: v })} />
            <Field label="Phone" value={c.contact.phone} onChange={(v) => patch('contact', { phone: v })} />
          </div>
          <TextArea label="Hours" value={c.contact.hours} onChange={(v) => patch('contact', { hours: v })} rows={2} />
          <Field
            label="WhatsApp number (digits only, e.g. 917020705148)"
            value={c.contact.whatsapp}
            onChange={(v) => patch('contact', { whatsapp: v })}
          />
        </Section>

        {/* Footer */}
        <Section title="Footer" icon={PanelBottom}>
          <TextArea label="Footer blurb" value={c.footer.blurb} onChange={(v) => patch('footer', { blurb: v })} />
        </Section>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-10">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-800 bg-stone-900/90 px-5 py-4 shadow-2xl shadow-black/50 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs">
            {saved ? (
              <span className="flex items-center gap-1.5 font-semibold text-green-400">
                <Check size={14} /> Saved &amp; published live
              </span>
            ) : dirty ? (
              <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" /> Unsaved changes
              </span>
            ) : (
              <span className="text-stone-500">All changes saved</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-400 transition-all hover:border-stone-700 hover:text-white"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty}
              className="btn-accent flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-lg shadow-accent/10 transition-all hover:-translate-y-0.5 hover:shadow-accent/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save size={13} /> Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
