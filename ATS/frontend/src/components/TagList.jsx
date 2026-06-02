export default function TagList({ items, variant }) {
  if (!items || items.length === 0) return <p className="empty-tag">None identified.</p>;
  return (
    <div className="tag-list">
      {items.map((item, i) => (
        <span key={i} className={`tag tag--${variant}`}>{item}</span>
      ))}
    </div>
  );
}
