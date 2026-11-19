import { useState, useEffect } from 'react';
import type { State } from '../domain/model';
import { budgetCategoryPolicy, budgetGroupNames, type BudgetGuidanceSettings, type BudgetGroup } from '../domain/budget-guidance';
import { PercentField, percentText } from './numeric-inputs';
import { ContextDetails } from './summary';

function BudgetCategoryRuleEditor({ state, name, onSave }: { state: State; name: string; onSave: (key: string, value: BudgetGuidanceSettings["categories"][string]) => void }) {
  const policy = budgetCategoryPolicy(state, name);
  const [group, setGroup] = useState(policy.group);
  const [cap, setCap] = useState(policy.maxPercent ?? 5);
  const [enabled, setEnabled] = useState(policy.maxPercent !== null);
  return <details className="budget-policy-editor">
    <summary>{name} · {budgetGroupNames[policy.group]} · {policy.maxPercent === null ? "ei kategoriarajaa" : `${percentText(policy.maxPercent)} %`}</summary>
    <label>Ryhmitys: {name}<select value={group} onChange={event => setGroup(event.target.value as typeof group)}>{Object.entries(budgetGroupNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="check"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /> Käytä kategoriakohtaista enimmäisosuutta</label>
    {enabled && <PercentField label={`${name}, enimmäisosuus nettotuloista (%)`} value={cap} min={0} max={100} onChange={setCap} />}
    <button type="button" onClick={() => onSave(policy.key, { group, maxPercent: enabled ? cap : null })}>Tallenna kategorian {name} ohje</button>
  </details>;
}
export function BudgetGuidanceSettingsPanel({ state, onSave }: { state: State; onSave: (rule: BudgetGuidanceSettings) => void }) {
  const rule = state.settings.budgetGuidance;
  const [shares, setShares] = useState(rule);
  const [error, setError] = useState("");
  useEffect(() => { setShares(rule); }, [rule]);
  const categoryNames = new Set<string>([
    ...state.categories.filter(category => category.kind === "expenses").map(category => category.name),
    ...state.expenses.map(item => item.category),
    ...Object.values(state.budgets).flatMap(month => Object.keys(month)),
    ...Object.values(state.budgetActuals).flatMap(month => Object.keys(month)),
  ]);
  for (const key of Object.keys(rule.categories)) {
    const category = state.categories.find(item => item.id === key && item.kind === "expenses");
    if (category) categoryNames.add(category.name);
    else if (key.startsWith("name:")) categoryNames.add(key.slice(5));
  }
  const categories = [...categoryNames].filter(Boolean).sort((a, b) => a.localeCompare(b, "fi"));
  return <section className="panel budget-rule-settings" aria-labelledby="budget-rule-settings-title">
    <div className="section-head"><div><h2 id="budget-rule-settings-title">Budjetin suositukset</h2><p>Muokkaa prosenttiraameja ja kategoriakohtaisia ohjeita.</p></div></div>
    <p className="ux-status-note">Sovita rajat omaan tilanteeseesi. Älä vaaranna välttämätöntä hoitoa tai velkaannu säästötavoitteen vuoksi.</p>
    <ContextDetails title="Miten suositukset ja rajat toimivat?"><p>50/30/20 on Warrenin ja Tyagin (2005) käytännön kehikko. Kategoriakohtaiset rajat ovat sovelluksen aloitusarvoja, eivät suomalaisia keskiarvoja. Rajojen summa voi ylittää 100 %: ryhmien yhteinen budjetti ratkaisee.</p><p>Luokitus koskee budjettiraameja. Menon oma välttämättömyysvalinta vaikuttaa erikseen hätävaralaskentaan. Säästö- ja sijoitussiirron menotyyppi ohjaa sen aina säästämisryhmään. Luottokorttilaskua ei pidä kirjata uudelleen, jos ostokset on jo kirjattu. Lisälyhennys voidaan luokitella säästämisryhmään, mutta sovellus ei erittele siitä korkoa tai päivitä velkasaldoa.</p></ContextDetails>
    <form onSubmit={event => { event.preventDefault(); if (Math.abs(shares.needs + shares.wants + shares.saving - 100) > 0.001) { setError("Ryhmien osuuksien summan pitää olla 100 %."); return; } setError(""); onSave({ ...rule, needs: shares.needs, wants: shares.wants, saving: shares.saving }); }}>
      <div className="budget-rule-grid">{(["needs", "wants", "saving"] as BudgetGroup[]).map(group => <PercentField key={group} label={`${budgetGroupNames[group]}, tavoite (%)`} value={shares[group]} min={0} max={100} onChange={value => setShares(current => ({ ...current, [group]: value }))} />)}</div>
      {error && <p role="alert">{error}</p>}<button type="submit">Tallenna ryhmien osuudet</button>
    </form>
    <h3>Kategoriakohtaiset suositukset</h3>
    <div className="budget-category-rule-list">{categories.map(name => <BudgetCategoryRuleEditor key={name} state={state} name={name} onSave={(key, value) => onSave({ ...rule, categories: { ...rule.categories, [key]: value } })} />)}</div>
  </section>;
}
