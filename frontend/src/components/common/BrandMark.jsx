// The temporary mark: an eight-point star in sun yellow, until the name and logo are decided.
const BrandMark = ({ className = 'h-7 w-7', centerColor = '#12A26E' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="5" y="5" width="14" height="14" rx="1.5" fill="#F5B829" />
    <rect x="5" y="5" width="14" height="14" rx="1.5" transform="rotate(45 12 12)" fill="#F5B829" />
    <circle cx="12" cy="12" r="3" fill={centerColor} />
  </svg>
);

export default BrandMark;
