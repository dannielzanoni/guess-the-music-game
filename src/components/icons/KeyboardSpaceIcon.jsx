export function KeyboardSpaceIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M3 15h2v4h14v-4h2v4c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2z"
      />
    </svg>
  )
}
