import HdiLogo from "@/components/HdiLogo";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const NoRole = () => {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen bg-hdi-dark flex flex-col items-center justify-center px-4 text-center">
      <div className="flex items-center gap-[14px] mb-8">
        <HdiLogo size={44} />
        <span style={{ fontFamily: "'Fugaz One', cursive", fontSize: "22px", letterSpacing: "0.08em", color: "#F0F2F5" }}>
          H D I
        </span>
      </div>
      <h1 className="text-2xl font-serif text-hdi-off-white mb-3">Your account has no active role</h1>
      <p className="text-hdi-muted-text text-sm max-w-md mb-6 font-sans">
        Please contact <a href="mailto:info@hdi-tech.com" className="text-primary hover:underline">info@hdi-tech.com</a> so we can finish setting up your access.
      </p>
      <div className="flex items-center gap-3">
        <button onClick={signOut} className="border border-hdi-border/40 text-hdi-off-white hover:bg-white/5 px-5 py-2 rounded-lg text-sm font-sans transition-colors">
          Sign out
        </button>
        <Link to="/" className="text-hdi-muted-text hover:text-hdi-off-white text-sm font-sans transition-colors">
          ← Return to homepage
        </Link>
      </div>
    </div>
  );
};

export default NoRole;
