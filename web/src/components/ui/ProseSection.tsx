import { cn } from "@/lib/utils";
import type { DocSection } from "@/lib/content";

export function ProseSection({ section }: { section: DocSection }) {
  return (
    <section className="space-y-4">
      {section.heading && (
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{section.heading}</h2>
      )}
      {section.paragraphs.map((p, i) => (
        <p key={i} className="leading-relaxed text-slate-600 dark:text-slate-400">
          {p}
        </p>
      ))}
      {section.bullets && (
        <ul className="space-y-2">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex gap-3 leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-seai-500" aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {section.table && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                {section.table.headers.map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={cn("px-4 py-3 font-semibold text-slate-900 dark:text-white", i > 0 && "text-right sm:text-left")}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {section.table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className={cn(
                        "px-4 py-3 align-top text-slate-600 dark:text-slate-400",
                        c > 0 && "text-right sm:text-left",
                      )}
                    >
                      <span className="font-medium text-slate-900 sm:hidden dark:text-white">{section.table?.headers[c]}: </span>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}