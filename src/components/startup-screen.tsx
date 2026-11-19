export function StartupScreen({ exiting = false }: { exiting?: boolean }) {
  return <div className={`startup-screen${exiting ? " is-exiting" : ""}`} role={exiting ? undefined : "status"} aria-live={exiting ? undefined : "polite"} aria-hidden={exiting || undefined}>
    <div className="startup-content">
      <div className="startup-mark" aria-hidden="true"><span /><span /><span /></div>
      <strong>Valmistellaan talouttasi</strong>
      <span>Hetki, avataan sovellus.</span>
    </div>
  </div>;
}
