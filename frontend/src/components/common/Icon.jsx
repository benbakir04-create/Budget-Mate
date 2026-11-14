// Line icons used across the new screens (24×24, stroke = currentColor).
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  home: 'M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  target: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  wallet: 'M5 6h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 10h18M16 15h2',
  bag: 'M9 11V7a3 3 0 0 1 6 0v4M5 9h14l-1 12H6z',
  down: 'M12 4v12M6 11l6 6 6-6M5 20h14',
  clock: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 8v4l3 2',
  close: 'M6 6l12 12M18 6 6 18',
  chevron: 'm15 6-6 6 6 6',
};

const Icon = ({ name, className = 'h-5 w-5', strokeWidth = 2 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d={PATHS[name]} />
  </svg>
);

export default Icon;
