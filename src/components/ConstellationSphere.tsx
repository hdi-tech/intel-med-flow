interface ConstellationSphereProps {
  className?: string;
  size?: number;
  opacity?: number;
}

const ConstellationSphere = ({ className = "", size = 400, opacity = 0.08 }: ConstellationSphereProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
    >
      <defs>
        <radialGradient id="fadeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1"/>
          <stop offset="60%" stopColor="white" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <clipPath id="sphereClip">
          <circle cx="250" cy="250" r="210"/>
        </clipPath>
      </defs>

      <g clipPath="url(#sphereClip)">
        {/* Horizontal grid lines */}
        <line x1="40" y1="110" x2="460" y2="110" stroke="white" strokeWidth="0.5" opacity="0.15"/>
        <line x1="40" y1="165" x2="460" y2="165" stroke="white" strokeWidth="0.5" opacity="0.2"/>
        <line x1="40" y1="220" x2="460" y2="220" stroke="white" strokeWidth="0.6" opacity="0.28"/>
        <line x1="40" y1="250" x2="460" y2="250" stroke="white" strokeWidth="0.7" opacity="0.32"/>
        <line x1="40" y1="280" x2="460" y2="280" stroke="white" strokeWidth="0.6" opacity="0.28"/>
        <line x1="40" y1="335" x2="460" y2="335" stroke="white" strokeWidth="0.5" opacity="0.2"/>
        <line x1="40" y1="390" x2="460" y2="390" stroke="white" strokeWidth="0.5" opacity="0.15"/>

        {/* Vertical grid lines */}
        <line x1="110" y1="40" x2="110" y2="460" stroke="white" strokeWidth="0.5" opacity="0.15"/>
        <line x1="165" y1="40" x2="165" y2="460" stroke="white" strokeWidth="0.5" opacity="0.2"/>
        <line x1="220" y1="40" x2="220" y2="460" stroke="white" strokeWidth="0.6" opacity="0.28"/>
        <line x1="250" y1="40" x2="250" y2="460" stroke="white" strokeWidth="0.7" opacity="0.32"/>
        <line x1="280" y1="40" x2="280" y2="460" stroke="white" strokeWidth="0.6" opacity="0.28"/>
        <line x1="335" y1="40" x2="335" y2="460" stroke="white" strokeWidth="0.5" opacity="0.2"/>
        <line x1="390" y1="40" x2="390" y2="460" stroke="white" strokeWidth="0.5" opacity="0.15"/>

        {/* Diagonal lines — top-left to bottom-right */}
        <line x1="50" y1="50" x2="450" y2="450" stroke="#8899AA" strokeWidth="0.4" opacity="0.18"/>
        <line x1="110" y1="50" x2="460" y2="400" stroke="#8899AA" strokeWidth="0.4" opacity="0.15"/>
        <line x1="50" y1="110" x2="400" y2="460" stroke="#8899AA" strokeWidth="0.4" opacity="0.15"/>
        <line x1="165" y1="50" x2="460" y2="345" stroke="#8899AA" strokeWidth="0.4" opacity="0.13"/>
        <line x1="50" y1="165" x2="345" y2="460" stroke="#8899AA" strokeWidth="0.4" opacity="0.13"/>
        <line x1="220" y1="50" x2="460" y2="290" stroke="#8899AA" strokeWidth="0.4" opacity="0.12"/>
        <line x1="50" y1="220" x2="290" y2="460" stroke="#8899AA" strokeWidth="0.4" opacity="0.12"/>
        <line x1="280" y1="50" x2="460" y2="230" stroke="#8899AA" strokeWidth="0.4" opacity="0.12"/>
        <line x1="50" y1="280" x2="230" y2="460" stroke="#8899AA" strokeWidth="0.4" opacity="0.12"/>

        {/* Diagonal lines — top-right to bottom-left */}
        <line x1="450" y1="50" x2="50" y2="450" stroke="#8899AA" strokeWidth="0.4" opacity="0.18"/>
        <line x1="390" y1="50" x2="40" y2="400" stroke="#8899AA" strokeWidth="0.4" opacity="0.15"/>
        <line x1="450" y1="110" x2="100" y2="460" stroke="#8899AA" strokeWidth="0.4" opacity="0.15"/>
        <line x1="335" y1="50" x2="40" y2="345" stroke="#8899AA" strokeWidth="0.4" opacity="0.13"/>
        <line x1="450" y1="165" x2="155" y2="460" stroke="#8899AA" strokeWidth="0.4" opacity="0.13"/>
        <line x1="280" y1="50" x2="40" y2="290" stroke="#8899AA" strokeWidth="0.4" opacity="0.12"/>
        <line x1="450" y1="220" x2="210" y2="460" stroke="#8899AA" strokeWidth="0.4" opacity="0.12"/>
        <line x1="220" y1="50" x2="40" y2="230" stroke="#8899AA" strokeWidth="0.4" opacity="0.12"/>
        <line x1="450" y1="280" x2="270" y2="460" stroke="#8899AA" strokeWidth="0.4" opacity="0.12"/>

        {/* Inner triangulation diagonals */}
        <line x1="110" y1="110" x2="390" y2="390" stroke="#7799BB" strokeWidth="0.5" opacity="0.2"/>
        <line x1="390" y1="110" x2="110" y2="390" stroke="#7799BB" strokeWidth="0.5" opacity="0.2"/>
        <line x1="110" y1="250" x2="390" y2="250" stroke="#7799BB" strokeWidth="0.5" opacity="0.22"/>
        <line x1="250" y1="110" x2="250" y2="390" stroke="#7799BB" strokeWidth="0.5" opacity="0.22"/>
        <line x1="165" y1="165" x2="335" y2="335" stroke="#7799BB" strokeWidth="0.5" opacity="0.18"/>
        <line x1="335" y1="165" x2="165" y2="335" stroke="#7799BB" strokeWidth="0.5" opacity="0.18"/>
        <line x1="110" y1="165" x2="390" y2="335" stroke="#7799BB" strokeWidth="0.4" opacity="0.15"/>
        <line x1="390" y1="165" x2="110" y2="335" stroke="#7799BB" strokeWidth="0.4" opacity="0.15"/>
        <line x1="165" y1="110" x2="335" y2="390" stroke="#7799BB" strokeWidth="0.4" opacity="0.15"/>
        <line x1="335" y1="110" x2="165" y2="390" stroke="#7799BB" strokeWidth="0.4" opacity="0.15"/>

        {/* Dots — outer ring */}
        <circle cx="250" cy="50" r="3" fill="white" opacity="0.3"/>
        <circle cx="310" cy="58" r="3" fill="white" opacity="0.28"/>
        <circle cx="190" cy="58" r="3" fill="white" opacity="0.28"/>
        <circle cx="370" cy="80" r="3.5" fill="white" opacity="0.32"/>
        <circle cx="130" cy="80" r="3.5" fill="white" opacity="0.32"/>
        <circle cx="420" cy="115" r="3.5" fill="white" opacity="0.3"/>
        <circle cx="80" cy="115" r="3.5" fill="white" opacity="0.3"/>
        <circle cx="455" cy="165" r="3" fill="white" opacity="0.28"/>
        <circle cx="45" cy="165" r="3" fill="white" opacity="0.28"/>
        <circle cx="468" cy="220" r="3" fill="white" opacity="0.25"/>
        <circle cx="32" cy="220" r="3" fill="white" opacity="0.25"/>
        <circle cx="470" cy="280" r="3" fill="white" opacity="0.25"/>
        <circle cx="30" cy="280" r="3" fill="white" opacity="0.25"/>
        <circle cx="455" cy="335" r="3" fill="white" opacity="0.28"/>
        <circle cx="45" cy="335" r="3" fill="white" opacity="0.28"/>
        <circle cx="420" cy="385" r="3.5" fill="white" opacity="0.3"/>
        <circle cx="80" cy="385" r="3.5" fill="white" opacity="0.3"/>
        <circle cx="370" cy="420" r="3.5" fill="white" opacity="0.32"/>
        <circle cx="130" cy="420" r="3.5" fill="white" opacity="0.32"/>
        <circle cx="310" cy="442" r="3" fill="white" opacity="0.28"/>
        <circle cx="190" cy="442" r="3" fill="white" opacity="0.28"/>
        <circle cx="250" cy="450" r="3" fill="white" opacity="0.3"/>

        {/* Dots — second ring */}
        <circle cx="165" cy="110" r="5" fill="white" opacity="0.45"/>
        <circle cx="250" cy="110" r="5" fill="white" opacity="0.48"/>
        <circle cx="335" cy="110" r="5" fill="white" opacity="0.45"/>
        <circle cx="110" cy="165" r="5" fill="white" opacity="0.45"/>
        <circle cx="390" cy="165" r="5" fill="white" opacity="0.45"/>
        <circle cx="110" cy="335" r="5" fill="white" opacity="0.45"/>
        <circle cx="390" cy="335" r="5" fill="white" opacity="0.45"/>
        <circle cx="165" cy="390" r="5" fill="white" opacity="0.45"/>
        <circle cx="250" cy="390" r="5" fill="white" opacity="0.48"/>
        <circle cx="335" cy="390" r="5" fill="white" opacity="0.45"/>

        {/* Dots — inner ring */}
        <circle cx="165" cy="165" r="6.5" fill="white" opacity="0.65"/>
        <circle cx="250" cy="165" r="7" fill="white" opacity="0.7"/>
        <circle cx="335" cy="165" r="6.5" fill="white" opacity="0.65"/>
        <circle cx="165" cy="250" r="7" fill="white" opacity="0.7"/>
        <circle cx="335" cy="250" r="7" fill="white" opacity="0.7"/>
        <circle cx="165" cy="335" r="6.5" fill="white" opacity="0.65"/>
        <circle cx="250" cy="335" r="7" fill="white" opacity="0.7"/>
        <circle cx="335" cy="335" r="6.5" fill="white" opacity="0.65"/>

        {/* Dots — second inner ring */}
        <circle cx="220" cy="220" r="8" fill="white" opacity="0.82"/>
        <circle cx="280" cy="220" r="8" fill="white" opacity="0.82"/>
        <circle cx="220" cy="280" r="8" fill="white" opacity="0.82"/>
        <circle cx="280" cy="280" r="8" fill="white" opacity="0.82"/>

        {/* Centre dots */}
        <circle cx="250" cy="220" r="9" fill="white" opacity="0.92"/>
        <circle cx="220" cy="250" r="9" fill="white" opacity="0.92"/>
        <circle cx="250" cy="250" r="11" fill="white" opacity="1"/>
        <circle cx="280" cy="250" r="9" fill="white" opacity="0.92"/>
        <circle cx="250" cy="280" r="9" fill="white" opacity="0.92"/>
      </g>

      <circle cx="250" cy="250" r="210" fill="url(#fadeGrad)" opacity="0.0"/>
    </svg>
  );
};

export default ConstellationSphere;
