export default function ConsolePanel({ logs, onClear }) {
  return (
    <div className="panel-body">
      <div className="card-head">
        <h3 className="card-title">Console</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
          Clear
        </button>
      </div>
      {logs.length === 0 ? (
        <p className="empty">
          Nothing yet. Call <code>api.log('hi')</code> or <code>console.log('hi')</code> from a
          script while the game plays.
        </p>
      ) : (
        <ul className="log-list">
          {logs.map((entry, i) => (
            <li key={i} className={'log log-' + entry.level}>
              <span className="log-time">
                {new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="log-text">{entry.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
