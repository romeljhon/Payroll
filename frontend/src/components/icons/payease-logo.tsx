import type { SVGProps } from "react";

export default function KazuPaySolutionsLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      aria-label="KazuPay Solutions Logo"
      className={props.className} // Tailwind controls size, not fixed width/height
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop
            offset="0%"
            style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "hsl(var(--accent))", stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
      <text
        x="5"
        y="38"
        fontFamily="Inter, sans-serif"
        fontSize="36"
        fontWeight="bold"
        fill="url(#logoGradient)"
      >
        KazuPay Solutions
      </text>
    </svg>
  );
}
