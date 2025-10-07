import type { SVGProps } from "react";

export default function KazuPayGraphicalLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      aria-label="KazuPay Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary))" }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--accent))" }} />
        </linearGradient>
      </defs>
      {/* Icon */}
      <g transform="translate(5, 5)">
        <circle cx="20" cy="20" r="20" fill="url(#logoGradient)" />
        <path
          d="M20 12 V 28 M 14 17 L 26 17 M 14 23 L 26 23"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      {/* Text */}
      <text
        x="55"
        y="33"
        fontFamily="Inter, sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
      >
        KazuPay
      </text>
    </svg>
  );
}
