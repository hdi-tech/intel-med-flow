import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ConstellationSphere from "@/components/ConstellationSphere";

const Education = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    const { error } = await (supabase as any).from("education_waitlist").insert({ email: email.trim() });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "You're already on the list!", description: "We'll notify you when courses launch." });
        setSubmitted(true);
      } else {
        toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      }
    } else {
      setSubmitted(true);
      toast({ title: "You're on the list!", description: "We'll notify you when HDI Education launches." });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "#0D1B2E" }}>
        <div className="container mx-auto px-4 lg:px-8 py-24 lg:py-32 text-center relative z-10">
          <span className="inline-block text-xs font-sans font-semibold tracking-[0.2em] uppercase text-hdi-teal-light mb-4">
            Clinical Education
          </span>
          <h1 className="text-4xl lg:text-5xl font-serif text-hdi-off-white mb-6 leading-tight">
            Knowledge that elevates outcomes
          </h1>
          <p className="text-hdi-sky/80 font-sans text-lg max-w-2xl mx-auto leading-relaxed">
            Structured courses designed to help practitioners review, validate, and implement digital designs with clinical confidence.
          </p>
        </div>
      </section>

      {/* Coming Soon Card */}
      <section className="py-20" style={{ backgroundColor: "#F5F8FC" }}>
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <div className="relative rounded-2xl overflow-hidden p-10 lg:p-14 text-center" style={{ backgroundColor: "#0D1B2E" }}>
            {/* Sphere decoration */}
            <div className="absolute -right-16 -top-16 opacity-10">
              <ConstellationSphere size={280} />
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl lg:text-3xl font-serif text-hdi-off-white mb-4">
                HDI Education is launching soon.
              </h2>
              <p className="text-hdi-sky/70 font-sans text-base max-w-lg mx-auto mb-10 leading-relaxed">
                We are building a curriculum of clinical courses tailored to digital dentistry workflows — from case evaluation to design approval.
              </p>

              {/* Waitlist form */}
              <div className="max-w-md mx-auto">
                <p className="text-hdi-sky/60 font-sans text-sm mb-4">
                  Be the first to know when courses launch.
                </p>
                {submitted ? (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg px-5 py-4">
                    <p className="text-primary font-sans text-sm font-medium">✓ You're on the waitlist! We'll be in touch.</p>
                  </div>
                ) : (
                  <form onSubmit={handleJoin} className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm font-sans bg-white/10 border border-hdi-sky/20 text-hdi-off-white placeholder:text-hdi-sky/40 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-sans font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {submitting ? "Joining..." : "Join Waitlist"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Education;
