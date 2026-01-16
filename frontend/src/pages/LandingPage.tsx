import { useEffect } from "react";
import { Link } from "react-router-dom";
import Lenis from "lenis";

export default function LandingPage() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="bg-gray-950 text-white">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent" />
        
        <div className="text-center z-10 max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Poxil
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Create stunning pixel art and animations with real-time collaboration
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border border-gray-600 hover:border-gray-400 rounded-lg text-lg font-semibold transition"
            >
              Learn More
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 animate-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="min-h-screen py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🎨"
              title="Powerful Tools"
              description="Pencil, eraser, color picker, bucket fill, and more drawing tools"
            />
            <FeatureCard
              icon="🎬"
              title="Frame Animation"
              description="Create smooth animations with timeline and onion skinning"
            />
            <FeatureCard
              icon="👥"
              title="Real-time Collaboration"
              description="Work together with others on the same canvas simultaneously"
            />
            <FeatureCard
              icon="📤"
              title="Export Options"
              description="Export as GIF animations or PNG sprite sheets"
            />
            <FeatureCard
              icon="💾"
              title="Cloud Storage"
              description="Save your projects securely in the cloud"
            />
            <FeatureCard
              icon="⚡"
              title="Fast & Responsive"
              description="Built with modern tech for smooth performance"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="min-h-screen py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="space-y-16">
            <Step
              number="01"
              title="Create Your Canvas"
              description="Choose your canvas size and start with a blank grid"
            />
            <Step
              number="02"
              title="Draw & Animate"
              description="Use powerful tools to create pixel art and add frames for animation"
            />
            <Step
              number="03"
              title="Collaborate & Share"
              description="Invite others to work together or share your creations"
            />
            <Step
              number="04"
              title="Export & Use"
              description="Download as GIF or PNG sprite sheets for your projects"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Create?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join Poxil today and bring your pixel art ideas to life
          </p>
          <Link
            to="/login"
            className="inline-block px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-xl font-semibold transition"
          >
            Start Creating Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2026 Poxil. Built by Dibyendu Sahoo</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 bg-gray-900 rounded-lg hover:bg-gray-800 transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-8 items-start">
      <div className="text-6xl font-bold text-blue-600/20">{number}</div>
      <div>
        <h3 className="text-2xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 text-lg">{description}</p>
      </div>
    </div>
  );
}
