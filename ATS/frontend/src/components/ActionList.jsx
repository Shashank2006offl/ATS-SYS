import { ChevronRight } from 'lucide-react';

export default function ActionList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="action-list">
      {items.map((item, i) => (
        <li key={i} className="action-list__item">
          <ChevronRight size={16} className="action-list__icon" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
