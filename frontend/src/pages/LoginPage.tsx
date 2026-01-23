import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp } from "../lib/auth";
import { GoogleFill } from "akar-icons";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp.email({ email, password, name });
      } else {
        await signIn.email({ email, password });
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-850">
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-gray-900 justify-center items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="/Banner.png" 
            alt="Pixel Art Background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-850/20 mix-blend-multiply" />
        </div>
        
        {/* Content overlaid on image */}
        <div className="relative z-10 p-12 text-white max-w-2xl">
          <h1 className="text-6xl font-emphasis mb-6 leading-tight">
            Create. <br/>
            Animate. <br/>
            <span className="text-[#df4c16]">Pixelate.</span>
          </h1>
          <p className="text-xl text-gray-300 font-light leading-relaxed">
            Join the community of pixel artists. Create stunning sprite sheets, animations, and game assets directly in your browser.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-gray-850 border-l border-gray-800">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white font-emphasis mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-400">
              {isSignUp 
                ? "Start your pixel art journey today" 
                : "Enter your credentials to access your workspace"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-primary text-gray-300">Full Name</label>
                <input
                  type="text"
                  placeholder="Dibby Dabba Doo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#df4c16] focus:ring-1 focus:ring-[#df4c16] transition-colors"
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-primary text-gray-300">Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#df4c16] focus:ring-1 focus:ring-[#df4c16] transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-primary text-gray-300">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#df4c16] focus:ring-1 focus:ring-[#df4c16] transition-colors"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-850 text-gray-400">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await signIn.social({
                  provider: "google",
                  callbackURL: `${window.location.origin}/dashboard`,
                });
              }}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-primary py-3 rounded-lg transition-all transform active:scale-[0.98] shadow-lg"
            >
              <GoogleFill size={20} />
              Google
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#df4c16] hover:bg-[#c94514] disabled:opacity-50 disabled:cursor-not-allowed text-white font-primary py-3 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-orange-900/20"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isSignUp ? "Sign Up" : "Sign In"
              )}
            </button>
          </form>

          <div className="text-center pt-4">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-gray-400 hover:text-white transition-colors text-sm hover:underline"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
