export default function Art({ kind }: { kind: string }) {
  return <svg viewBox="0 0 320 260" fill="none" aria-hidden="true">
    <ellipse cx="160" cy="226" rx="88" ry="11" fill="#292d25" opacity=".09" />
    {kind === 'mug' && <>
      <path d="M215 99h15c44 0 43 72-2 72h-17" stroke="#b7a084" strokeWidth="18" />
      <path d="M88 87h132l-8 102c-2 37-112 37-116 0z" fill="#c7b69d" />
      <path d="M102 101h13l5 89c-7 6-13 4-14-4z" fill="#dfd3c0" />
      <ellipse cx="154" cy="88" rx="66" ry="15" fill="#e4d9c7" />
      <ellipse cx="154" cy="88" rx="54" ry="9" fill="#6e5742" />
      <path d="M140 58c-13-12 14-22 0-34m28 34c-13-12 14-22 0-34" stroke="#b9af9c" strokeWidth="3" strokeLinecap="round" opacity=".5" />
    </>}
    {kind === 'tote' && <>
      <path d="M121 85V67c0-56 78-56 78 0v18" stroke="#ac956d" strokeWidth="12" />
      <path d="M86 77h148l-9 141H95z" fill="#d5c49f" />
      <path d="M99 82h122l-9 130H108z" stroke="#bdaa85" strokeDasharray="3 4" />
      <path d="M117 84v41m86-41v41" stroke="#ac956d" strokeWidth="10" />
      <path d="M138 160c0-29 44-29 44 0m-22-21v40m-17-20h34" stroke="#5f7055" strokeWidth="3" />
      <text x="160" y="194" textAnchor="middle" fill="#5f7055" fontSize="10" fontFamily="sans-serif" letterSpacing="2">EVERYDAY</text>
    </>}
    {kind === 'lamp' && <>
      <path d="M170 97v113" stroke="#5b6856" strokeWidth="12" />
      <ellipse cx="170" cy="214" rx="60" ry="10" fill="#4e5e49" />
      <path d="M103 104c0-88 134-88 134 0z" fill="#7e8c72" />
      <ellipse cx="170" cy="104" rx="67" ry="8" fill="#55644b" />
      <ellipse cx="170" cy="106" rx="35" ry="4" fill="#f6dca1" />
      <path d="M115 84c8-22 25-33 40-37" stroke="#9dab90" strokeWidth="6" strokeLinecap="round" />
    </>}
    {kind === 'notebook' && <>
      <path d="M89 62l130-17 24 161-133 19z" fill="#deccac" />
      <path d="M87 59l130-17 23 158-133 19z" fill="#a55e44" />
      <path d="M98 58l21 158" stroke="#86482f" strokeWidth="3" />
      <path d="M204 44l24 159" stroke="#633e30" strokeWidth="7" />
      <path d="M138 111l43-6m-37 20l33-4" stroke="#eed6bb" strokeWidth="2" />
      <path d="M165 210l3 27 10-10 9 7-4-29" fill="#52684e" />
    </>}
    {kind === 'throw' && <>
      <path d="M70 93l149-26 36 119-150 31z" fill="#c6b397" />
      <path d="M70 93l147-26 18 58-145 29z" fill="#e2d4bf" />
      <path d="M82 116l146-28m-140 42l145-28m-139 42l143-27m-126 62l144-29m-137 45l144-29" stroke="#bfa88c" strokeWidth="2" />
      <path d="M105 216l-1 13m13-16v15m12-18v15m12-18v15m12-18v15m12-18v15m12-18v15m12-18v15m12-18v15m12-18v15m12-18v15m12-18v15" stroke="#c6b397" strokeWidth="3" />
    </>}
    {kind === 'bottle' && <>
      <path d="M142 38h36v30h-36z" fill="#384b45" />
      <path d="M137 62h46v21c0 7 20 10 20 29v89c0 29-86 29-86 0v-89c0-19 20-22 20-29z" fill="#748d80" />
      <path d="M133 116v81" stroke="#9caf9f" strokeWidth="8" strokeLinecap="round" />
      <path d="M148 45h24m-24 8h24" stroke="#596d62" strokeWidth="2" />
      <circle cx="166" cy="161" r="12" stroke="#ccd9c9" strokeWidth="2" />
      <path d="M166 152v18m-7-9h14" stroke="#ccd9c9" strokeWidth="2" />
    </>}
  </svg>
}

