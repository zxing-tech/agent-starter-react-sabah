'use client';

const CONTACTS = [
  { name: 'Befrienders KL', number: '03-7956 8145', tel: 'tel:03-79568145' },
  { name: 'Talian Kasih', number: '15999', tel: 'tel:15999' },
  { name: 'Emergency', number: '999', tel: 'tel:999' },
];

export function EmergencyContacts() {
  return (
    <div className="mt-8 rounded-xl border border-red-900/40 bg-red-950/20 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-400/80">
        Crisis &amp; Emergency Contacts
      </p>
      <div className="grid grid-cols-3 gap-2">
        {CONTACTS.map(({ name, number, tel }) => (
          <a
            key={tel}
            href={tel}
            className="flex flex-col items-center gap-1 rounded-lg border border-red-900/30 bg-red-950/30 px-2 py-3 text-center transition-colors hover:border-red-700/50 hover:bg-red-950/50 active:bg-red-900/40"
          >
            <span className="text-[11px] font-medium leading-tight text-red-300/80">
              {name}
            </span>
            <span className="text-sm font-bold tabular-nums text-red-200">
              {number}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
