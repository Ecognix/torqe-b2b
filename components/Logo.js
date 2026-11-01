export default function Logo({ size = 27, white = false, spin = false, className = "" }) {
  return <img src="/logo-orange.png" alt="" width={size} height={size} className={`${white ? "logo-white" : ""} ${spin ? "torqe-spin" : ""} ${className}`} />;
}

export function Wordmark({ size = 27, white = false }) {
  return (
    <span className={`console-wordmark ${white ? "wordmark-white" : ""}`}>
      <Logo size={size} white={white} />
      <span className="console-wordmark-text">Torqe</span>
    </span>
  );
}
