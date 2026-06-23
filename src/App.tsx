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

const WHATSAPP_NUMBER = '917020705148';

// --- Cursor Follower ---
const CursorFollower = () => {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 250 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
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
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#f97316]/40 pointer-events-none z-[200] hidden lg:block mix-blend-screen"
        style={{ x: useTransform(x, (val) => val - 16), y: useTransform(y, (val) => val - 16) }}
        animate={{
          scale: isHovered ? 1.5 : 1,
          backgroundColor: isHovered ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
      {/* Inner Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2.5 h-2.5 rounded-full bg-[#f97316] pointer-events-none z-[201] hidden lg:block mix-blend-screen"
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
    { name: 'Portfolio', href: 'portfolio' },
    { name: 'Services', href: 'services' },
    { name: 'Process', href: 'process' },
    { name: 'Reviews', href: 'reviews' },
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
          } group-hover:text-[#f97316]`}>
            स्वप्न क्षितिज
          </span>
          <span className={`text-[0.55rem] font-sans tracking-[0.2em] uppercase mt-1 font-medium transition-colors duration-300 ${
            isScrolled ? 'text-stone-400' : 'text-white/60'
          }`}>
            Design Concepts
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
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-[#f97316] group-hover:w-3/4 transition-all duration-300" />
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
                ? 'bg-stone-900 text-white hover:bg-[#f97316] hover:shadow-[#f97316]/20' 
                : 'bg-white text-stone-900 hover:bg-[#f97316] hover:text-white hover:shadow-[#f97316]/30'
            }`}
          >
            BOOK CONSULTATION
          </motion.a>
          {user ? (
            <Link
              to="/dashboard"
              className={`ml-4 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors ${
                isScrolled 
                  ? 'bg-[#f97316]/10 text-stone-900 hover:bg-[#f97316]/20' 
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
                  ? 'bg-[#f97316]/10 text-stone-900 hover:bg-[#f97316]/20' 
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
                  className="text-3xl font-serif text-stone-900 py-2 hover:text-[#f97316] transition-colors"
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
                className="bg-stone-900 text-white text-center py-4 px-12 mt-6 text-sm tracking-widest hover:bg-[#f97316] transition-colors"
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
        <RoundedBox ref={mesh1Ref} args={[2.5, 2.5, 2.5]} radius={0.06} smoothness={5} position={[-2.2, 0.2, -1.2]}>
          <meshStandardMaterial color="#fafaf9" roughness={0.15} metalness={0.05} />
        </RoundedBox>
        
        {/* Copper wireframe */}
        <RoundedBox ref={mesh2Ref} args={[1.6, 3.8, 1.6]} radius={0.06} smoothness={5} position={[2.2, 1.2, 0.3]}>
          <meshStandardMaterial color="#ca8a04" roughness={0.2} metalness={0.9} wireframe />
        </RoundedBox>
        
        {/* Distorted core sphere */}
        <mesh position={[0, -1.2, 1.2]}>
          <sphereGeometry args={[1.3, 64, 64]} />
          <MeshDistortMaterial color="#f97316" envMapIntensity={1.2} clearcoat={1} clearcoatRoughness={0.1} metalness={0.95} roughness={0.05} distort={0.3} speed={2} />
        </mesh>

        {/* Floating Gold Torus */}
        <mesh ref={mesh3Ref} position={[-1.2, -1.5, 0.5]}>
          <torusGeometry args={[0.7, 0.15, 16, 100]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Floating white sphere */}
        <mesh ref={mesh4Ref} position={[1.5, -1.8, -0.5]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#78716c" metalness={0.3} roughness={0.8} />
        </mesh>
      </Float>
    </group>
  );
};

// --- Hero ---
const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.95]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-stone-950">
      <motion.div className="absolute inset-0 z-0 opacity-50" style={{ y: y1 }}>
        <Canvas camera={{ position: [0, 0, 8.5], fov: 45 }}>
          <ambientLight intensity={0.3} />
          <spotLight position={[-10, 15, 10]} color="#f97316" angle={0.25} penumbra={1} intensity={2} castShadow />
          <directionalLight position={[10, -10, 5]} color="#06b6d4" intensity={1.2} />
          <spotLight position={[0, 10, 5]} angle={0.15} penumbra={1} intensity={0.8} castShadow />
          <Suspense fallback={null}>
            <Environment preset="city" />
            <AbstractArchitecture />
          </Suspense>
        </Canvas>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-stone-950/30 to-stone-950/70 z-0" />

      {/* Noise grain */}
      <div className="absolute inset-0 z-[1] opacity-[0.04] pointer-events-none noise-overlay" />

      <motion.div
        style={{ opacity, y: useTransform(scrollY, [0, 500], [0, 100]), scale }}
        className="relative z-10 text-center text-white px-6 max-w-5xl mx-auto mt-16"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="h-px bg-[#f97316] mx-auto mb-10"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-[0.65rem] tracking-[0.5em] text-[#f97316] uppercase mb-8 font-bold"
        >
          DPIIT-Recognised Design Studio
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-[6.5rem] font-serif font-medium leading-[1.0] mb-8 text-white"
        >
          Elevating Spaces,{' '}
          <br className="hidden md:block" />
          <span className="italic text-stone-300 font-light">Enriching Lives</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-base md:text-lg font-light tracking-wide mb-14 max-w-xl mx-auto text-stone-300/90 leading-relaxed"
        >
          Crafting timeless, structurally precise environments for the modern connoisseur.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex flex-col sm:flex-row justify-center gap-5"
        >
          <motion.a
            href="#portfolio"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.preventDefault(); document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="bg-white text-stone-900 px-12 py-4.5 font-medium text-sm tracking-[0.15em] hover:bg-[#f97316] hover:text-white transition-all duration-300 hover:shadow-2xl hover:shadow-[#f97316]/20"
          >
            VIEW PORTFOLIO
          </motion.a>
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="border border-white/25 text-white px-12 py-4.5 font-medium text-sm tracking-[0.15em] hover:bg-white hover:text-stone-900 transition-all duration-300 backdrop-blur-sm"
          >
            START YOUR PROJECT
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Bottom feature badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.8 }}
        className="absolute bottom-20 left-0 right-0 z-10 hidden lg:flex justify-center items-center gap-14 text-stone-500 text-[0.6rem] tracking-[0.3em] uppercase font-bold"
      >
        <span className="flex items-center gap-3">
          <span className="w-1 h-1 rounded-full bg-[#f97316]" /> Architectural Planning
        </span>
        <span className="flex items-center gap-3">
          <span className="w-1 h-1 rounded-full bg-[#f97316]" /> Luxury Interiors
        </span>
        <span className="flex items-center gap-3">
          <span className="w-1 h-1 rounded-full bg-[#f97316]" /> Turnkey Execution
        </span>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 cursor-pointer group"
        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <span className="text-[0.55rem] tracking-[0.3em] uppercase text-stone-500 font-medium group-hover:text-stone-300 transition-colors">Scroll</span>
        <div className="w-5 h-8 rounded-full border border-stone-600/50 p-1 flex justify-center">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-1 h-1 rounded-full bg-[#f97316]"
          />
        </div>
      </motion.div>
    </section>
  );
};

// --- About ---
const About = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section id="about" ref={containerRef} className="py-28 md:py-40 bg-[#F9F8F6] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-28 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="aspect-[3/4] overflow-hidden bg-stone-200 relative shadow-premium">
              <motion.img
                style={{ y, scale: 1.15 }}
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Interior Hub Storefront"
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 via-transparent to-transparent" />
            </div>
            {/* Floating accent card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute -bottom-10 -right-6 lg:-right-10 bg-white p-8 shadow-premium max-w-sm hidden md:block"
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-[#f97316] text-[#f97316]" />
                ))}
              </div>
              <p className="font-serif text-lg italic text-stone-800 leading-relaxed">
                "Providing the finest materials—from marble sheets to wallpapers—for flawless execution."
              </p>
            </motion.div>
          </motion.div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-[#f97316] mb-5 uppercase">About Us</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-8 text-stone-900 leading-[1.08]">
                Dream Horizon <br />
                <span className="italic text-stone-400">Design Concepts</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.8 }}
            >
              <p className="text-stone-600 leading-relaxed mb-6 text-lg">
                As a DPIIT-recognised design and infrastructure company, Dream Horizon Design Concepts is your
                comprehensive hub for visionary architectural planning and interior transformation.
              </p>
              <p className="text-stone-500 leading-relaxed mb-12">
                From structurally sound commercial edifices to bespoke private residences,
                we bring architectural precision and refined interior finishes to every project, ensuring luxury and longevity.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="grid grid-cols-2 gap-10 mb-12"
            >
              <div className="relative pl-6 border-l-2 border-[#f97316]">
                <AnimatedCounter target={150} suffix="+" />
                <p className="text-xs text-stone-500 uppercase tracking-[0.2em] mt-3 font-medium">Projects Completed</p>
              </div>
              <div className="relative pl-6 border-l-2 border-stone-300">
                <AnimatedCounter target={15} />
                <p className="text-xs text-stone-500 uppercase tracking-[0.2em] mt-3 font-medium">Design Awards</p>
              </div>
            </motion.div>

            <motion.a
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              href="#contact"
              onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center text-stone-900 font-semibold hover:text-[#f97316] transition-colors group text-sm tracking-wide"
            >
              Learn More About Our Studio
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Sectors ---
const Sectors = () => {
  const sectors = [
    { title: "Private Residential", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", description: "Bespoke architectural design for luxury homes, villas, and private estates." },
    { title: "Commercial & Corporate", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", description: "Innovative functional solutions for corporate offices, retail spaces, and mixed-use developments." },
    { title: "Public & Hospitality", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", description: "Immersive environments for hotels, resorts, educational facilities, and institutions." },
  ];

  return (
    <section className="py-28 bg-stone-950 text-white relative overflow-hidden noise-overlay">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(249,115,22,0.06),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-[#f97316] mb-4 uppercase">Our Focus</span>
          <h2 className="text-4xl md:text-5xl font-serif">Architectural Sectors</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {sectors.map((sector, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="group relative aspect-[3/4] overflow-hidden bg-stone-900 rounded-2xl border border-stone-800/50 hover:border-[#f97316]/30 transition-all duration-700 cursor-pointer"
            >
              <img
                src={sector.image}
                alt={sector.title}
                loading="lazy"
                className="w-full h-full object-cover transition-all duration-[1000ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="w-10 h-px bg-[#f97316] mb-5 group-hover:w-16 transition-all duration-700" />
                <h3 className="text-2xl font-serif text-white mb-3 transform group-hover:-translate-y-2 transition-transform duration-700">{sector.title}</h3>
                <p className="text-stone-300/80 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700 delay-100">
                  {sector.description}
                </p>
              </div>
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-5 right-5 w-10 h-px bg-[#f97316]/60" />
                <div className="absolute top-5 right-5 w-px h-10 bg-[#f97316]/60" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Services ---
const Services = () => {
  const services = [
    {
      title: "Architectural Planning",
      description: "From concept evaluation to structural blueprints, we handle every architectural detail of your project.",
      icon: "01",
      features: ["Site Analysis", "Structural Design", "Building Permits"]
    },
    {
      title: "Interior Architecture",
      description: "A seamless blend of structural functionality and exquisite interior aesthetics for a unified environment.",
      icon: "02",
      features: ["Space Planning", "Custom Millwork", "Material Sourcing"]
    },
    {
      title: "Turnkey Execution",
      description: "End-to-end project management ensuring your commercial or private vision is realized flawlessly.",
      icon: "03",
      features: ["Contractor Coordination", "Quality Control", "Timely Delivery"]
    }
  ];

  return (
    <section id="services" className="py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-[#f97316] mb-4 uppercase">Our Expertise</span>
          <h2 className="text-4xl md:text-5xl font-serif text-stone-900">Comprehensive Solutions</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-[#F9F8F6] p-10 rounded-2xl border border-stone-200/50 group hover:bg-stone-950 hover:text-white transition-all duration-700 overflow-hidden shadow-sm hover:shadow-2xl"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.15),transparent_70%)]" />

              <div className="relative z-10">
                <div className="text-5xl font-serif text-stone-200 mb-8 group-hover:text-[#f97316] transition-colors duration-700 font-light">
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
                      <span className="w-1.5 h-1.5 bg-[#f97316] rounded-full mr-3 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom border accent */}
              <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-[#f97316] transition-all duration-700" />
            </motion.div>
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

   const categories = ['All', 'Residential', 'Commercial', 'Public', 'Hospitality'];

   const [projects, setProjects] = useState<any[]>(() => getLocalProjects());

   // Subscribe to real‑time portfolio data
   useEffect(() => {
     const unsub = subscribeProjects(setProjects);
     return () => unsub();
   }, []);


  const filteredProjects = projects.filter(p => {
    const matchesCategory = filter === 'All' || p.category === filter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || p.title.toLowerCase().includes(searchLower) || (p.description && p.description.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="portfolio" className="py-28 bg-[#F9F8F6]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
          <div>
            <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-stone-400 mb-4 uppercase">Selected Works</span>
            <h2 className="text-4xl md:text-5xl font-serif text-stone-900">Our Portfolio</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6 md:mt-0 items-start md:items-end">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                aria-label="Search projects"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10 py-2.5 border-b border-stone-300 bg-transparent focus:outline-none focus:border-[#f97316] transition-colors w-full sm:w-56 text-sm"
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
                      <div className="w-0 group-hover:w-10 h-px bg-[#f97316] mt-4 transition-all duration-700 delay-300" />
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

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-16"
        >
          <a href="#" className="inline-flex items-center gap-2 text-stone-900 font-semibold text-sm tracking-wide hover:text-[#f97316] transition-colors group">
            View All Projects
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

// --- Process ---
const Process = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start center", "end center"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [isVisible, setIsVisible] = useState(false);

  // Native IntersectionObserver + safety fallback
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    // Safety fallback: force visible after 3s in case observer never fires
    const fallback = setTimeout(() => setIsVisible(true), 3000);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, []);

  const steps = [
    { number: '01', title: 'Consultation', desc: 'We meet to discuss your vision, needs, and budget.' },
    { number: '02', title: 'Concept', desc: 'We create mood boards and initial layouts for your approval.' },
    { number: '03', title: 'Procurement', desc: 'We source materials, furniture, and coordinate with vendors.' },
    { number: '04', title: 'Installation', desc: 'Our team manages the delivery and setup of every element.' },
    { number: '05', title: 'The Reveal', desc: 'The final walkthrough of your transformed space.' },
  ];

  return (
    <section id="process" ref={sectionRef} className="py-28 bg-stone-950 text-white relative overflow-hidden noise-overlay">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(249,115,22,0.05),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-stone-500 mb-4 uppercase">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-serif">The Design Journey</h2>
        </div>

        <div className="relative" ref={containerRef}>
          <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-stone-800 hidden md:block" />
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-[#f97316] hidden md:block origin-top z-0"
            style={{ scaleY }}
          />

          <div className="space-y-16 md:space-y-28">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="flex-1 text-center md:text-left p-6">
                  <div className={`md:max-w-xs ${index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto md:text-right'}`}>
                    <h3 className="text-2xl font-serif mb-3">{step.title}</h3>
                    <p className="text-stone-400/80 leading-relaxed text-sm">{step.desc}</p>
                  </div>
                </div>

                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={isVisible ? { scale: 1 } : { scale: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: index * 0.15 + 0.2 }}
                  className="relative z-10 flex items-center justify-center w-16 h-16 bg-stone-950 border border-stone-700 hover:border-[#f97316] rounded-full my-6 md:my-0 shrink-0 shadow-2xl shadow-black/60 hover:shadow-[#f97316]/20 transition-all duration-500 cursor-pointer"
                >
                  <span className="font-serif text-lg text-stone-300 hover:text-white transition-colors">{step.number}</span>
                </motion.div>

                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Client Portal Showcase ---
const ClientPortalShowcase = () => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents' | 'budget' | 'camera'>('timeline');
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const fallback = setTimeout(() => setIsVisible(true), 3000);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

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
    <section id="experience" ref={sectionRef} className="py-28 bg-stone-900 text-white relative overflow-hidden noise-overlay">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(249,115,22,0.03),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Interactive iPad Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -35 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 w-full"
          >
            {/* iPad outer shell */}
            <div className="bg-stone-950 border-[10px] border-stone-800 rounded-[2.5rem] shadow-2xl shadow-black/85 overflow-hidden relative aspect-[4/3] w-full max-w-2xl mx-auto flex flex-col">
              {/* Device camera dot */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-stone-850 rounded-full z-20" />
              
              {/* Portal Header */}
              <div className="bg-stone-900/90 border-b border-stone-800/80 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#f97316]/10 flex items-center justify-center border border-[#f97316]/20">
                    <span className="font-serif text-[#f97316] font-bold text-xs">DH</span>
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
              <div className="flex-1 bg-stone-950 p-6 overflow-y-auto min-h-0 relative">
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
                        <span className="text-xs font-bold text-[#f97316] font-mono">72% Completed</span>
                      </div>
                      <div className="h-1.5 bg-stone-850 rounded-full overflow-hidden w-full">
                        <div className="h-full bg-gradient-to-r from-[#f97316] to-[#ca8a04] rounded-full w-[72%]" />
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
                              <span className={`w-2 h-2 rounded-full ${item.active ? 'bg-[#f97316] animate-pulse' : idx < 4 ? 'bg-green-500' : 'bg-stone-700'}`} />
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
                              <div className="p-2 bg-stone-850 rounded-lg group-hover:bg-[#f97316]/10 group-hover:text-[#f97316] transition-colors text-stone-400">
                                <FileText size={14} />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-semibold text-stone-200 truncate group-hover:text-white transition-colors">{doc.name}</h5>
                                <p className="text-[0.55rem] text-stone-500 mt-0.5 tracking-wide uppercase font-mono">{doc.type}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-stone-900/80 mt-3 pt-2">
                              <span className="text-[0.65rem] text-stone-500 font-mono">{doc.size}</span>
                              <span className="text-[0.65rem] text-stone-400 group-hover:text-[#f97316] font-medium transition-colors">Download</span>
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
                              <div className="h-full bg-gradient-to-r from-[#f97316] to-[#ca8a04] rounded-full" style={{ width: `${cat.percent}%` }} />
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
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-stone-805 bg-stone-950">
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
                          <div className="p-2 bg-stone-850 rounded-lg text-[#f97316]">
                            <Camera size={14} />
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-white">Deck Construction Cam</h5>
                            <p className="text-[0.55rem] text-stone-500">Source: Hikvision Pro 4K</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button className="px-2 py-0.5 bg-stone-850 hover:bg-stone-800 transition text-[0.55rem] font-bold uppercase tracking-wider rounded text-stone-400">Cam 01</button>
                          <button className="px-2 py-0.5 bg-[#f97316] text-black text-[0.55rem] font-bold uppercase tracking-wider rounded">Cam 03</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Explanatory Texts & Interactive Controls */}
          <motion.div
            initial={{ opacity: 0, x: 35 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 35 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-10"
          >
            <div>
              <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-stone-450 mb-4 uppercase">The Client Experience</span>
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
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-350 flex gap-4 ${isActive ? 'bg-[#f97316] border-[#f97316] text-black shadow-lg shadow-[#f97316]/10' : 'bg-stone-900/40 border-stone-900/50 text-stone-300 hover:bg-stone-900/80 hover:border-stone-850'}`}
                  >
                    <div className={`p-2 rounded-lg transition-colors shrink-0 flex items-center justify-center ${isActive ? 'bg-black/10 text-black' : 'bg-stone-850 text-[#f97316]'}`}>
                      <TabIcon size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs tracking-wide uppercase">{tab.label}</h4>
                      <p className={`text-[0.7rem] mt-0.5 leading-relaxed ${isActive ? 'text-black/80' : 'text-stone-450'}`}>
                        {isActive ? tab.description : `Preview real-time ${tab.label.toLowerCase()} interface.`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

// --- Testimonials ---
const Testimonials = () => {
  const [current, setCurrent] = useState(0);
  const testimonials = [
    { text: "Luxe Interiors completely transformed our home. The attention to detail and the ability to capture our style was incredible.", author: "Sarah Jenkins", role: "Residential Client" },
    { text: "Professional, creative, and a joy to work with. They turned our sterile office into a warm, productive environment.", author: "Michael Chen", role: "CEO, TechStart" },
    { text: "The e-design service was perfect for my budget and timeline. I got the designer look I wanted without the full renovation stress.", author: "Emma Thompson", role: "E-Design Client" },
  ];

  const next = useCallback(() => setCurrent((c) => (c + 1) % testimonials.length), [testimonials.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length), [testimonials.length]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section id="reviews" className="py-28 bg-[#F9F8F6] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
      <div className="max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="w-16 h-px bg-[#f97316] mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-serif text-stone-900">Client Stories</h2>
        </motion.div>

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
                "{testimonials[current].text}"
              </p>
              <div className="w-12 h-px bg-stone-300 mx-auto mb-6" />
              <div>
                <h5 className="font-bold text-stone-900 tracking-wide text-sm">{testimonials[current].author}</h5>
                <p className="text-[0.65rem] text-stone-400 uppercase tracking-[0.2em] mt-1">{testimonials[current].role}</p>
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
              className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-10 bg-[#f97316]' : 'w-2.5 bg-stone-300 hover:bg-stone-400'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Contact (WhatsApp) ---
const Contact = () => {
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

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    setIsSubmitted(true);
  };

  // Native IntersectionObserver + safety fallback for Contact
  const contactRef = useRef<HTMLElement>(null);
  const [contactVisible, setContactVisible] = useState(false);

  useEffect(() => {
    const el = contactRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setContactVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    const fallback = setTimeout(() => setContactVisible(true), 3000);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, []);

  return (
    <section id="contact" ref={contactRef} className="py-28 bg-[#F9F8F6] relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={contactVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] text-stone-400 mb-4 uppercase">Get In Touch</span>
            <h2 className="text-4xl md:text-5xl font-serif text-stone-900 mb-8 leading-[1.08]">Let's Discuss Your Project</h2>
            <p className="text-stone-500 mb-12 text-lg leading-relaxed">
              Ready to elevate your space? Fill out the form, and we'll reach out via WhatsApp within 24 hours to discuss your project.
            </p>

            <div className="space-y-8">
              <div className="group">
                <h5 className="font-bold text-stone-900 mb-1.5 text-sm tracking-wide group-hover:text-[#f97316] transition-colors">Office</h5>
                <p className="text-stone-500 text-sm leading-relaxed">Level 4, Trade Centre<br />Bandra Kurla Complex, Mumbai 400051</p>
              </div>
              <div className="group">
                <h5 className="font-bold text-stone-900 mb-1.5 text-sm tracking-wide group-hover:text-[#f97316] transition-colors">Contact</h5>
                <p className="text-stone-500 text-sm leading-relaxed">info@dreamhorizon.com<br />+91 70207 05148</p>
              </div>
              <div className="group">
                <h5 className="font-bold text-stone-900 mb-1.5 text-sm tracking-wide group-hover:text-[#f97316] transition-colors">Hours</h5>
                <p className="text-stone-500 text-sm leading-relaxed">Mon - Fri: 9am - 6pm<br />Sat: By Appointment</p>
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={contactVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white p-8 md:p-12 shadow-premium relative overflow-hidden rounded-2xl"
          >
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
                    If WhatsApp didn't open, please send your inquiry manually to +91 70207 05148.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-6 text-sm text-[#f97316] font-medium hover:underline"
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
                        className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-[#f97316] transition-colors text-sm"
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
                        className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-[#f97316] transition-colors text-sm"
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
                      className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-[#f97316] transition-colors text-sm"
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
                        className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-[#f97316] transition-colors bg-transparent text-sm"
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
                        className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-[#f97316] transition-colors bg-transparent text-sm"
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
                      className="w-full border-b border-stone-200 py-2.5 focus:outline-none focus:border-[#f97316] transition-colors resize-none text-sm"
                      placeholder="Tell us about your space..."
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-stone-900 text-white py-4 font-medium text-sm tracking-[0.15em] hover:bg-[#f97316] transition-all duration-300 mt-4 hover:shadow-lg hover:shadow-[#f97316]/20"
                  >
                    SEND INQUIRY VIA WHATSAPP
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// --- Footer ---
const Footer = () => {
  return (
    <footer className="bg-stone-950 text-stone-400 pt-20 pb-8 relative noise-overlay">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-stone-800 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-1 md:col-span-2">
          <div className="flex flex-col items-start leading-none mb-6">
            <div className="flex items-baseline">
              <span className="text-2xl font-serif font-bold tracking-tight text-white">स्वप्न क्षितिज</span>
            </div>
            <span className="text-[0.55rem] font-sans tracking-[0.2em] text-stone-500 uppercase mt-1 font-medium">Design Concepts</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs mb-8 text-stone-500">
            Elevating spaces through timeless design and meticulous attention to detail.
          </p>
          <div className="flex gap-3">
            {[
              { Icon: Instagram, label: 'Follow us on Instagram' },
              { Icon: Facebook, label: 'Follow us on Facebook' },
              { Icon: Linkedin, label: 'Connect on LinkedIn' },
            ].map(({ Icon, label }, i) => (
              <a key={i} href="#" aria-label={label} className="w-10 h-10 flex items-center justify-center border border-stone-800 hover:bg-[#f97316] hover:text-white hover:border-[#f97316] transition-all duration-300 rounded-full">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h5 className="text-white font-bold mb-6 tracking-wide text-sm">Contact</h5>
          <ul className="space-y-3.5 text-sm text-stone-500">
            <li>Level 4, Trade Centre</li>
            <li>Bandra Kurla Complex, Mumbai 400051</li>
            <li>info@dreamhorizon.com</li>
            <li>+91 70207 05148</li>
          </ul>
        </div>

        <div>
          <h5 className="text-white font-bold mb-6 tracking-wide text-sm">Hours</h5>
          <ul className="space-y-3.5 text-sm text-stone-500">
            <li>Mon - Fri: 9am - 6pm</li>
            <li>Sat: By Appointment</li>
            <li>Sun: Closed</li>
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
          className="fixed bottom-8 right-8 z-[90] bg-[#f97316] text-white p-3.5 shadow-xl hover:bg-[#c2410c] transition-colors group"
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
            <p className="text-[#f97316] font-bold tracking-[0.25em] uppercase text-[0.65rem] mb-4">{project.category}</p>
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
  const items = [
    'Architectural Planning',
    'Luxury Interiors',
    'Turnkey Execution',
    'Bespoke Residences',
    'Commercial Spaces',
    'Hospitality Design',
    'Material Sourcing',
    'Space Optimization',
  ];
  const repeated = [...items, ...items];

  return (
    <section className="py-6 bg-stone-900 border-y border-stone-800/50 overflow-hidden">
      <div className="marquee-track" style={{ '--marquee-duration': '40s' } as React.CSSProperties}>
        {repeated.map((item, i) => (
          <span key={i} className="flex items-center shrink-0 px-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] mr-6" />
            <span className="text-xs tracking-[0.25em] uppercase font-medium text-stone-400 whitespace-nowrap">{item}</span>
          </span>
        ))}
      </div>
    </section>
  );
};

// --- Trusted By ---
const TrustedBy = () => {
  const logos = [
    { name: 'Architectural Digest', weight: 'font-serif italic text-2xl' },
    { name: 'VOGUE', weight: 'font-sans font-bold tracking-[0.3em] text-lg' },
    { name: 'Elle Decor', weight: 'font-serif italic text-2xl' },
    { name: 'Wallpaper*', weight: 'font-sans font-bold tracking-[0.15em] text-xl' },
    { name: 'Dezeen', weight: 'font-sans font-semibold tracking-[0.1em] text-xl' },
    { name: 'AD India', weight: 'font-serif italic text-2xl' },
  ];

  return (
    <section className="py-20 bg-[#F9F8F6] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <span className="text-[0.65rem] font-bold tracking-[0.3em] text-stone-400 uppercase">As Featured In</span>
        </motion.div>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
          {logos.map((logo, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`${logo.weight} text-stone-300 hover:text-stone-500 transition-colors duration-500 cursor-default select-none`}
            >
              {logo.name}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Parallax Quote ---
const ParallaxQuote = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section ref={ref} className="relative h-[60vh] md:h-[70vh] overflow-hidden flex items-center justify-center noise-overlay">
      <motion.div
        className="absolute inset-0"
        style={{ y }}
      >
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt=""
          loading="lazy"
          className="w-full h-[130%] object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-stone-950/70" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
      >
        <div className="w-16 h-px bg-[#f97316] mx-auto mb-8" />
        <blockquote className="text-3xl md:text-4xl lg:text-5xl font-serif text-white leading-[1.2] italic">
          "Design is not just what it looks like. Design is how it makes you <span className="text-[#f97316] not-italic">feel</span>."
        </blockquote>
        <div className="w-16 h-px bg-[#f97316] mx-auto mt-8" />
      </motion.div>
    </section>
  );
};

// --- CTA Banner ---
const CTABanner = () => {
  return (
    <section className="py-24 bg-stone-950 relative overflow-hidden noise-overlay">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.08),transparent_60%)]" />
      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[0.65rem] font-bold tracking-[0.3em] text-[#f97316] uppercase mb-4 block">Ready to Transform?</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6 leading-[1.1]">
            Let's Create Something <br />
            <span className="italic text-stone-400 font-light">Extraordinary</span>
          </h2>
          <p className="text-stone-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Book a complimentary consultation and discover how we can elevate your space beyond expectation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="bg-[#f97316] text-white px-10 py-4 font-medium text-sm tracking-[0.15em] hover:bg-[#ea650a] transition-all duration-300 hover:shadow-xl hover:shadow-[#f97316]/20"
            >
              BOOK YOUR CONSULTATION
            </motion.a>
            <motion.a
              href="#portfolio"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => { e.preventDefault(); document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="border border-white/20 text-white px-10 py-4 font-medium text-sm tracking-[0.15em] hover:bg-white hover:text-stone-900 transition-all duration-300"
            >
              VIEW OUR WORK
            </motion.a>
          </div>
        </motion.div>
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
      <ScrollToTopOnRouteChange />
      <CursorFollower />
      <a href="#portfolio" className="skip-link bg-stone-900 text-white px-4 py-2 text-sm font-medium">
        Skip to content
      </a>
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#f97316] origin-left z-[100]"
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
    <div className="min-h-screen bg-[#F9F8F6] text-stone-900 selection:bg-[#f97316]/20 relative">
      <MotionConfig reducedMotion="user">
        <HashRouter>
          <LayoutContainer scaleX={scaleX} />
        </HashRouter>
      </MotionConfig>
    </div>
  );
}
