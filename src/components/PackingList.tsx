// src/components/PackingList.tsx
import type { PackingItem } from "../lib/packingList";

type Props = {
  items: PackingItem[];
};

export function PackingList({ items }: Props) {
  if (items.length === 0) return null;

  const wear = items.filter((i) => i.column === "wear");
  const carry = items.filter((i) => i.column === "carry");
  const skip = items.filter((i) => i.column === "skip");

  function renderCol(title: string, colItems: PackingItem[], className: string) {
    if (colItems.length === 0) return null;
    return (
      <div className={`packing-list__col ${className}`}>
        <div className="packing-list__col-heading">{title}</div>
        <ul className="packing-list__col-list">
          {colItems.map((i) => (
            <li key={i.item} className="packing-list__item" title={i.reason}>
              {i.item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <details className="packing-list__details">
      <summary className="packing-list__summary">Pakkeliste</summary>
      <div className="packing-list__grid">
        {renderCol("Ha på deg", wear, "packing-list__col--wear")}
        {renderCol("Ta med", carry, "packing-list__col--carry")}
        {renderCol("Trenger ikke", skip, "packing-list__col--skip")}
      </div>
    </details>
  );
}
