import { useState } from "react";
import { uid, type Category, type State } from "../domain/model";
import {
  categoryIconFor,
  categoryIconOptions,
  defaultCategoryDefinitions,
  optionalCategoryDefinitions,
  type CategoryIconId,
} from "../domain/categories";
import { renameCategory } from "../domain/category-management";
import { CategoryImage } from "./category-image";

export function Categories({
  s,
  kind,
  commit,
}: {
  s: State;
  kind: "incomes" | "expenses";
  commit: (s: State) => boolean;
}) {
  const [name, setName] = useState(""),
    [error, setError] = useState(""),
    [chosenIcon, setChosenIcon] = useState<CategoryIconId | null>(null);
  function rename(id: string, value: string) {
    try {
      if (commit(renameCategory(s, id, value))) setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kategorian nimeä ei voitu muuttaa.");
    }
  }
  const availableOptional = optionalCategoryDefinitions.filter(
    (definition) =>
      definition.kind === kind &&
      !s.categories.some(
        (category) =>
          category.kind === kind && category.name === definition.name,
      ),
  );
  function addDefinition(definition: Category) {
    if (
      s.categories.some(
        (category) =>
          category.kind === kind && category.name === definition.name,
      )
    ) {
      setError("Kategoria on jo olemassa.");
      return;
    }
    if (commit({ ...s, categories: [...s.categories, definition] }))
      setError("");
  }
  function changeIcon(id: string, icon: CategoryIconId) {
    commit({
      ...s,
      categories: s.categories.map((category) =>
        category.id === id ? { ...category, icon } : category,
      ),
    });
  }
  return (
    <>
      <div className="category-editor-intro">
        <span className="eyebrow">SELKEÄT KATEGORIAT</span>
        <p>
          Aloituksessa näytetään pieni joukko yleisiä kategorioita. Lisää vain
          tarvitsemasi valinnaiset tai luo oma. Kuvakkeet ovat pieniä
          paikallisia kuvia; kodin ja asuntolainan kaltaiset aiheet käyttävät
          samaa kuvaa.
        </p>
        <small>
          Nimen muutos päivittää tietueet, budjetit ja käsin syötetyt toteumat.
          Arkistointi piilottaa valinnan mutta säilyttää historian.
        </small>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="category-list">
        {s.categories
          .filter((c) => c.kind === kind)
          .map((c) => (
            <div
              className={`category-management-row${c.archived ? " archived" : ""}`}
              key={c.id}
            >
              <CategoryImage icon={c.icon} size={32} />
              <input
                aria-label={`Kategorian ${c.name} nimi`}
                defaultValue={c.name}
                key={c.name}
                onBlur={(e) =>
                  e.target.value !== c.name && rename(c.id, e.target.value)
                }
              />
              <label className="category-icon-choice">
                <span className="sr-only">Kuvake</span>
                <CategoryImage icon={c.icon} size={25} />
                <select
                  aria-label={`Kuvake kategorialle ${c.name}`}
                  value={c.icon}
                  onChange={(event) =>
                    changeIcon(c.id, event.target.value as CategoryIconId)
                  }
                >
                  {categoryIconOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() =>
                  commit({
                    ...s,
                    categories: s.categories.map((x) =>
                      x.id === c.id ? { ...x, archived: !x.archived } : x,
                    ),
                  })
                }
              >
                {c.archived ? "Palauta" : "Arkistoi"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    s[kind].some((e) => e.category === c.name) ||
                    Object.values(s.budgets).some((b) => c.name in b) ||
                    Object.values(s.budgetActuals).some((b) => c.name in b)
                  ) {
                    setError(
                      "Kategoria on käytössä. Arkistoi se poistamisen sijaan.",
                    );
                    return;
                  }
                  commit({
                    ...s,
                    categories: s.categories.filter((x) => x.id !== c.id),
                  });
                }}
              >
                Poista
              </button>
            </div>
          ))}
      </div>
      {availableOptional.length > 0 && (
        <details className="category-optional">
          <summary>
            Valinnaiset valmiit kategoriat
            <span>{availableOptional.length} lisättävissä</span>
          </summary>
          <div className="category-optional-grid">
            {availableOptional.map((definition) => (
              <button
                key={definition.name}
                type="button"
                className="category-optional-card"
                onClick={() =>
                  addDefinition({
                    id: uid(),
                    ...definition,
                    archived: false,
                  })
                }
              >
                <CategoryImage icon={definition.icon} size={32} />
                <span>{definition.name}</span>
                <strong>Lisää</strong>
              </button>
            ))}
          </div>
        </details>
      )}
      <form
        className="category-create-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !name.trim() ||
            name.length > 100 ||
            s.categories.some(
              (c) => c.kind === kind && c.name === name.trim(),
            ) ||
            [
              ...defaultCategoryDefinitions,
              ...optionalCategoryDefinitions,
            ].some((c) => c.kind === kind && c.name === name.trim())
          ) {
            setError("Anna valmiskategorioista eroava yksilöllinen nimi.");
            return;
          }
          if (
            commit({
              ...s,
              categories: [
                ...s.categories,
                {
                  id: uid(),
                  name: name.trim(),
                  kind,
                  color: kind === "incomes" ? "#17604d" : "#245c78",
                  icon: chosenIcon || categoryIconFor(name, kind),
                  archived: false,
                },
              ],
            })
          ) {
            setName("");
            setChosenIcon(null);
            setError("");
          }
        }}
      >
        <div className="category-create-fields">
          <label>
            Oma kategoria
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </label>
          <label className="category-icon-choice category-icon-choice-new">
            <span>Kuvake</span>
            <CategoryImage
              icon={chosenIcon || categoryIconFor(name, kind)}
              size={32}
            />
            <select
              aria-label="Kuvake uudelle kategorialle"
              value={chosenIcon || categoryIconFor(name, kind)}
              onChange={(event) =>
                setChosenIcon(event.target.value as CategoryIconId)
              }
            >
              {categoryIconOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="primary">
          Lisää oma kategoria
        </button>
      </form>
    </>
  );
}
