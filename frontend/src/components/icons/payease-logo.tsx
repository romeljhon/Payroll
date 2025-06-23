import type { SVGProps } from 'react';

export default function PayEaseLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="100" 
      height="25"
      aria-label="PayEase Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <text
        x="5"
        y="38"
        fontFamily="Inter, sans-serif"
        fontSize="36"
        fontWeight="bold"
        fill="url(#logoGradient)"
        className={props.className} // Allow passing className for text color override
      >
        PayEase
      </text>
    </svg>
  );
}
