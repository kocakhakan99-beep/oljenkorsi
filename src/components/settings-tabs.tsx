export type SettingsTab = 'appearance' | 'finance' | 'account' | 'data';
export function settingsTabFromHash(hash: string): SettingsTab | null {
  const tab = hash.startsWith('settings-') ? hash.slice('settings-'.length) : '';
  return (['appearance', 'finance', 'account', 'data'] as string[]).includes(tab) ? tab as SettingsTab : null;
}

export function SettingsTabs({ value, onSelect }: { value: SettingsTab; onSelect: (tab: SettingsTab) => void }) {
 return (
                <div role="tablist" aria-label="Asetukset" className="settings-tabs">
                  {([['appearance', 'Ulkoasu ja käyttö'], ['finance', 'Talous'], ['account', 'Tili ja perhe'], ['data', 'Tiedot']] as const).map(([id, label], index, tabs) => <button key={id} type="button" role="tab" id={`settings-tab-${id}`} aria-controls={`settings-panel-${id}`} aria-selected={value === id} tabIndex={value === id ? 0 : -1} onClick={() => onSelect(id)} onKeyDown={event => { const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : -1; if (next >= 0) { event.preventDefault(); onSelect(tabs[next][0]); document.getElementById(`settings-tab-${tabs[next][0]}`)?.focus(); } }}>{label}</button>)}
                </div>
);
}
