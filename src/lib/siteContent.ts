// Site-wide editable content store.
// Mirrors the localStorage + listener pattern used in firebase.ts so the
// landing page updates in real time whenever the admin saves changes.

import { useEffect, useState } from 'react';

export interface StatItem {
  value: string;
  label: string;
}

export interface SectorItem {
  title: string;
  description: string;
  image: string;
}

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
  features: string[];
}

export interface ProcessStep {
  number: string;
  title: string;
  desc: string;
}

export interface TestimonialItem {
  text: string;
  author: string;
  role: string;
}

export interface SiteContent {
  theme: {
    accent: string; // hex, e.g. #f97316
  };
  brand: {
    nameDevanagari: string;
    subtitle: string;
  };
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    badges: string[];
  };
  marquee: string[];
  about: {
    eyebrow: string;
    heading1: string;
    heading2: string;
    paragraph1: string;
    paragraph2: string;
    image: string;
    quote: string;
    stats: StatItem[];
  };
  trustedBy: {
    eyebrow: string;
    logos: string[];
  };
  sectors: {
    eyebrow: string;
    heading: string;
    items: SectorItem[];
  };
  services: {
    eyebrow: string;
    heading: string;
    items: ServiceItem[];
  };
  quote: {
    text: string;
    image: string;
  };
  process: {
    eyebrow: string;
    heading: string;
    steps: ProcessStep[];
  };
  testimonials: {
    heading: string;
    items: TestimonialItem[];
  };
  cta: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  contact: {
    eyebrow: string;
    heading: string;
    description: string;
    office: string;
    email: string;
    phone: string;
    hours: string;
    whatsapp: string;
  };
  footer: {
    blurb: string;
  };
}

export const defaultContent: SiteContent = {
  theme: { accent: '#f97316' },
  brand: {
    nameDevanagari: 'स्वप्न क्षितिज',
    subtitle: 'Design Concepts',
  },
  hero: {
    badge: 'DPIIT-Recognised Design Studio',
    titleLine1: 'Elevating Spaces,',
    titleLine2: 'Enriching Lives',
    description: 'Crafting timeless, structurally precise environments for the modern connoisseur.',
    primaryCta: 'VIEW PORTFOLIO',
    secondaryCta: 'START YOUR PROJECT',
    badges: ['Architectural Planning', 'Luxury Interiors', 'Turnkey Execution'],
  },
  marquee: [
    'Architectural Planning',
    'Luxury Interiors',
    'Turnkey Execution',
    'Bespoke Residences',
    'Commercial Spaces',
    'Hospitality Design',
    'Material Sourcing',
    'Space Optimization',
  ],
  about: {
    eyebrow: 'About Us',
    heading1: 'Dream Horizon',
    heading2: 'Design Concepts',
    paragraph1:
      'As a DPIIT-recognised design and infrastructure company, Dream Horizon Design Concepts is your comprehensive hub for visionary architectural planning and interior transformation.',
    paragraph2:
      'From structurally sound commercial edifices to bespoke private residences, we bring architectural precision and refined interior finishes to every project, ensuring luxury and longevity.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    quote: 'Providing the finest materials—from marble sheets to wallpapers—for flawless execution.',
    stats: [
      { value: '150+', label: 'Projects Completed' },
      { value: '15', label: 'Design Awards' },
    ],
  },
  trustedBy: {
    eyebrow: 'As Featured In',
    logos: ['Architectural Digest', 'VOGUE', 'Elle Decor', 'Wallpaper*', 'Dezeen', 'AD India'],
  },
  sectors: {
    eyebrow: 'Our Focus',
    heading: 'Architectural Sectors',
    items: [
      {
        title: 'Private Residential',
        image:
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        description: 'Bespoke architectural design for luxury homes, villas, and private estates.',
      },
      {
        title: 'Commercial & Corporate',
        image:
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        description:
          'Innovative functional solutions for corporate offices, retail spaces, and mixed-use developments.',
      },
      {
        title: 'Public & Hospitality',
        image:
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        description: 'Immersive environments for hotels, resorts, educational facilities, and institutions.',
      },
    ],
  },
  services: {
    eyebrow: 'Our Expertise',
    heading: 'Comprehensive Solutions',
    items: [
      {
        title: 'Architectural Planning',
        description:
          'From concept evaluation to structural blueprints, we handle every architectural detail of your project.',
        icon: '01',
        features: ['Site Analysis', 'Structural Design', 'Building Permits'],
      },
      {
        title: 'Interior Architecture',
        description:
          'A seamless blend of structural functionality and exquisite interior aesthetics for a unified environment.',
        icon: '02',
        features: ['Space Planning', 'Custom Millwork', 'Material Sourcing'],
      },
      {
        title: 'Turnkey Execution',
        description:
          'End-to-end project management ensuring your commercial or private vision is realized flawlessly.',
        icon: '03',
        features: ['Contractor Coordination', 'Quality Control', 'Timely Delivery'],
      },
    ],
  },
  quote: {
    text: 'Design is not just what it looks like. Design is how it makes you feel.',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
  },
  process: {
    eyebrow: 'How It Works',
    heading: 'The Design Journey',
    steps: [
      { number: '01', title: 'Consultation', desc: 'We meet to discuss your vision, needs, and budget.' },
      { number: '02', title: 'Concept', desc: 'We create mood boards and initial layouts for your approval.' },
      { number: '03', title: 'Procurement', desc: 'We source materials, furniture, and coordinate with vendors.' },
      { number: '04', title: 'Installation', desc: 'Our team manages the delivery and setup of every element.' },
      { number: '05', title: 'The Reveal', desc: 'The final walkthrough of your transformed space.' },
    ],
  },
  testimonials: {
    heading: 'Client Stories',
    items: [
      {
        text: 'Luxe Interiors completely transformed our home. The attention to detail and the ability to capture our style was incredible.',
        author: 'Sarah Jenkins',
        role: 'Residential Client',
      },
      {
        text: 'Professional, creative, and a joy to work with. They turned our sterile office into a warm, productive environment.',
        author: 'Michael Chen',
        role: 'CEO, TechStart',
      },
      {
        text: 'The e-design service was perfect for my budget and timeline. I got the designer look I wanted without the full renovation stress.',
        author: 'Emma Thompson',
        role: 'E-Design Client',
      },
    ],
  },
  cta: {
    eyebrow: 'Ready to Transform?',
    titleLine1: "Let's Create Something",
    titleLine2: 'Extraordinary',
    description:
      'Book a complimentary consultation and discover how we can elevate your space beyond expectation.',
    primaryCta: 'BOOK YOUR CONSULTATION',
    secondaryCta: 'VIEW OUR WORK',
  },
  contact: {
    eyebrow: 'Get In Touch',
    heading: "Let's Discuss Your Project",
    description:
      "Ready to elevate your space? Fill out the form, and we'll reach out via WhatsApp within 24 hours to discuss your project.",
    office: 'Level 4, Trade Centre\nBandra Kurla Complex, Mumbai 400051',
    email: 'info@dreamhorizon.com',
    phone: '+91 70207 05148',
    hours: 'Mon - Fri: 9am - 6pm\nSat: By Appointment',
    whatsapp: '917020705148',
  },
  footer: {
    blurb: 'Elevating spaces through timeless design and meticulous attention to detail.',
  },
};

const STORAGE_KEY = 'dreamhorizon_site_content';

// Deep-merge stored content over defaults so newly added fields always exist.
const mergeWithDefaults = (stored: Partial<SiteContent> | null): SiteContent => {
  if (!stored) return defaultContent;
  const merged = structuredClone(defaultContent);
  const target = merged as unknown as Record<string, unknown>;
  for (const key of Object.keys(defaultContent) as (keyof SiteContent)[]) {
    const value = stored[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      target[key] = value;
    } else if (typeof value === 'object') {
      target[key] = { ...(merged[key] as object), ...value };
    } else {
      target[key] = value;
    }
  }
  return merged;
};

export const getSiteContent = (): SiteContent => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultContent;
  try {
    return mergeWithDefaults(JSON.parse(stored));
  } catch {
    return defaultContent;
  }
};

type ContentCallback = (content: SiteContent) => void;
const listeners = new Set<ContentCallback>();

export const subscribeSiteContent = (callback: ContentCallback) => {
  listeners.add(callback);
  callback(getSiteContent());
  return () => {
    listeners.delete(callback);
  };
};

const notify = () => {
  const content = getSiteContent();
  listeners.forEach((cb) => cb(content));
};

export const updateSiteContent = (content: SiteContent) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  notify();
};

export const resetSiteContent = () => {
  localStorage.removeItem(STORAGE_KEY);
  notify();
};

// Convenience hook used by landing-page sections.
export const useSiteContent = (): SiteContent => {
  const [content, setContent] = useState<SiteContent>(() => getSiteContent());
  useEffect(() => subscribeSiteContent(setContent), []);
  return content;
};
