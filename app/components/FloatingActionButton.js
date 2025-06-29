// FloatingActionButton.js
'use client';

export default function FloatingActionButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 hover:scale-110 active:scale-95"
      title="Manage Houses"
    >
      <svg
        className="w-8 h-8 mx-auto"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm16 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v0M3 7h18M8 11v4M16 11v4"
        />
      </svg>
    </button>
  );
}
