import { useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Configurable Variables
const ZOOM_TARGET_ORIGIN = "48% 65%"; // Coordinates for the "O" zoom

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
            duration: 2.5,
            ease: "power3.out"
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
      const clipPathOrigin = "49% 56%"; 

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
        clipPath: `circle(450% at ${clipPathOrigin})`, // Expand mask to full screen
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
            className="absolute inset-[-100px] z-0 opacity-15 pointer-events-none mix-blend-screen"
        >
             {/* Placeholder GIF - Replace src with your specific loop */}
             <img 
                src="/Back.gif" 
                alt="Background" 
                className="w-full h-full object-cover grayscale opacity-50" 
             />
        </div>

        {/* POXIL Text - Pure White, Heavy Font with Colored O */}
        <div ref={textRef} className="relative z-30 select-none text-white whitespace-nowrap flex flex-col items-center">
            <h1 
              className="font-emphasis font-gray-100 text-[20vw] leading-none tracking-tighter"
            >
              P<span className="text-[#df4c16]">o</span>xil
            </h1>
            <p className="font-primary text-xl md:text-2xl mt-4 tracking-wide text-gray-300">
                Tool for pixel art creation and animation
            </p>

            {/* Scroll Indicator */}
            <div className="absolute bottom-[-20vh] flex flex-col items-center gap-2 opacity-50">
                <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-1">
                   <div className="w-1 h-3 bg-white rounded-full animate-scroll"></div>
                </div>
                <span className="font-primary text-xs tracking-widest uppercase">Scroll :D</span>
            </div>
        </div>
        
        {/* Vertical Buttons - Relocated beside Title */}
        <div ref={heroButtonsRef} className="absolute left-[calc(50%+22vw)] top-1/2 -translate-y-12 flex flex-col gap-4 z-50">
            <Link to="/login" className="group relative">
                <button className="relative w-12 h-32 bg-transparent border border-[#333] rounded-sm flex flex-col items-center justify-center gap-3 hover:border-white transition-colors duration-300 cursor-pointer backdrop-blur-sm">
                    <span 
                        className="text-sm font-primary font-bold tracking-[0.2em] select-none" 
                        style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
                    >
                        ENTER
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
                     <img 
                        src="/Editor.png" 
                        alt="Editor Interface" 
                        className="w-full h-full object-cover z-10"
                     />
                     
                     {/* Optional: Overlay Text */}
                     <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-20">
                        <h3 className="text-white font-emphasis text-3xl">Professional Grade Tools</h3>
                     </div>
                 </div>
                 
                 <div className="mt-8 w-full max-w-6xl flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                     <div className="w-full md:w-1/2 text-left">
                        <h2 className="font-emphasis text-4xl text-white">Full-Fledged Editor</h2>
                     </div>
                     <div className="w-full md:w-1/2 text-left">
                        <p className="text-gray-400 font-primary text-lg leading-relaxed">
                            Create and animate pixel art with our robust in-browser editor. Featuring layers, frames, and a suite of pixel-perfect tools designed for artists.
                        </p>
                     </div>
                 </div>
             </div>
        </div>

      </div>

      <div className="relative z-30 bg-[#151316]">
          
           {/* Feature: Animations */}
           <section className="min-h-screen flex flex-col items-center justify-center px-6 relative bg-[#151316]">
             {/* Background Overlay */}
             <div className="absolute inset-0 z-0 opacity-25 pointer-events-none mix-blend-screen">
                 <img src="/Background.png" alt="" className="w-full h-full object-cover" />
             </div>

             <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
                
                <div className="text-center md:text-left">
                    <h2 className="font-emphasis text-5xl md:text-7xl leading-[0.85] text-white">
                        Sprite<br/>Animations
                    </h2>
                </div>

                <div className="flex justify-center py-8 md:py-0">
                    <div className="w-64 h-64 md:w-80 md:h-80 relative bg-black/20 rounded-full border border-[#333] flex items-center justify-center overflow-hidden">
                         <img src="/Loader.gif" className="w-full h-full object-cover opacity-80 mix-blend-screen" alt="Animation Loop" />
                    </div>
                </div>

                <div className="text-center md:text-left pl-0 md:pl-8 border-none md:border-solid">
                    <p className="font-primary text-xl text-gray-400 leading-relaxed mb-6">
                        <span className="text-white font-bold">Timeline Architecture </span> <br/>
                        Keyframe-based animation tools built directly into the editor for seamless motion.
                    </p>
                    <p className="font-primary text-sm text-gray-500 uppercase tracking-widest">
                        Onion Skinning • Sprite Export
                    </p>
                </div>

             </div>
          </section>

          {/* Feature: Sync */}
           <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
             {/* Background Overlay */}
             <div className="absolute inset-0 z-0 opacity-25 pointer-events-none mix-blend-screen">
                 <img src="/Background.png" alt="" className="w-full h-full object-cover" />
             </div>

             <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
                 
                 {/* Left: Title */}
                 <div className="text-center md:text-left">
                    <h2 className="font-emphasis text-5xl md:text-7xl leading-[0.85] text-white">
                        Live<br/>Sync
                    </h2>
                 </div>

                 {/* Middle: GIF Placeholder */}
                 <div className="flex justify-center py-8 md:py-0">
                    <div className="w-64 h-64 md:w-80 md:h-80 relative bg-black/20 rounded-full border border-[#333] flex items-center justify-center overflow-hidden">
                         {/* Replace with Collaboration GIF */}
                         <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/10 to-transparent"></div>
                    </div>
                </div>

                 {/* Right: Description */}
                 <div className="text-center md:text-left border-l border-[#333] pl-0 md:pl-8 border-none md:border-solid">
                     <p className="font-primary text-xl text-gray-400 leading-relaxed mb-6">
                        <span className="text-white font-bold">Multiplayer Engine.</span> 
                        Work on the same canvas with your team. Zero-latency updates powered by WebSockets.
                     </p>
                     <p className="font-primary text-sm text-gray-500 uppercase tracking-widest">
                        Cursor Tracking • Chat Integration
                     </p>
                 </div>
             </div>
          </section>

          {/* Feature: Auto Save */}
           <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
             {/* Background Overlay */}
             <div className="absolute inset-0 z-0 opacity-25 pointer-events-none mix-blend-screen">
                 <img src="/Background.png" alt="" className="w-full h-full object-cover" />
             </div>

             <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
                
                {/* Left: Title */}
                <div className="text-center md:text-left">
                    <h2 className="font-emphasis text-5xl md:text-7xl leading-[0.85] text-white">
                        Cloud<br/>State
                    </h2>
                </div>

                {/* Middle: GIF Placeholder */}
                <div className="flex justify-center py-8 md:py-0">
                    <div className="w-64 h-64 md:w-80 md:h-80 relative bg-black/20 rounded-full border border-[#333] flex items-center justify-center overflow-hidden">
                         {/* Replace with Cloud Save GIF */}
                         <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent"></div>
                    </div>
                </div>

                {/* Right: Description */}
                <div className="text-center md:text-left border-l border-[#333] pl-0 md:pl-8 border-none md:border-solid">
                    <p className="font-primary text-xl text-gray-400 leading-relaxed mb-6">
                        <span className="text-white font-bold">Asynchronous Saving.</span> 
                        Never lose a pixel. Background synchronization ensures your workspace is preserved across sessions and devices.
                    </p>
                    <p className="font-primary text-sm text-gray-500 uppercase tracking-widest">
                        60s Interval • Local Cache
                    </p>
                </div>

             </div>
          </section>
      </div>

      {/* Footer */}
      <footer className="h-[60vh] bg-[#151316] relative overflow-hidden flex flex-col justify-end z-30">

        <div className="relative z-10 w-full flex flex-col md:flex-row items-end justify-between">
            
            {/* Left: POXIL Text - Attached to bottom left */}
            <h1 className="font-emphasis text-[30vw] leading-[0.75] bg-gradient-to-b from-[#151316] to-gray-600 bg-clip-text text-transparent select-none opacity-90 ">
                Poxil
            </h1>
            
            {/* Right: Actions & Links */}
            <div className="flex flex-col items-end gap-8 p-8 md:p-12 md:mb-8">
                 <Link to="/login" 
                    className="group flex items-center gap-2 px-8 py-4 bg-[#111] border border-[#333] rounded-full hover:bg-[#df4c16] hover:border-[#df4c16] hover:text-white transition-all duration-400">
                    <span className="font-primary text-sm tracking-wider uppercase text-gray-300 group-hover:text-white">Launch Editor</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </Link>

                 <div className="flex flex-col items-end gap-3">
                     <div className="flex items-center gap-6">
                        <a href="https://github.com/F4tal1t/Poxil" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#df4c16] font-primary text-sm transition-colors uppercase tracking-widest flex items-center gap-2">
                             <GithubIcon size={16} />
                             <span>Source</span>
                        </a>
                        <a href="https://dibby.me" className="text-gray-500 hover:text-[#df4c16] font-primary text-sm transition-colors uppercase tracking-widest">Creators Portfolio</a>
                     </div>
                     <span className="text-gray-700 font-primary text-xs">2026 Poxil</span>
                 </div>
            </div>
        </div>
      </footer>

    </div>
  );
}
