import { useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Configurable Variables
const ZOOM_TARGET_ORIGIN = "48% 75%"; // Coordinates for the "O" zoom
const BACKGROUND_GIF = "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif"; // Placeholder - Replace with your looped GIF

// Custom Icons for Navigation only (kept minimal)
const PaintIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
    <path d="m15 6.5-6.61 6.21A2.121 2.121 0 0 0 7.5 14.19L3 21" />
  </svg>
);

const GithubIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  // This ref now reveals just the FIRST feature
  const firstFeatureRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
    });

    // Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };
    
    gsap.ticker.add(raf);
    
    // Parallax Effect for Background
    const handleMouseMove = (e: MouseEvent) => {
        if(!backgroundRef.current) return;
        // Inverse movement: Mouse Right -> Bg Left
        const moveX = (e.clientX / window.innerWidth - 0.5) * 50; // Range -25 to 25
        const moveY = (e.clientY / window.innerHeight - 0.5) * 50;
        
        gsap.to(backgroundRef.current, {
            x: -moveX,
            y: -moveY,
            duration: 1,
            ease: "power2.out"
        });
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // clip-path syntax requires "at x y", transformOrigin uses "x y"
      // We use the same coordinates for both to align the zoom and the portal opening
      const clipPathOrigin = "49% 60%"; 

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "+=120%", // Increased slightly for smoother portal opening
          scrub: 1, // Smooth scrub
          pin: true,
        }
      });

      // Simultaneous Animations:
      // 1. Scale Text UP (Zoom in)
      // 2. Expand the Portal (clip-path) from the center of the O
      
      tl.to(textRef.current, {
        scale: 150, 
        transformOrigin: ZOOM_TARGET_ORIGIN, 
        ease: "power2.inOut",
        duration: 1,
        markers:true,
      }, 0) // Start at time 0
      
      .fromTo(firstFeatureRef.current, {
        clipPath: `circle(0% at ${clipPathOrigin})`,
        opacity: 1 // Ensure it's fully opaque, just masked
      }, {
        clipPath: `circle(350% at ${clipPathOrigin})`, // Expand mask to full screen
        ease: "power2.inOut",
        duration: 1,
      }, 0) // Start EXACTLY with the zoom
      .to(heroButtonsRef.current, {
         opacity: 0,
         duration: 0.2
      }, 0); // Fade buttons early

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="bg-[#151316] text-white overflow-x-hidden min-h-screen font-sans selection:bg-white selection:text-black">
      <style>{`
        ::-webkit-scrollbar {
          display: none;
        }
        html {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Hero Section Container (Pinned) */}
      <div ref={heroRef} className="h-screen w-full flex items-center justify-center relative overflow-hidden">
        
        {/* Background - Animated GIF with Parallax */}
        <div className="absolute inset-0 bg-[#151316] z-0"></div>
        <div 
            ref={backgroundRef} 
            className="absolute inset-[-100px] z-0 opacity-30 pointer-events-none mix-blend-screen"
        >
             {/* Placeholder GIF - Replace src with your specific loop */}
             <img 
                src={BACKGROUND_GIF} 
                alt="Background" 
                className="w-full h-full object-cover grayscale opacity-50" 
             />
        </div>

        {/* POXIL Text - Pure White, Heavy Font with Colored O */}
        <div className="relative z-30 select-none text-white whitespace-nowrap flex flex-col items-center">
            <h1 
              ref={textRef}
              className="font-emphasis font-white text-[20vw] leading-none tracking-tighter"
            >
              P<span className="text-[#df4c16]">o</span>xil
            </h1>
            <p className="font-primary text-xl md:text-2xl mt-4 tracking-wide text-gray-300">
                Tool for pixel art creation and animation
            </p>
        </div>
        
        {/* Vertical Buttons - Relocated beside Title */}
        <div ref={heroButtonsRef} className="absolute left-[calc(50%+18vw)] top-1/2 -translate-y-12 flex flex-col gap-4 z-50">
            <Link to="/login" className="group relative">
                <button className="relative w-12 h-32 bg-transparent border border-[#333] rounded-sm flex flex-col items-center justify-center gap-3 hover:border-white transition-colors duration-300 cursor-pointer backdrop-blur-sm">
                    <span 
                        className="text-sm font-primary font-bold tracking-[0.2em] select-none" 
                        style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
                    >
                        Enter
                    </span>
                </button>
            </Link>

            <a href="https://github.com/F4tal1t/Poxil" target="_blank" rel="noreferrer" className="group">
                 <button className="w-12 h-12 bg-transparent border border-[#333] rounded-sm flex items-center justify-center hover:bg-[#333] hover:text-white transition-colors cursor-pointer backdrop-blur-sm">
                    <GithubIcon size={20} className="text-white opacity-80" />
                 </button>
            </a>
        </div>

        <div 
          ref={firstFeatureRef} 
          className="absolute inset-0 flex items-center justify-center z-10 bg-[#050505]"
          style={{ clipPath: `circle(0% at ${ZOOM_TARGET_ORIGIN})` }} // Start closed
        >
             {/* Portal Frame Effect */}
             <div className="absolute inset-4 border border-[#333] border-dashed pointer-events-none"></div>
             
             {/* Editor Preview Area - Centered Showcase */}
             <div className="w-full h-full flex flex-col items-center justify-center p-12">
                 <div className="relative w-full max-w-6xl aspect-video bg-[#1a181c] border border-[#333] rounded-lg shadow-2xl flex items-center justify-center overflow-hidden group">
                     {/* Image Placeholder */}
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 space-y-4">
                        <span className="font-primary text-sm tracking-[0.2em] uppercase">Editor Interface Preview</span>
                        <div className="w-16 h-16 border-2 border-gray-700 border-dashed rounded-full animate-spin-slow"></div>
                        <p className="text-xs font-mono opacity-50">Place editor screenshot here</p>
                     </div>
                     
                     {/* Optional: Overlay Text */}
                     <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        <h3 className="text-white font-emphasis text-3xl">Professional Grade Tools</h3>
                     </div>
                 </div>
                 
                 <div className="mt-8 text-center max-w-2xl">
                     <span className="font-emphasis text-[#df4c16] text-xl tracking-widest mb-2 block">01 / Creation</span>
                     <h2 className="font-emphasis text-4xl text-white">Full-Fledged Editor</h2>
                 </div>
             </div>
        </div>

      </div>

      {/* Subsequent Feature Sections (Scroll naturally after unpin) */}
      <div className="relative z-30 bg-[#151316]">
          
          {/* Feature 2 */}
           <section className="min-h-screen flex flex-col items-center justify-center px-6 border-t border-[#222] relative overflow-hidden">
             {/* Creative Background Element */}
             <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[20vw] font-emphasis text-[#1a181c] select-none -z-10 leading-none">
                02
             </div>

             <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="order-2 md:order-1">
                    <div className="space-y-6">
                        <div className="h-px w-32 bg-[#df4c16]"></div>
                        <p className="font-primary text-2xl text-gray-400 leading-relaxed">
                            <span className="text-white font-bold block mb-2">Layer Stack System.</span>
                            Construct complex scenes with non-destructive layering. Blend modes, opacity control, and locking mechanisms included.
                        </p>
                    </div>
                </div>
                <div className="order-1 md:order-2 text-right">
                    <h2 className="font-emphasis text-6xl md:text-9xl leading-[0.85] uppercase text-white">
                        Safe<br/>State<br/>Logic
                    </h2>
                </div>
             </div>
          </section>

          {/* Feature 3 */}
           <section className="min-h-screen flex flex-col items-center justify-center px-6 border-t border-[#222] relative">
             <div className="max-w-6xl w-full">
                <div className="flex flex-col items-center text-center">
                    <span className="font-emphasis text-[#df4c16] text-xl tracking-widest mb-4">03 / Motion</span>
                    <h2 className="font-emphasis text-6xl md:text-9xl mb-12 text-white">
                        Velocity
                    </h2>
                    <div className="max-w-2xl border-x border-[#333] px-12 py-8">
                        <p className="font-primary text-2xl text-gray-400 leading-relaxed">
                            <span className="text-white font-bold">Timeline Architecture.</span> 
                            Keyframe-based animation tools built directly into the editor. 
                        </p>
                        <p className="font-primary text-lg text-gray-500 mt-4">
                            Includes Onion Skinning for precise frame transitions and direct Sprite Sheet export.
                        </p>
                    </div>
                </div>
             </div>
          </section>

          {/* Feature 4 - Moved from Start */}
           <section className="min-h-screen flex flex-col items-center justify-center px-6 border-t border-[#222] relative overflow-hidden">
             {/* Creative Background Element */}
             <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[20vw] font-emphasis text-[#1a181c] select-none -z-10 leading-none">
                04
             </div>

             <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div className="text-left">
                     <span className="font-emphasis text-[#df4c16] text-xl tracking-widest mb-4 block">04 / Sync</span>
                     <h2 className="font-emphasis text-6xl md:text-8xl mb-8 leading-[0.85] text-white">
                        Real<br/>Time<br/>Link
                     </h2>
                 </div>
                 <div className="text-left border-l border-[#333] pl-8">
                     <p className="font-primary text-2xl text-gray-400 leading-relaxed mb-6">
                        <span className="text-white font-bold">WebSocket Powered.</span> Instantaneous state synchronization across all connected clients.
                     </p>
                     <p className="font-primary text-lg text-gray-500">
                        See every pixel placement as it happens. Zero latency collaborative drawing for remote teams.
                     </p>
                 </div>
             </div>
          </section>
      </div>

      {/* Footer/CTA Section */}
      <section className="min-h-[50vh] flex items-center justify-center bg-white text-black relative z-30">
            <div className="text-center">
                <h2 className="text-6xl md:text-8xl font-emphasis font-black mb-8 tracking-tighter">
                </h2>
                <Link to="/login" className="px-12 py-4 border-2 border-black text-black text-xl font-bold font-primary rounded-full hover:bg-black hover:text-white transition-colors inline-block uppercase tracking-widest">
                    Launch Editor
                </Link>
            </div>
      </section>

    </div>
  );
}
