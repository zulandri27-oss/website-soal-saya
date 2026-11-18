import type { StimulusTable } from '../types/assessment';

interface StimulusTableBlockProps {
  table: StimulusTable;
}

export function StimulusTableBlock({ table }: StimulusTableBlockProps) {
  return (
    <div className="mt-3 overflow-x-auto rounded border border-[#E2E8F0] bg-white">
      <table className="w-full border-collapse text-left text-[13px]">
        <caption className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-left text-[12px] font-semibold text-[#0F172A]">
          {table.caption}
        </caption>
        <thead>
          <tr className="border-b border-[#E2E8F0] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
            {table.headers.map((head, idx) => (
              <th key={`${head}-${idx}`} className="px-3 py-2">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5F9] tabular-nums">
          {table.rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-[#F8FAFC]">
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={`px-3 py-2 ${
                    cIdx === 0
                      ? 'font-semibold text-[#0F172A]'
                      : 'font-mono text-[#334155]'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
