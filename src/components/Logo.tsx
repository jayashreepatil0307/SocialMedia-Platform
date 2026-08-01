interface LogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
}

export default function Logo({ size = 40, withText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="mitrasetu-logo-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5B5FEF" />
            <stop offset="0.5" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#mitrasetu-logo-grad)" />
        {/* M formed with infinity bridge */}
        <path
          d="M16 42V22h5l6 8 6-8h5v20h-5V30l-6 8-6-8v12h-5z"
          fill="white"
        />
        {/* Infinity loop tail suggesting infinite friendship */}
        <path
          d="M38 32c0-3 2.5-5.5 5.5-5.5S49 29 49 32s-2.5 5.5-5.5 5.5S38 35 38 32zm5.5-3a3 3 0 100 6 3 3 0 000-6z"
          fill="white"
          opacity="0.85"
        />
      </svg>
      {withText && (
        <span className="text-xl font-extrabold tracking-tight">
          <span className="text-slate-800">Mitra</span>
          <span className="gradient-text">Setu</span>
        </span>
      )}
    </div>
  );
}
