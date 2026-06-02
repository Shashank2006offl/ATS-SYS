export default function InsightCard({ icon: Icon, title, color, children }) {
  return (
    <div className={`insight-card insight-card--${color}`}>
      <div className="insight-card__header">
        <div className={`insight-card__icon insight-card__icon--${color}`}>
          <Icon size={18} />
        </div>
        <h3 className="insight-card__title">{title}</h3>
      </div>
      <div className="insight-card__body">{children}</div>
    </div>
  );
}
