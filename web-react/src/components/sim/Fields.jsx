import { useId } from 'react';

/** Campo numérico con unidad, ayuda y aviso. El valor es texto para poder dejarlo vacío al teclear. */
export function NumberField({ label, value, onChange, unit, hint, warn, step = 'any', min = 0, max, className = '' }) {
  const id = useId();
  const described = [hint ? `${id}-h` : null, warn ? `${id}-w` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`sim-field ${className}`}>
      <label className="sim-field__label" htmlFor={id}>{label}</label>
      <div className="sim-field__box">
        <input id={id} className="input sim-field__input" type="number" inputMode="decimal" min={min} max={max} step={step}
          value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={described} aria-invalid={warn ? true : undefined} />
        {unit ? <span className="sim-field__unit">{unit}</span> : null}
      </div>
      {hint ? <span id={`${id}-h`} className="sim-field__hint">{hint}</span> : null}
      {warn ? <span id={`${id}-w`} className="sim-field__warn" role="status">{warn}</span> : null}
    </div>
  );
}

/** Grupo de opciones excluyentes con el estilo «seg» del resto de la web. */
export function ChoiceField({ legend, name, value, options, onChange }) {
  const id = useId();
  return (
    <fieldset className="sim-choice">
      <legend className="sim-field__label">{legend}</legend>
      <div className="seg-group">
        {options.map((o) => (
          <label key={String(o.value)} className="seg">
            <input type="radio" className="seg__input" name={`${id}-${name}`} value={String(o.value)}
              checked={String(value) === String(o.value)} onChange={() => onChange(o.value)} />
            <span className="seg__text">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SelectField({ label, value, onChange, children, hint }) {
  const id = useId();
  return (
    <div className="sim-field">
      <label className="sim-field__label" htmlFor={id}>{label}</label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={hint ? `${id}-h` : undefined}>{children}</select>
      {hint ? <span id={`${id}-h`} className="sim-field__hint">{hint}</span> : null}
    </div>
  );
}
