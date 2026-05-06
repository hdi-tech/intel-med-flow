interface HdiLogoProps {
  size?: number;
  borderRadius?: number;
}

const HdiLogo = ({ size = 44, borderRadius = 6 }: HdiLogoProps) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius,
      overflow: "hidden",
      flexShrink: 0,
    }}
  >
    <img
      src="/hdi-sphere.svg"
      alt="HDI Logo"
      width={size}
      height={size}
      style={{ display: "block" }}
    />
  </div>
);

export default HdiLogo;
