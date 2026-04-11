const NAV_ITEMS = [
  { id: 'generate', label: 'Generate', icon: '\u26A1' },
  { id: 'calendar', label: 'Calendar', icon: '\uD83D\uDCC5' },
  { id: 'saved', label: 'Saved', icon: '\uD83D\uDCBE' },
  { id: 'images', label: 'Images', icon: '\uD83D\uDDBC' },
  { id: 'settings', label: 'Settings', icon: '\u2699' },
];

export default function NavBar({ page, setPage }) {
  return (
    <nav className="border-b border-gray-700 px-6 flex gap-1 py-2">
      {NAV_ITEMS.map((n) => (
        <button
          key={n.id}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            page === n.id ? 'tab-active' : 'tab-inactive'
          }`}
          onClick={() => setPage(n.id)}
        >
          {n.icon} {n.label}
        </button>
      ))}
    </nav>
  );
}
