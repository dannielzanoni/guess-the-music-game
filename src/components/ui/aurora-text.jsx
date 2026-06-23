import { memo } from "react"

export const AuroraText = memo(({
  children,
  className = "",
  colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
  speed = 1
}) => {
  const gradientStyle = {
    backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${
      colors[0]
    })`,
    backgroundSize: "200% auto",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
    animation: `aurora-text ${10 / speed}s ease-in-out infinite alternate`,
  }

  return (
    <span className={`aurora-text ${className}`.trim()}>
      <span className="sr-only">{children}</span>
      <span
        className="aurora-text-value"
        style={gradientStyle}
        aria-hidden="true">
        {children}
      </span>
    </span>
  );
})

AuroraText.displayName = "AuroraText"
