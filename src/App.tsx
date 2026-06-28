import { useState, useEffect, useLayoutEffect, useRef, useCallback, Suspense } from 'react';
import { SignIn } from './components/Auth/SignIn';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { DashboardHome } from './components/Dashboard/DashboardHome';
import { motion, AnimatePresence, MotionConfig, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import { Menu, X, ArrowRight, ArrowUp, Instagram, Facebook, Linkedin, Star, Check, ChevronLeft, ChevronRight, Clock, FileText, BarChart3, Camera } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { HashRouter, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import { subscribeProjects, auth, onAuthStateChanged, getLocalProjects } from './lib/firebase';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ConstructionSequence } from './components/Construction/ConstructionSequence';
import { useSiteContent } from './lib/siteContent';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Optimize ScrollTrigger for mobile performance
ScrollTrigger.config({
  ignoreMobileResize: true,
});

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || 'ontouchstart' in window;
  });
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches || 'ontouchstart' in window);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
};

// --- Runtime theme: push the admin-chosen accent into CSS variables ---
const parseHex = (hex: string): { r: number; g: number; b: number } | null => {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const int = parseInt(full, 16);
  if (Number.isNaN(int) || full.length !== 6) return null;
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const hexToRgbChannels = (hex: string): string => {
  const rgb = parseHex(hex);
  return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '249, 115, 22';
};

// Darken a hex colour by a ratio (0–1) for consistent hover states.
const darkenHex = (hex: string, ratio = 0.12): string => {
  const rgb = parseHex(hex);
  if (!rgb) return '#ea580c';
  const f = (c: number) => Math.max(0, Math.round(c * (1 - ratio))).toString(16).padStart(2, '0');
  return `#${f(rgb.r)}${f(rgb.g)}${f(rgb.b)}`;
};

const ThemeApplier = () => {
  const { theme } = useSiteContent();
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--accent-rgb', hexToRgbChannels(theme.accent));
    root.style.setProperty('--accent-hover', darkenHex(theme.accent));
  }, [theme.accent]);
  return null;
};

// --- Cursor Follower ---
const CursorFollower = () => {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 250 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Skip mouse tracking entirely on touch devices — saves CPU
    if (isMobile) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('button') || 
        target.closest('a') || 
        target.classList.contains('cursor-pointer') ||
        target.closest('.cursor-pointer')
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Outer Ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-accent/40 pointer-events-none z-[200] hidden lg:block mix-blend-screen"
        style={{ x: useTransform(x, (val) => val - 16), y: useTransform(y, (val) => val - 16) }}
        animate={{
          scale: isHovered ? 1.5 : 1,
          backgroundColor: isHovered ? 'rgba(var(--accent-rgb), 0.15)' : 'rgba(var(--accent-rgb), 0)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
      {/* Inner Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2.5 h-2.5 rounded-full bg-accent pointer-events-none z-[201] hidden lg:block mix-blend-screen"
        style={{ x: useTransform(x, (val) => val - 5), y: useTransform(y, (val) => val - 5) }}
        animate={{
          scale: isHovered ? 0.5 : 1
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      />
    </>
  );
};

// --- Animated Counter ---
const AnimatedCounter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref} className="text-4xl md:text-5xl font-serif font-bold nums">{count}{suffix}</div>;
};

// --- Navbar ---
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const { brand } = useSiteContent();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const navLinks = [
    { name: 'The Build', href: 'build' },
    { name: 'Portfolio', href: 'portfolio' },
    { name: 'Services', href: 'services' },
    { name: 'Process', href: 'process' },
    { name: 'Contact', href: 'contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-8 ${
        isScrolled ? 'py-4' : 'py-6'
      }`}
    >
      <div className={`max-w-7xl mx-auto px-6 py-3 flex justify-between items-center transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-lg border border-white/20 rounded-2xl md:rounded-full px-8' 
          : 'bg-transparent border border-transparent'
      }`}>
        <Link to="/" className="flex flex-col items-start leading-none group">
          <span className={`text-2xl font-serif font-bold tracking-tight transition-colors duration-300 ${
            isScrolled ? 'text-stone-900' : 'text-white'
          } group-hover:text-accent`}>
            {brand.nameDevanagari}
          </span>
          <span className={`text-[0.55rem] font-sans tracking-[0.2em] uppercase mt-1 font-medium transition-colors duration-300 ${
            isScrolled ? 'text-stone-400' : 'text-white/60'
          }`}>
            {brand.subtitle}
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.name}
              href={`#${link.href}`}
              onClick={(e) => { e.preventDefault(); document.getElementById(link.href)?.scrollIntoView({ behavior: 'smooth' }); }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3, duration: 0.5 }}
              className={`relative text-xs font-medium tracking-[0.15em] transition-colors duration-300 px-4 py-2 group ${
                isScrolled ? 'text-stone-600 hover:text-stone-900' : 'text-stone-300 hover:text-white'
              }`}
            >
              {link.name.toUpperCase()}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-accent group-hover:w-3/4 transition-all duration-300" />
            </motion.a>
          ))}
          <motion.a
            href="#contact"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
            className={`px-6 py-2.5 text-xs font-medium tracking-[0.15em] transition-all duration-300 ml-4 hover:shadow-lg rounded-md md:rounded-full ${
              isScrolled 
                ? 'bg-stone-900 text-white hover:bg-accent hover:shadow-accent/20' 
                : 'bg-white text-stone-900 hover:bg-accent hover:text-white hover:shadow-accent/30'
            }`}
          >
            BOOK CONSULTATION
          </motion.a>
          {user ? (
            <Link
              to="/dashboard"
              className={`ml-4 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors ${
                isScrolled 
                  ? 'bg-accent/10 text-stone-900 hover:bg-accent/20' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className={`ml-4 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors ${
                isScrolled 
                  ? 'bg-accent/10 text-stone-900 hover:bg-accent/20' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Login
            </Link>
          )}
        </div>

        <button
          type="button"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          className={`md:hidden relative z-50 transition-colors ${
            isScrolled || isMobileMenuOpen ? 'text-stone-900' : 'text-white'
          }`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <AnimatePresence mode="wait">
            {isMobileMenuOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Menu size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="md:hidden fixed inset-0 bg-white/95 backdrop-blur-xl z-40 pt-24"
          >
            <div className="flex flex-col items-center p-8 space-y-2">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={`#${link.href}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="text-3xl font-serif text-stone-900 py-2 hover:text-accent transition-colors"
                  onClick={() => { setIsMobileMenuOpen(false); setTimeout(() => document.getElementById(link.href)?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                >
                  {link.name}
                </motion.a>
              ))}
              <motion.a
                href="#contact"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.08, duration: 0.4 }}
                className="bg-stone-900 text-white text-center py-4 px-12 mt-6 text-sm tracking-widest hover:bg-accent transition-colors"
                onClick={() => { setIsMobileMenuOpen(false); setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
              >
                BOOK CONSULTATION
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

// --- 3D Background ---
const AbstractArchitecture = () => {
  const groupRef = useRef<any>(null);
  const mesh1Ref = useRef<any>(null);
  const mesh2Ref = useRef<any>(null);
  const mesh3Ref = useRef<any>(null);
  const mesh4Ref = useRef<any>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = (THREE as any).MathUtils.lerp(groupRef.current.rotation.y, Math.sin(t / 4) * 0.5, 0.05);
      groupRef.current.rotation.x = (THREE as any).MathUtils.lerp(groupRef.current.rotation.x, Math.cos(t / 6) * 0.2, 0.05);
      groupRef.current.position.y = Math.sin(t / 2) * 0.15;
    }
    if (mesh1Ref.current) {
      mesh1Ref.current.rotation.x += 0.001;
      mesh1Ref.current.rotation.y -= 0.0015;
    }
    if (mesh2Ref.current) {
      mesh2Ref.current.rotation.z += 0.0005;
      mesh2Ref.current.rotation.y += 0.001;
    }
    if (mesh3Ref.current) {
      mesh3Ref.current.rotation.x -= 0.002;
      mesh3Ref.current.rotation.z += 0.0015;
    }
    if (mesh4Ref.current) {
      mesh4Ref.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.6}>
        {/* Large marble block */}
        <RoundedBox ref={mesh1Ref} args={[2.5, 2.5, 2.5]} radius={0.06} smoothness={3} position={[-2.2, 0.2, -1.2]}>
          <meshStandardMaterial color="#fafaf9" roughness={0.15} metalness={0.05} />
        </RoundedBox>
        
        {/* Copper wireframe */}
        <RoundedBox ref={mesh2Ref} args={[1.6, 3.8, 1.6]} radius={0.06} smoothness={3} position={[2.2, 1.2, 0.3]}>
          <meshStandardMaterial color="#ca8a04" roughness={0.2} metalness={0.9} wireframe />
        </RoundedBox>
        
        {/* Distorted core sphere — reduced segments for performance */}
        <mesh position={[0, -1.2, 1.2]}>
          <sphereGeometry args={[1.3, 32, 32]} />
          <MeshDistortMaterial color="#f97316" envMapIntensity={1.2} clearcoat={1} clearcoatRoughness={0.1} metalness={0.95} roughness={0.05} distort={0.3} speed={2} />
        </mesh>

        {/* Floating Gold Torus — reduced segments */}
        <mesh ref={mesh3Ref} position={[-1.2, -1.5, 0.5]}>
          <torusGeometry args={[0.7, 0.15, 12, 48]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Floating white sphere — reduced segments */}
        <mesh ref={mesh4Ref} position={[1.5, -1.8, -0.5]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#78716c" metalness={0.3} roughness={0.8} />
        </mesh>
      </Float>
    </group>
  );
};

// --- Hero ---
const Hero = () => {
  const { hero } = useSiteContent();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.95]);

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // Initial states
    gsap.set(".hero-orange-line", { scaleX: 0, opacity: 0 });
    gsap.set([".hero-sub", ".hero-title", ".hero-desc", ".hero-btn", ".hero-badge", ".hero-scroll"], {
      opacity: 0,
      y: 35
    });
    
    gsap.set(".hero-bg-canvas", {
      opacity: 0,
      scale: 1.15
    });

    // Run Timeline
    tl.to(".hero-bg-canvas", {
      opacity: 0.5,
      scale: 1,
      duration: 2.0,
      ease: "power3.out"
    })
    .to(".hero-orange-line", {
      scaleX: 1,
      opacity: 1,
      duration: 1.2,
      transformOrigin: "center",
      ease: "power4.out"
    }, "-=1.4")
    .to(".hero-sub", {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=1.0")
    .to(".hero-title", {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: "power4.out"
    }, "-=0.8")
    .to(".hero-desc", {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.6")
    .to(".hero-btn", {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out"
    }, "-=0.4")
    .to(".hero-badge", {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out"
    }, "-=0.3")
    .to(".hero-scroll", {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.2");

  }, { scope: containerRef });

  const isMobile = useIsMobile();

  return (
    <section ref={containerRef} className="relative h-screen flex items-center justify-center overflow-hidden bg-stone-950">
      {/* On mobile: lightweight CSS gradient background instead of full 3D canvas */}
      {isMobile ? (
        <div className="absolute inset-0 z-0 hero-bg-canvas">
          <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(249,115,22,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(6,182,212,0.08),transparent_50%)]" />
        </div>
      ) : (
        <motion.div className="absolute inset-0 z-0 hero-bg-canvas" style={{ y: y1 }}>
          <Canvas camera={{ position: [0, 0, 8.5], fov: 45 }} dpr={[1, 1.5]} performance={{ min: 0.5 }}>
            <ambientLight intensity={0.3} />
            <spotLight position={[-10, 15, 10]} color="#f97316" angle={0.25} penumbra={1} intensity={2} castShadow={false} />
            <directionalLight position={[10, -10, 5]} color="#06b6d4" intensity={1.2} />
            <spotLight position={[0, 10, 5]} angle={0.15} penumbra={1} intensity={0.8} castShadow={false} />
            <Suspense fallback={null}>
              <Environment preset="city" />
              <AbstractArchitecture />
            </Suspense>
          </Canvas>
        </motion.div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-stone-950/30 to-stone-950/70 z-0" />

      {/* Noise grain — disabled on mobile for performance */}
      {!isMobile && <div className="absolute inset-0 z-[1] opacity-[0.04] pointer-events-none noise-overlay" />}

      <motion.div
        style={{ opacity, y: useTransform(scrollY, [0, 500], [0, 100]), scale }}
        className="relative z-10 text-center text-white px-6 max-w-5xl mx-auto mt-16"
      >
        <div className="h-px bg-accent mx-auto mb-10 w-20 hero-orange-line" />

        <p className="text-[0.65rem] tracking-[0.5em] text-accent uppercase mb-8 font-bold hero-sub">
          {hero.badge}
        </p>

        <h1 className="text-5xl md:text-7xl lg:text-[6.5rem] font-serif font-medium leading-[1.0] mb-8 text-white hero-title">
          {hero.titleLine1}{' '}
          <br className="hidden md:block" />
          <span className="italic text-stone-300 font-light">{hero.titleLine2}</span>
        </h1>

        <p className="text-base md:text-lg font-light tracking-wide mb-14 max-w-xl mx-auto text-stone-300/90 leading-relaxed hero-desc">
          {hero.description}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-5">
          <motion.a
            href="#portfolio"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.preventDefault(); document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="bg-white text-stone-900 px-12 py-4.5 font-medium text-sm tracking-[0.15em] hover:bg-accent hover:text-white transition-all duration-300 hover:shadow-2xl hover:shadow-accent/20 hero-btn"
          >
            {hero.primaryCta}
          </motion.a>
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="border border-white/25 text-white px-12 py-4.5 font-medium text-sm tracking-[0.15em] hover:bg-white hover:text-stone-900 transition-all duration-300 backdrop-blur-sm hero-btn"
          >
            {hero.secondaryCta}
          </motion.a>
        </div>
      </motion.div>

      {/* Bottom feature badges */}
      <div className="absolute bottom-20 left-0 right-0 z-10 hidden lg:flex justify-center items-center gap-14 text-stone-500 text-[0.6rem] tracking-[0.3em] uppercase font-bold">
        {hero.badges.map((badge, i) => (
          <span key={i} className="flex items-center gap-3 hero-badge">
            <span className="w-1 h-1 rounded-full bg-accent" /> {badge}
          </span>
        ))}
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 cursor-pointer group hero-scroll"
        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <span className="text-[0.55rem] tracking-[0.3em] uppercase text-stone-500 font-medium group-hover:text-stone-300 transition-colors">Scroll</span>
        <div className="w-5 h-8 rounded-full border border-stone-600/50 p-1 flex justify-center">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-1 h-1 rounded-full bg-accent"
          />
        </div>
      </div>
    </section>
  );
};

// --- About ---
// --- About ---
// Split a stat string like "150+" into { target: 150, suffix: "+" } for the counter.
const parseStat = (value: string): { target: number; suffix: string } => {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return { target: 0, suffix: value };
  return { target: parseInt(match[1], 10), suffix: match[2] };
};

const About = () => {
  const { about } = useSiteContent();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Parallax on the image inside its overflow-hidden parent
    gsap.fromTo(".about-parallax-img", 
      { yPercent: -12, scale: 1.2 },
      {
        yPercent: 12,
        scale: 1.15,
        scrollTrigger: {
          trigger: ".about-image-wrapper",
          start: "top bottom",
          end: "bottom top",
          scrub: true
        },
        ease: "none"
      }
    );

    // Fade-in/slide-in of the image container itself
    gsap.from(".about-image-wrapper", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".about-image-wrapper",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      x: -40,
      filter: "blur(10px)",
      duration: 1.2,
      ease: "power3.out"
    });

    // Floating card delay reveal
    gsap.from(".about-accent-card", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".about-image-wrapper",
        start: "top 70%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 30,
      duration: 1.0,
      delay: 0.4,
      ease: "power3.out"
    });

    // Text elements stagger reveal
    gsap.from(".about-text-item", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".about-text-block",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out"
    });

  }, { scope: containerRef });

  return (
    <section id="about" ref={containerRef} className="py-28 md:py-40 bg-[#F9F8F6] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-28 items-center">
          <div className="relative about-image-wrapper">
            <div className="aspect-[3/4] overflow-hidden bg-stone-200 relative shadow-premium">
              <img
                src={about.image}
                alt={`${about.heading1} ${about.heading2}`}
                loading="lazy"
                className="w-full h-full object-cover about-parallax-img"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 via-transparent to-transparent" />
            </div>
            {/* Floating accent card */}
            <div className="absolute -bottom-10 -right-6 lg:-right-10 bg-white p-8 shadow-premium max-w-sm hidden md:block about-accent-card">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-accent text-accent" />
                ))}
              </div>
              <p className="font-serif text-lg italic text-stone-800 leading-relaxed">
                "{about.quote}"
              </p>
            </div>
          </div>

          <div className="about-text-block">
            <div className="about-text-item">
              <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-accent mb-5 uppercase">{about.eyebrow}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-8 text-stone-900 leading-[1.08]">
                {about.heading1} <br />
                <span className="italic text-stone-400">{about.heading2}</span>
              </h2>
            </div>

            <div className="about-text-item">
              <p className="text-stone-600 leading-relaxed mb-6 text-lg">
                {about.paragraph1}
              </p>
              <p className="text-stone-500 leading-relaxed mb-12">
                {about.paragraph2}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-12 about-text-item">
              {about.stats.map((stat, i) => {
                const { target, suffix } = parseStat(stat.value);
                return (
                  <div key={i} className={`relative pl-6 border-l-2 ${i === 0 ? 'border-accent' : 'border-stone-300'}`}>
                    <AnimatedCounter target={target} suffix={suffix} />
                    <p className="text-xs text-stone-500 uppercase tracking-[0.2em] mt-3 font-medium">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            <a
              href="#contact"
              onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center text-stone-900 font-semibold hover:text-accent transition-colors group text-sm tracking-wide about-text-item"
            >
              Learn More About Our Studio
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Sectors ---
const Sectors = () => {
  const { sectors: sectorsContent } = useSiteContent();
  const sectors = sectorsContent.items;

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Header reveal
    gsap.from(".sector-header", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".sector-header",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 30,
      duration: 1.0,
      ease: "power3.out"
    });

    // Cards reveal with 3D perspective rotation
    gsap.from(".sector-card", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".sector-cards-grid",
        start: "top 80%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 55,
      rotationY: 8,
      duration: 1.2,
      stagger: 0.15,
      ease: "power3.out",
      transformPerspective: 1000
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-28 bg-stone-950 text-white relative overflow-hidden noise-overlay">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--accent-rgb),0.06),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20 sector-header">
          <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-accent mb-4 uppercase">{sectorsContent.eyebrow}</span>
          <h2 className="text-4xl md:text-5xl font-serif">{sectorsContent.heading}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sector-cards-grid">
          {sectors.map((sector, index) => (
            <div
              key={index}
              className="sector-card group relative aspect-[3/4] overflow-hidden bg-stone-900 rounded-2xl border border-stone-800/50 hover:border-accent/30 transition-all duration-700 cursor-pointer"
            >
              <img
                src={sector.image}
                alt={sector.title}
                loading="lazy"
                className="w-full h-full object-cover transition-all duration-[1000ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="w-10 h-px bg-accent mb-5 group-hover:w-16 transition-all duration-700" />
                <h3 className="text-2xl font-serif text-white mb-3 transform group-hover:-translate-y-2 transition-transform duration-700">{sector.title}</h3>
                <p className="text-stone-300/80 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700 delay-100">
                  {sector.description}
                </p>
              </div>
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-5 right-5 w-10 h-px bg-accent/60" />
                <div className="absolute top-5 right-5 w-px h-10 bg-accent/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Services ---
// --- Services ---
const Services = () => {
  const { services: servicesContent } = useSiteContent();
  const services = servicesContent.items;

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Header reveal
    gsap.from(".services-header", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".services-header",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 30,
      duration: 1.0,
      ease: "power3.out"
    });

    // Cards reveal
    gsap.from(".services-card", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".services-cards-grid",
        start: "top 80%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 50,
      duration: 1.2,
      stagger: 0.15,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  return (
    <section id="services" ref={containerRef} className="py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 services-header">
          <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-accent mb-4 uppercase">{servicesContent.eyebrow}</span>
          <h2 className="text-4xl md:text-5xl font-serif text-stone-900">{servicesContent.heading}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 services-cards-grid">
          {services.map((service, index) => (
            <div
              key={index}
              className="services-card relative bg-[#F9F8F6] p-10 rounded-2xl border border-stone-200/50 group hover:bg-stone-950 hover:text-white transition-all duration-700 overflow-hidden shadow-sm hover:shadow-2xl"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--accent-rgb),0.15),transparent_70%)]" />

              <div className="relative z-10">
                <div className="text-5xl font-serif text-stone-200 mb-8 group-hover:text-accent transition-colors duration-700 font-light">
                  {service.icon}
                </div>
                <h3 className="text-xl font-serif mb-4">{service.title}</h3>
                <p className="text-stone-500 mb-8 leading-relaxed group-hover:text-stone-400 transition-colors text-sm">
                  {service.description}
                </p>
                <ul className="space-y-3.5">
                  {service.features.map((feature, i) => (
                    <li 
                      key={i} 
                      className="flex items-center text-sm font-medium text-stone-400 group-hover:text-stone-300 transform group-hover:translate-x-1.5 transition-all duration-300"
                      style={{ transitionDelay: `${i * 60}ms` }}
                    >
                      <span className="w-1.5 h-1.5 bg-accent rounded-full mr-3 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom border accent */}
              <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-accent transition-all duration-700" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Portfolio ---
const Portfolio = () => {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

   const categories = ['All', 'Residential', 'Commercial', 'Public', 'Hospitality'];

   const [projects, setProjects] = useState<any[]>(() => getLocalProjects());

   // Subscribe to real‑time portfolio data
   useEffect(() => {
     const unsub = subscribeProjects(setProjects);
     return () => unsub();
   }, []);

   useGSAP(() => {
     // Header reveal
     gsap.from(".portfolio-header-text", {
       immediateRender: false,
       scrollTrigger: {
         trigger: ".portfolio-header-text",
         start: "top 85%",
         toggleActions: "play none none none"
       },
       opacity: 0,
       y: 30,
       duration: 1.0,
       ease: "power3.out"
     });

     // Controls reveal
     gsap.from(".portfolio-controls", {
       immediateRender: false,
       scrollTrigger: {
         trigger: ".portfolio-header-text",
         start: "top 85%",
         toggleActions: "play none none none"
       },
       opacity: 0,
       y: 20,
       duration: 1.0,
       delay: 0.2,
       ease: "power3.out"
     });

     // View All link reveal
     gsap.from(".portfolio-footer", {
       immediateRender: false,
       scrollTrigger: {
         trigger: ".portfolio-footer",
         start: "top 90%",
         toggleActions: "play none none none"
       },
       opacity: 0,
       y: 20,
       duration: 0.8,
       ease: "power3.out"
     });
   }, { scope: containerRef });

  const filteredProjects = projects.filter(p => {
    const matchesCategory = filter === 'All' || p.category === filter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || p.title.toLowerCase().includes(searchLower) || (p.description && p.description.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="portfolio" ref={containerRef} className="py-28 bg-[#F9F8F6]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
          <div className="portfolio-header-text">
            <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-stone-400 mb-4 uppercase">Selected Works</span>
            <h2 className="text-4xl md:text-5xl font-serif text-stone-900">Our Portfolio</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6 md:mt-0 items-start md:items-end portfolio-controls">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                aria-label="Search projects"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10 py-2.5 border-b border-stone-300 bg-transparent focus:outline-none focus:border-accent transition-colors w-full sm:w-56 text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`text-[0.7rem] tracking-[0.15em] px-4 py-2 transition-all duration-300 ${
                    filter === cat
                      ? 'bg-stone-900 text-white'
                      : 'bg-transparent text-stone-400 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <Link to={`/projects/${project.id}`} key={project.id} className="block">
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
                  className="group relative aspect-[4/5] overflow-hidden bg-stone-200 rounded-2xl shadow-premium hover:shadow-2xl transition-all duration-700 cursor-pointer"
                >
                  <img
                     src={project.imageUrl ?? project.image}
                    alt={project.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-all duration-[1200ms] group-hover:scale-110"
                  />
                  {/* Default subtle vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-8">
                    <div className="translate-y-6 group-hover:translate-y-0 transition-transform duration-700 ease-out">
                      <p className="text-stone-400 text-[0.65rem] uppercase tracking-[0.25em] mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">{project.category}</p>
                      <h3 className="text-white text-2xl font-serif opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200">{project.title}</h3>
                      <div className="w-0 group-hover:w-10 h-px bg-accent mt-4 transition-all duration-700 delay-300" />
                    </div>
                  </div>
                  {/* Corner bracket */}
                  <div className="absolute top-5 left-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-6 h-px bg-white/50" />
                    <div className="w-px h-6 bg-white/50" />
                  </div>
                  <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-6 h-px bg-white/50 ml-auto" />
                    <div className="w-px h-6 bg-white/50 ml-auto" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="portfolio-footer text-center mt-16">
          <a
            href="#contact"
            onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="inline-flex items-center gap-2 text-stone-900 font-semibold text-sm tracking-wide hover:text-accent transition-colors group"
          >
            Start Your Project
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
};

// --- Process ---
const Process = () => {
  const { process: processContent } = useSiteContent();
  const containerRef = useRef<HTMLDivElement>(null);

  const steps = processContent.steps;

  useGSAP(() => {
    // Header reveal
    gsap.from(".process-header", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".process-header",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 30,
      duration: 1.0,
      ease: "power3.out"
    });

    // Progress line scroll scrub
    gsap.fromTo(".process-progress-line",
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".process-timeline-container",
          start: "top center",
          end: "bottom center",
          scrub: true
        }
      }
    );

    // Steps entrance animations - triggered individually for better pacing
    const stepElements = gsap.utils.toArray<HTMLElement>(".process-step");
    stepElements.forEach((step, index) => {
      const direction = index % 2 === 0 ? -45 : 45; // slide left or right
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: step,
          start: "top 85%",
          toggleActions: "play none none none"
        }
      });

      tl.from(step.querySelector(".process-step-content"), {
        immediateRender: false,
        opacity: 0,
        x: direction,
        duration: 0.8,
        ease: "power3.out"
      })
      .from(step.querySelector(".process-step-number"), {
        immediateRender: false,
        scale: 0,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, "-=0.6");
    });

  }, { scope: containerRef });

  return (
    <section id="process" ref={containerRef} className="py-28 bg-stone-950 text-white relative overflow-hidden noise-overlay">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(var(--accent-rgb),0.05),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24 process-header">
          <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-stone-500 mb-4 uppercase">{processContent.eyebrow}</span>
          <h2 className="text-4xl md:text-5xl font-serif">{processContent.heading}</h2>
        </div>

        <div className="relative process-timeline-container">
          <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-stone-800 hidden md:block" />
          <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-accent hidden md:block origin-top z-0 process-progress-line" />

          <div className="space-y-16 md:space-y-28">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`process-step flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="flex-1 text-center md:text-left p-6 process-step-content">
                  <div className={`md:max-w-xs ${index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto md:text-right'}`}>
                    <h3 className="text-2xl font-serif mb-3">{step.title}</h3>
                    <p className="text-stone-400/80 leading-relaxed text-sm">{step.desc}</p>
                  </div>
                </div>

                <div className="process-step-number relative z-10 flex items-center justify-center w-16 h-16 bg-stone-950 border border-stone-700 hover:border-accent rounded-full my-6 md:my-0 shrink-0 shadow-2xl shadow-black/60 hover:shadow-accent/20 transition-all duration-500 cursor-pointer group">
                  <span className="font-serif text-lg text-stone-300 group-hover:text-white transition-colors">{step.number}</span>
                </div>

                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Why Choose Us ---
// --- Client Portal Showcase ---
const ClientPortalShowcase = () => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents' | 'budget' | 'camera'>('timeline');
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Left column iPad mockup reveal
    gsap.from(".portal-left-col", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".portal-left-col",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      x: -40,
      duration: 1.0,
      ease: "power3.out"
    });

    // Right column content reveal
    gsap.from(".portal-right-col", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".portal-right-col",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      x: 40,
      duration: 1.0,
      delay: 0.15,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  const tabs = [
    {
      id: 'timeline' as const,
      label: 'Timeline Tracking',
      title: 'Real-time Project Timeline',
      description: 'Follow every milestone of your build. From spatial design approvals to structural framing and final finishes, our live tracker ensures you are never left guessing.',
      icon: Clock
    },
    {
      id: 'documents' as const,
      label: 'Document Hub',
      title: 'Bespoke Blueprint & Asset Vault',
      description: 'Instantly view, download, or review your blueprints, 3D renderings, and materials specification sheets. Everything is organized in one central, secure repository.',
      icon: FileText
    },
    {
      id: 'budget' as const,
      label: 'Budget Health',
      title: 'Financial Progress Transparency',
      description: 'Maintain absolute clarity over your investment. Track spent resources, upcoming disbursements, and category breakdowns with real-time invoices updated directly by the project manager.',
      icon: BarChart3
    },
    {
      id: 'camera' as const,
      label: 'Live Site Feed',
      title: 'Live Construction Camera',
      description: 'Observe your project rising from the ground in real-time. Access high-definition, live on-site feeds from anywhere in the world on your smartphone or desktop.',
      icon: Camera
    }
  ];

  return (
    <section id="experience" ref={containerRef} className="py-28 bg-stone-900 text-white relative overflow-hidden noise-overlay">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(var(--accent-rgb),0.03),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Interactive iPad Mockup */}
          <div className="lg:col-span-7 w-full portal-left-col">
            {/* iPad outer shell */}
            <div className="bg-stone-955 border-[10px] border-stone-800 rounded-[2.5rem] shadow-2xl shadow-black/85 overflow-hidden relative aspect-[4/3] w-full max-w-2xl mx-auto flex flex-col">
              {/* Device camera dot */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-stone-850 rounded-full z-20" />
              
              {/* Portal Header */}
              <div className="bg-stone-900/90 border-b border-stone-800/80 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center border border-accent/20">
                    <span className="font-serif text-accent font-bold text-xs font-mono">DH</span>
                  </div>
                  <div>
                    <h4 className="text-[0.7rem] font-bold tracking-wider text-stone-200 uppercase">Dream Horizon Portal</h4>
                    <p className="text-[0.6rem] text-stone-500 font-mono">Project: Oakridge Estates</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[0.6rem] font-bold tracking-wider text-stone-400 uppercase font-mono">Active Phase: Framing</span>
                </div>
              </div>

              {/* Portal Content Area */}
              <div className="flex-1 bg-stone-955 p-6 overflow-y-auto min-h-0 relative">
                <AnimatePresence mode="wait">
                  {activeTab === 'timeline' && (
                    <motion.div
                      key="timeline"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">Overall Completion</span>
                        <span className="text-xs font-bold text-accent font-mono">72% Completed</span>
                      </div>
                      <div className="h-1.5 bg-stone-850 rounded-full overflow-hidden w-full">
                        <div className="h-full bg-gradient-to-r from-accent to-[#ca8a04] rounded-full w-[72%]" />
                      </div>

                      <div className="space-y-3 mt-6">
                        {[
                          { phase: "01. Space Design & Layout", status: "Completed", date: "Jan 12, 2026", color: "bg-green-500/20 text-green-400 border-green-500/30" },
                          { phase: "02. 3D Renders & Materials", status: "Completed", date: "Feb 28, 2026", color: "bg-green-500/20 text-green-400 border-green-500/30" },
                          { phase: "03. Municipal Permits & Site prep", status: "Completed", date: "Mar 15, 2026", color: "bg-green-500/20 text-green-400 border-green-500/30" },
                          { phase: "04. Foundation & Concrete works", status: "Completed", date: "May 02, 2026", color: "bg-green-500/20 text-green-400 border-green-500/30" },
                          { phase: "05. Structural Steel & Wood Framing", status: "In Progress (85%)", date: "Est. Jul 15, 2026", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", active: true },
                          { phase: "06. Interior Finishing & Styling", status: "Pending", date: "Est. Sep 10, 2026", color: "bg-stone-900 text-stone-600 border-stone-900" }
                        ].map((item, idx) => (
                          <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${item.active ? 'bg-stone-900 border-stone-800' : 'bg-stone-900/40 border-stone-900/50'}`}>
                            <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full ${item.active ? 'bg-accent animate-pulse' : idx < 4 ? 'bg-green-500' : 'bg-stone-700'}`} />
                              <div>
                                <h5 className={`text-xs font-semibold ${item.active ? 'text-white' : 'text-stone-300'}`}>{item.phase}</h5>
                                <p className="text-[0.6rem] text-stone-500 mt-0.5">{item.date}</p>
                              </div>
                            </div>
                            <span className={`text-[0.55rem] font-bold px-2 py-0.5 rounded-full border ${item.color}`}>{item.status}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'documents' && (
                    <motion.div
                      key="documents"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">Vault Files</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          { name: "Ground Floor Plan.pdf", type: "Blueprints", size: "12.4 MB" },
                          { name: "Kitchen 3D Render.jpg", type: "Renderings", size: "8.1 MB" },
                          { name: "Living Room Concept.jpg", type: "Renderings", size: "9.3 MB" },
                          { name: "Lighting Layout Plan.pdf", type: "Blueprints", size: "4.8 MB" },
                          { name: "Italian Marble Spec.xlsx", type: "Material Sheet", size: "1.2 MB" },
                          { name: "HVAC System Layout.pdf", type: "Blueprints", size: "5.5 MB" }
                        ].map((doc, idx) => (
                          <div key={idx} className="bg-stone-900/60 border border-stone-900/80 hover:border-stone-800 transition-all rounded-xl p-3 flex flex-col justify-between cursor-pointer group">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-stone-850 rounded-lg group-hover:bg-accent/10 group-hover:text-accent transition-colors text-stone-400">
                                <FileText size={14} />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-semibold text-stone-200 truncate group-hover:text-white transition-colors">{doc.name}</h5>
                                <p className="text-[0.55rem] text-stone-500 mt-0.5 tracking-wide uppercase font-mono">{doc.type}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-stone-900/80 mt-3 pt-2">
                              <span className="text-[0.65rem] text-stone-500 font-mono">{doc.size}</span>
                              <span className="text-[0.65rem] text-stone-400 group-hover:text-accent font-medium transition-colors">Download</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'budget' && (
                    <motion.div
                      key="budget"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-850 text-center">
                          <h6 className="text-[0.55rem] text-stone-500 uppercase tracking-wider font-bold">Total Budget</h6>
                          <p className="text-xs font-serif font-bold text-white mt-1 font-mono">₹4.50 Cr</p>
                        </div>
                        <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-850 text-center">
                          <h6 className="text-[0.55rem] text-stone-500 uppercase tracking-wider font-bold">Disbursed</h6>
                          <p className="text-xs font-serif font-bold text-green-400 mt-1 font-mono">₹2.88 Cr</p>
                        </div>
                        <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-850 text-center">
                          <h6 className="text-[0.55rem] text-stone-500 uppercase tracking-wider font-bold">Invoiced</h6>
                          <p className="text-xs font-serif font-bold text-amber-400 mt-1 font-mono">₹32.4 L</p>
                        </div>
                      </div>

                      <div className="bg-stone-900/60 border border-stone-900/80 rounded-xl p-3.5 space-y-3.5">
                        <h4 className="text-[0.7rem] font-bold text-stone-300 uppercase tracking-wider">Disbursement Breakdown</h4>
                        {[
                          { category: "Structure & Civil Works", allocated: "₹1.80 Cr", spent: "₹1.65 Cr", percent: 91 },
                          { category: "Flooring & Masonry", allocated: "₹65.0 L", spent: "₹45.5 L", percent: 70 },
                          { category: "HVAC & Electricals", allocated: "₹50.0 L", spent: "₹32.0 L", percent: 64 },
                          { category: "Fine Carpentry & Glass", allocated: "₹95.0 L", spent: "₹45.0 L", percent: 47 },
                          { category: "Lighting & Home Automation", allocated: "₹60.0 L", spent: "₹1.5 L", percent: 2 }
                        ].map((cat, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-[0.65rem]">
                              <span className="font-semibold text-stone-300">{cat.category}</span>
                              <span className="text-stone-500 font-mono">{cat.spent} / {cat.allocated}</span>
                            </div>
                            <div className="h-1 bg-stone-850 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-accent to-[#ca8a04] rounded-full" style={{ width: `${cat.percent}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'camera' && (
                    <motion.div
                      key="camera"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="relative h-full flex flex-col justify-between"
                    >
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-stone-800 bg-stone-955">
                        {/* Simulated video frame */}
                        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url("https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80")` }} />
                        
                        {/* Grid lines overlay */}
                        <div className="absolute inset-0 border border-white/5 grid grid-cols-3 grid-rows-3 pointer-events-none" />
                        
                        {/* Stream status overlays */}
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[0.55rem] font-bold text-white uppercase tracking-widest flex items-center gap-1 font-mono">
                          <span className="w-1 h-1 bg-red-500 rounded-full animate-ping" />
                          REC [CAM-03]
                        </div>
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[0.55rem] font-bold text-stone-300 uppercase tracking-widest font-mono">
                          1080P // 30 FPS
                        </div>
                        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[0.55rem] font-mono text-stone-300">
                          CAM-03 // LIVE FEED
                        </div>
                      </div>
                      
                      <div className="bg-stone-900/60 p-3 rounded-xl border border-stone-900/80 mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-stone-850 rounded-lg text-accent">
                            <Camera size={14} />
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-white">Deck Construction Cam</h5>
                            <p className="text-[0.55rem] text-stone-500">Source: Hikvision Pro 4K</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button className="px-2 py-0.5 bg-stone-850 hover:bg-stone-800 transition text-[0.55rem] font-bold uppercase tracking-wider rounded text-stone-400">Cam 01</button>
                          <button className="px-2 py-0.5 bg-accent text-black text-[0.55rem] font-bold uppercase tracking-wider rounded">Cam 03</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Explanatory Texts & Interactive Controls */}
          <div className="lg:col-span-5 space-y-10 portal-right-col">
            <div>
              <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-stone-400 mb-4 uppercase">The Client Experience</span>
              <h2 className="text-4xl md:text-5xl font-serif leading-[1.08] text-white mb-6">Complete Build Transparency</h2>
              <p className="text-stone-400 text-sm leading-relaxed">
                We believe that premium craftsmanship requires absolute project alignment. Our bespoke client portal eliminates anxiety, providing real-time updates and full administrative control directly to your device.
              </p>
            </div>

            {/* Interactive Tab Selectors */}
            <div className="space-y-3">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex gap-4 ${isActive ? 'bg-accent border-accent text-black shadow-lg shadow-accent/10' : 'bg-stone-900/40 border-stone-900/50 text-stone-300 hover:bg-stone-900/80 hover:border-stone-800'}`}
                  >
                    <div className={`p-2 rounded-lg transition-colors shrink-0 flex items-center justify-center ${isActive ? 'bg-black/10 text-black' : 'bg-stone-800 text-accent'}`}>
                      <TabIcon size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs tracking-wide uppercase">{tab.label}</h4>
                      <p className={`text-[0.7rem] mt-0.5 leading-relaxed ${isActive ? 'text-black/80' : 'text-stone-500'}`}>
                        {isActive ? tab.description : `Preview real-time ${tab.label.toLowerCase()} interface.`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// --- Testimonials ---
const Testimonials = () => {
  const { testimonials: testimonialsContent } = useSiteContent();
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const testimonials = testimonialsContent.items;

  const next = useCallback(() => setCurrent((c) => (c + 1) % testimonials.length), [testimonials.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length), [testimonials.length]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  useGSAP(() => {
    // Header reveal
    gsap.from(".testimonials-header", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".testimonials-header",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 30,
      duration: 1.0,
      ease: "power3.out"
    });

    // Content area reveal
    gsap.from(".testimonials-content", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".testimonials-header",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 20,
      duration: 1.0,
      delay: 0.2,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  return (
    <section id="reviews" ref={containerRef} className="py-28 bg-[#F9F8F6] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="mb-16 testimonials-header">
          <div className="w-16 h-px bg-accent mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-serif text-stone-900">{testimonialsContent.heading}</h2>
        </div>

        <div className="testimonials-content">
          <div className="relative min-h-[300px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 40, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -40, filter: 'blur(4px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="w-12 h-px bg-stone-300 mx-auto mb-8" />
                <p className="text-xl md:text-2xl lg:text-3xl font-serif italic text-stone-700 leading-relaxed mb-10 max-w-2xl">
                  "{testimonials[Math.min(current, testimonials.length - 1)]?.text}"
                </p>
                <div className="w-12 h-px bg-stone-300 mx-auto mb-6" />
                <div>
                  <h5 className="font-bold text-stone-900 tracking-wide text-sm">{testimonials[Math.min(current, testimonials.length - 1)]?.author}</h5>
                  <p className="text-[0.65rem] text-stone-400 uppercase tracking-[0.2em] mt-1">{testimonials[Math.min(current, testimonials.length - 1)]?.role}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-4 mt-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-12 h-12 flex items-center justify-center border border-stone-300 hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 rounded-full"
            >
              <ChevronLeft size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={next}
              aria-label="Next testimonial"
              className="w-12 h-12 flex items-center justify-center border border-stone-300 hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 rounded-full"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2.5 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-10 bg-accent' : 'w-2.5 bg-stone-300 hover:bg-stone-400'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Render a string with literal "\n" newlines as <br/>-separated lines.
const MultiLine = ({ text }: { text: string }) => (
  <>
    {text.split('\n').map((line, i, arr) => (
      <span key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </span>
    ))}
  </>
);

// --- Contact (WhatsApp) ---
const Contact = () => {
  const { contact } = useSiteContent();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: 'Full Renovation',
    budget: '₹15 Lakhs - ₹30 Lakhs',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hello! I'm interested in your design services.

*Name:* ${formData.name}
*Email:* ${formData.email}
*Phone:* ${formData.phone}
*Project Type:* ${formData.projectType}
*Budget:* ${formData.budget}
*Message:* ${formData.message}

Looking forward to hearing from you!`;

    const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    setIsSubmitted(true);
  };

  const contactRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Left column entrance
    gsap.from(".contact-left-col", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".contact-left-col",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      x: -40,
      duration: 1.0,
      ease: "power3.out"
    });

    // Right column entrance
    gsap.from(".contact-right-col", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".contact-left-col",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      x: 40,
      duration: 1.0,
      delay: 0.15,
      ease: "power3.out"
    });
  }, { scope: contactRef });

  return (
    <section id="contact" ref={contactRef} className="py-28 bg-[#F9F8F6] relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
          <div className="contact-left-col">
            <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-stone-400 mb-4 uppercase">{contact.eyebrow}</span>
            <h2 className="text-4xl md:text-5xl font-serif text-stone-900 mb-8 leading-[1.08]">{contact.heading}</h2>
            <p className="text-stone-500 mb-12 text-lg leading-relaxed">
              {contact.description}
            </p>

            <div className="space-y-8">
              <div className="group">
                <h5 className="font-bold text-stone-900 mb-1.5 text-sm tracking-wide group-hover:text-accent transition-colors">Office</h5>
                <p className="text-stone-500 text-sm leading-relaxed"><MultiLine text={contact.office} /></p>
              </div>
              <div className="group">
                <h5 className="font-bold text-stone-900 mb-1.5 text-sm tracking-wide group-hover:text-accent transition-colors">Contact</h5>
                <p className="text-stone-500 text-sm leading-relaxed">{contact.email}<br />{contact.phone}</p>
              </div>
              <div className="group">
                <h5 className="font-bold text-stone-900 mb-1.5 text-sm tracking-wide group-hover:text-accent transition-colors">Hours</h5>
                <p className="text-stone-500 text-sm leading-relaxed"><MultiLine text={contact.hours} /></p>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              {[
                { Icon: Instagram, label: 'Follow us on Instagram' },
                { Icon: Facebook, label: 'Follow us on Facebook' },
                { Icon: Linkedin, label: 'Connect on LinkedIn' },
              ].map(({ Icon, label }, i) => (
                <motion.a
                  key={i}
                  href="#"
                  aria-label={label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 flex items-center justify-center border border-stone-300 text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300 rounded-full"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 shadow-premium relative overflow-hidden rounded-2xl contact-right-col">
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6"
                  >
                    <Check className="w-8 h-8 text-white" strokeWidth={3} />
                  </motion.div>
                  <h3 className="text-2xl font-serif mb-3 text-stone-900">Redirecting to WhatsApp</h3>
                  <p className="text-stone-500 leading-relaxed max-w-sm text-sm">
                    If WhatsApp didn't open, please send your inquiry manually to {contact.phone}.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-6 text-sm text-accent font-medium hover:underline"
                  >
                    Send another inquiry
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                  onSubmit={handleSubmit}
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">Name</label>
                      <input
                        required
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-accent transition-colors text-sm"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">Email</label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-accent transition-colors text-sm"
                        placeholder="jane@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-accent transition-colors text-sm"
                      placeholder="+91 70207 05148"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">Project Type</label>
                      <select
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleChange}
                        className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-accent transition-colors bg-transparent text-sm"
                      >
                        <option>Full Renovation</option>
                        <option>Interior Styling</option>
                        <option>Architectural Planning</option>
                        <option>Turnkey Execution</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">Budget Range</label>
                      <select
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-accent transition-colors bg-transparent text-sm"
                      >
                        <option>Under ₹5 Lakhs</option>
                        <option>₹5 Lakhs - ₹15 Lakhs</option>
                        <option>₹15 Lakhs - ₹30 Lakhs</option>
                        <option>₹30 Lakhs - ₹75 Lakhs</option>
                        <option>₹75 Lakhs+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">Message</label>
                    <textarea
                      required
                      rows={4}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-accent transition-colors resize-none text-sm"
                      placeholder="Tell us about your space..."
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-stone-900 text-white py-4 font-medium text-sm tracking-[0.15em] hover:bg-accent transition-all duration-300 mt-4 hover:shadow-lg hover:shadow-accent/20"
                  >
                    SEND INQUIRY VIA WHATSAPP
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Footer ---
const Footer = () => {
  const { brand, footer, contact } = useSiteContent();
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".footer-col", {
      immediateRender: false,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 90%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 30,
      duration: 1.0,
      stagger: 0.15,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  return (
    <footer ref={containerRef} className="bg-stone-950 text-stone-400 pt-20 pb-8 relative noise-overlay">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-stone-800 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-1 md:col-span-2 footer-col">
          <div className="flex flex-col items-start leading-none mb-6">
            <div className="flex items-baseline">
              <span className="text-2xl font-serif font-bold tracking-tight text-white">{brand.nameDevanagari}</span>
            </div>
            <span className="text-[0.55rem] font-sans tracking-[0.2em] text-stone-500 uppercase mt-1 font-medium">{brand.subtitle}</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs mb-8 text-stone-500">
            {footer.blurb}
          </p>
          <div className="flex gap-3">
            {[
              { Icon: Instagram, label: 'Follow us on Instagram' },
              { Icon: Facebook, label: 'Follow us on Facebook' },
              { Icon: Linkedin, label: 'Connect on LinkedIn' },
            ].map(({ Icon, label }, i) => (
              <a key={i} href="#" aria-label={label} className="w-10 h-10 flex items-center justify-center border border-stone-800 hover:bg-accent hover:text-white hover:border-accent transition-all duration-300 rounded-full">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h5 className="text-white font-bold mb-6 tracking-wide text-sm">Contact</h5>
          <ul className="space-y-3.5 text-sm text-stone-500">
            {contact.office.split('\n').map((line, i) => (
              <li key={i}>{line}</li>
            ))}
            <li>{contact.email}</li>
            <li>{contact.phone}</li>
          </ul>
        </div>

        <div className="footer-col">
          <h5 className="text-white font-bold mb-6 tracking-wide text-sm">Hours</h5>
          <ul className="space-y-3.5 text-sm text-stone-500">
            {contact.hours.split('\n').map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-stone-900 flex flex-col md:flex-row justify-between items-center text-xs text-stone-600">
        <div className="mb-4 md:mb-0">
          &copy; {new Date().getFullYear()} Dream Horizon Design Concepts. All rights reserved.
        </div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

// --- Scroll To Top ---
const ScrollToTop = () => {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (latest) => setVisible(latest > 600));
  }, [scrollY]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn-accent fixed bottom-8 right-8 z-[90] p-3.5 shadow-xl group"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// --- Project Detail ---
const ProjectDetail = () => {
  const { id } = useParams();
  const [projects, setProjects] = useState<any[]>(() => getLocalProjects());

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  useEffect(() => {
    const unsub = subscribeProjects(setProjects);
    return () => unsub();
  }, []);

  const project = projects.find(p => String(p.id) === String(id));

  if (!project) return <div className="py-32 text-center text-2xl font-serif text-stone-900 bg-[#F9F8F6] min-h-screen">Project not found.</div>;

  return (
    <div className="pt-32 pb-20 bg-[#F9F8F6] min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/#portfolio" className="text-stone-400 hover:text-stone-900 mb-10 inline-flex items-center uppercase tracking-[0.2em] text-[0.7rem] font-bold group transition-colors">
          <ArrowRight className="w-4 h-4 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Portfolio
        </Link>
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={(project as any).imageUrl ?? project.image} alt={project.title} loading="lazy" className="w-full h-auto max-h-[80vh] object-cover bg-stone-200" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center"
          >
            <p className="text-accent font-bold tracking-[0.25em] uppercase text-[0.65rem] mb-4">{project.category}</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-stone-900 mb-8 leading-[1.1]">{project.title}</h1>
            <p className="text-stone-600 leading-relaxed text-lg mb-10">
              {project.description}
            </p>
            <div className="grid grid-cols-2 gap-8 border-t border-b border-stone-200 py-8">
              <div>
                <h5 className="text-[0.65rem] uppercase tracking-[0.2em] text-stone-400 font-bold mb-1">Client</h5>
                <p className="text-stone-900 font-medium text-sm">{project.client}</p>
              </div>
              <div>
                <h5 className="text-[0.65rem] uppercase tracking-[0.2em] text-stone-400 font-bold mb-1">Year</h5>
                <p className="text-stone-900 font-medium text-sm">{project.year}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// --- Marquee Ticker ---
const Marquee = () => {
  const { marquee } = useSiteContent();
  const items = marquee.length > 0 ? marquee : ['Architectural Planning'];
  const repeated = [...items, ...items];

  return (
    <section className="py-6 bg-stone-900 border-y border-stone-800/50 overflow-hidden">
      <div className="marquee-track" style={{ '--marquee-duration': '40s' } as React.CSSProperties}>
        {repeated.map((item, i) => (
          <span key={i} className="flex items-center shrink-0 px-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent mr-6" />
            <span className="text-xs tracking-[0.25em] uppercase font-medium text-stone-400 whitespace-nowrap">{item}</span>
          </span>
        ))}
      </div>
    </section>
  );
};

// --- Trusted By ---
// Rotate through a few editorial type treatments so an admin can add any logo
// names and they still render with a varied, premium masthead look.
const LOGO_WEIGHTS = [
  'font-serif italic text-2xl',
  'font-sans font-bold tracking-[0.3em] text-lg',
  'font-serif italic text-2xl',
  'font-sans font-bold tracking-[0.15em] text-xl',
  'font-sans font-semibold tracking-[0.1em] text-xl',
];

const TrustedBy = () => {
  const { trustedBy } = useSiteContent();
  const logos = trustedBy.logos.map((name, i) => ({
    name,
    weight: LOGO_WEIGHTS[i % LOGO_WEIGHTS.length],
  }));
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Header reveal
    gsap.from(".trusted-header", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".trusted-header",
        start: "top 90%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: "power3.out"
    });

    // Logos stagger reveal
    gsap.from(".trusted-logo", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".trusted-logos-container",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 15,
      duration: 0.8,
      stagger: 0.08,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-20 bg-[#F9F8F6] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="mb-12 trusted-header">
          <span className="text-[0.65rem] font-bold tracking-[0.3em] text-stone-400 uppercase">{trustedBy.eyebrow}</span>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 trusted-logos-container">
          {logos.map((logo, i) => (
            <span
              key={i}
              className={`trusted-logo ${logo.weight} text-stone-300 hover:text-stone-500 transition-colors duration-500 cursor-default select-none`}
            >
              {logo.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Parallax Quote ---
const ParallaxQuote = () => {
  const { quote } = useSiteContent();
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Parallax scroll-scrub background
    gsap.fromTo(".quote-parallax-img",
      { yPercent: -15 },
      {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      }
    );

    // Quote text entrance reveal
    gsap.from(".quote-content", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".quote-content",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 40,
      duration: 1.2,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative h-[60vh] md:h-[70vh] overflow-hidden flex items-center justify-center noise-overlay">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={quote.image}
          alt=""
          loading="lazy"
          className="w-full h-[130%] object-cover quote-parallax-img"
        />
      </div>
      <div className="absolute inset-0 bg-stone-950/70" />
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto quote-content">
        <div className="w-16 h-px bg-accent mx-auto mb-8" />
        <blockquote className="text-3xl md:text-4xl lg:text-5xl font-serif text-white leading-[1.2] italic">
          "{quote.text}"
        </blockquote>
        <div className="w-16 h-px bg-accent mx-auto mt-8" />
      </div>
    </section>
  );
};

// --- CTA Banner ---
const CTABanner = () => {
  const { cta } = useSiteContent();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".cta-content", {
      immediateRender: false,
      scrollTrigger: {
        trigger: ".cta-content",
        start: "top 85%",
        toggleActions: "play none none none"
      },
      opacity: 0,
      y: 35,
      duration: 1.0,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 bg-stone-950 relative overflow-hidden noise-overlay">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--accent-rgb),0.08),transparent_60%)]" />
      <div className="max-w-5xl mx-auto px-6 text-center relative z-10 cta-content">
        <div>
          <span className="text-[0.65rem] font-bold tracking-[0.3em] text-accent uppercase mb-4 block">{cta.eyebrow}</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6 leading-[1.1]">
            {cta.titleLine1} <br />
            <span className="italic text-stone-400 font-light">{cta.titleLine2}</span>
          </h2>
          <p className="text-stone-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            {cta.description}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="btn-accent px-10 py-4 font-medium text-sm tracking-[0.15em] hover:shadow-xl hover:shadow-accent/20"
            >
              {cta.primaryCta}
            </motion.a>
            <motion.a
              href="#portfolio"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => { e.preventDefault(); document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="border border-white/20 text-white px-10 py-4 font-medium text-sm tracking-[0.15em] hover:bg-white hover:text-stone-900 transition-all duration-300"
            >
              {cta.secondaryCta}
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Scroll To Top On Route Change ---
const ScrollToTopOnRouteChange = () => {
  const { pathname, hash } = useLocation();

  // Reset scroll synchronously before paint on path change without a hash
  useLayoutEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  // Handle smooth scroll to hash targets after render
  useEffect(() => {
    if (hash) {
      const timer = setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, hash]);

  return null;
};

// --- Layout Container ---
const LayoutContainer = ({ scaleX }: { scaleX: any }) => {
  return (
    <>
      <ThemeApplier />
      <ScrollToTopOnRouteChange />
      <CursorFollower />
      <a href="#portfolio" className="skip-link bg-stone-900 text-white px-4 py-2 text-sm font-medium">
        Skip to content
      </a>
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-accent origin-left z-[100]"
        style={{ scaleX }}
        aria-hidden="true"
      />
      <Navbar />
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <Marquee />
              <About />
              <ConstructionSequence />
              <TrustedBy />
              <Sectors />
              <Services />
              <ParallaxQuote />
              <Portfolio />
              <Process />
              <ClientPortalShowcase />
              <Testimonials />
              <CTABanner />
              <Contact />
            </>
          } />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/login" element={<SignIn />} />
          <Route element={<ProtectedRoute />}> 
            <Route path="/dashboard" element={<DashboardHome />} />
          </Route>
        </Routes>
      <Footer />
      <ScrollToTop />
    </>
  );
};

// --- Main App ---
export default function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-900 selection:bg-accent/20 relative">
      <MotionConfig reducedMotion="user">
        <HashRouter>
          <LayoutContainer scaleX={scaleX} />
        </HashRouter>
      </MotionConfig>
    </div>
  );
}
