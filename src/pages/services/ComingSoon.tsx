import { useState } from "react";
import { motion } from "framer-motion";
import ConstellationSphere from "@/components/ConstellationSphere";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const ComingSoon = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    const { error } = await supabase.from("education_waitlist").insert({ email });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "You're on the list!", description: "We'll notify you when this service launches." });
      setEmail("");
    }
  };

  return (
    <div>
      <section className="relative overflow-hidden py-32 lg:py-44" style={{ backgroundColor: "#0D1B2E" }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <ConstellationSphere size={700} opacity={0.08} />
        </div>
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span
              className="inline-block font-sans font-semibold uppercase mb-6"
              style={{
                fontSize: "8px",
                letterSpacing: "1.5px",
                backgroundColor: "#FEF0EC",
                color: "#712B13",
                padding: "4px 10px",
                borderRadius: "2px",
              }}
            >
              Coming Soon
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-hdi-off-white leading-tight max-w-3xl mx-auto">
              AI-powered diagnostic services expanding soon
            </h1>
            <p className="font-sans text-sm mt-6 max-w-md mx-auto" style={{ color: "#7AAECC", lineHeight: 1.7 }}>
              Join the waitlist and be the first to know when new services launch on the HDI platform.
            </p>

            <form onSubmit={handleJoin} className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-hdi-border/20 text-hdi-off-white placeholder:text-hdi-sky/50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="text-primary-foreground px-6 py-2.5 rounded-lg font-medium font-sans transition-colors whitespace-nowrap disabled:opacity-50"
                style={{ backgroundColor: "#1D9E75" }}
              >
                {submitting ? "Joining..." : "Join waitlist"}
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ComingSoon;
