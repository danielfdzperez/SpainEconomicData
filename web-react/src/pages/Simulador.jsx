import { useCallback, useMemo, useState } from 'react';
import { BalanceSection } from '../components/sim/BalanceSection.jsx';
import { ComparativaSection } from '../components/sim/ComparativaSection.jsx';
import { NominaSection } from '../components/sim/NominaSection.jsx';
import { ParoSection } from '../components/sim/ParoSection.jsx';
import { ServiciosSection } from '../components/sim/ServiciosSection.jsx';
import { StarMark } from '../components/Help.jsx';
import { useRepo, useSimParams } from '../data/DataContext.jsx';
import { lit, t, useLang } from '../i18n/index.js';
import { calcularAutonomo } from '../domain/autonomo.js';
import { calcularBalance } from '../domain/balance.js';
import { calcularComparativa } from '../domain/comparativa.js';
import { economiaDeAutonomo, economiaDeNomina } from '../domain/economia.js';
import { construirHistorial, simularParoAhora } from '../domain/historial.js';
import { importePrestacionMeses } from '../domain/paro.js';
import { calcularNomina, netoPorEuroExtra } from '../domain/payroll.js';
import { calcularServicios } from '../domain/services.js';
import {
  autonomoInput, avisos, cambiarFrecuenciaModo, contextoContrato, defaultForm, ejemploHistorial, historialInicial, nominaInput, nuevoPeriodo, num, periodosInput, serviciosInput,
} from '../state/simForm.js';

const SECCIONES = [
  { id: 'sueldo', label: lit('1 · Tu sueldo') },
  { id: 'servicios', label: lit('2 · Lo que usas') },
  { id: 'balance', label: lit('3 · Balance') },
  { id: 'paro', label: lit('4 · Paro') },
  { id: 'privado', label: lit('5 · Estado o privado') },
];

function irA(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  el.querySelector('h2')?.focus({ preventScroll: true });
}

function Simulacion({ params }) {
  const repo = useRepo();
  const lang = useLang();
  const [form, setForm] = useState(() => defaultForm(params));
  const set = useCallback((campo, valor) => setForm((f) => ({ ...f, [campo]: valor })), []);
  const setEtapa = useCallback((id, campo, valor) => setForm((f) => ({ ...f, educacion: { ...f.educacion, [id]: { ...f.educacion[id], [campo]: valor } } })), []);
  const setFrecuenciaModo = useCallback((modo) => setForm((f) => cambiarFrecuenciaModo(f, modo)), []);
  const ctx = useMemo(() => ({
    setHistorialActivo: (activo) => setForm((f) => ({ ...f, historialActivo: activo, historial: activo && f.historial.length === 0 ? historialInicial(f) : f.historial })),
    setPeriodo: (id, campo, valor) => setForm((f) => ({ ...f, historial: f.historial.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)) })),
    addPeriodo: (tipo) => setForm((f) => ({ ...f, historial: [...f.historial, nuevoPeriodo(tipo)] })),
    quitarPeriodo: (id) => setForm((f) => ({ ...f, historial: f.historial.filter((p) => p.id !== id) })),
    usarEjemplo: () => setForm((f) => ({ ...f, historial: ejemploHistorial() })),
    vaciarHistorial: () => setForm((f) => ({ ...f, historial: [] })),
  }), []);

  const poblacion = useMemo(() => {
    const s = repo.series('pob_es_total');
    return s.get(params.gastoPublico.anio) ?? s.points[s.points.length - 1].value;
  }, [repo, params]);

  const sim = useMemo(() => {
    const entrada = nominaInput(form, params);
    const nomina = calcularNomina(entrada, params.nomina);
    const extra = netoPorEuroExtra(entrada, params.nomina);
    const autonomo = calcularAutonomo(autonomoInput(form), params);
    const economia = form.regimen === 'autonomo' ? economiaDeAutonomo(autonomo) : economiaDeNomina(nomina);
    const servicios = calcularServicios(serviciosInput(form), params, { brutoProrrateado: economia.brutoMensual, netoMensual: economia.netoMensual });
    const historial = construirHistorial(periodosInput(form), params, contextoContrato(form, params));
    const paroAhora = simularParoAhora(historial, params);
    // sin historial detallado, el paro cobrado sale de los meses que cuenta la persona y del sueldo de hoy
    const paroCobrado = form.historialActivo ? 0 : importePrestacionMeses(economia, num(form.mesesParo), params).importe;
    const balance = calcularBalance({
      economia, servicios, aniosTrabajados: num(form.aniosTrabajados), historial: form.historialActivo ? historial : undefined, paroCobrado, poblacion, params,
    });
    const comparativa = calcularComparativa({ economia, servicios, opciones: { base: form.comparaBase, salud: form.comparaSalud } });
    return { nomina, extra, autonomo, economia, servicios, balance, historial, paroAhora, comparativa };
  }, [form, params, poblacion, lang]);

  const lista = useMemo(() => avisos(form, params), [form, params, lang]);
  const avisoDe = useCallback((campo) => lista.find((a) => a.campo === campo)?.texto, [lista]);
  const comun = { form, set, params, sim, avisoDe, ctx };

  return (
    <>
      <section className="page-head">
        <div className="wrap prose">
          <h1>{t('Simulador: tu sueldo y los servicios que usas')}</h1>
          <p className="page-head__lead">{t('Escribe tu sueldo bruto (o lo que facturas, si eres autónomo) y mira qué se queda cada parte, cuánto cuesta lo que has usado de la sanidad, la escuela y el transporte, en lo público y en lo privado, y cuánto paro has generado y te tocaría.')}</p>
          <p className="sim-disclaimer"><StarMark /> {t('Es una estimación, no un cálculo oficial: todas las cifras que salen de aquí son cálculos nuestros sobre datos oficiales y llevan asterisco.')}</p>
        </div>
      </section>
      <div className="wrap sim">
        <nav className="sim-nav" aria-label={t('Secciones del simulador')}>
          {SECCIONES.map((s) => <button key={s.id} type="button" className="chip" onClick={() => irA(s.id)}>{t(s.label)}</button>)}
          <button type="button" className="btn btn--ghost sim-nav__reset" onClick={() => setForm(defaultForm(params))}>{t('Volver a los valores de partida')}</button>
        </nav>
        <NominaSection {...comun} />
        <ServiciosSection {...comun} setEtapa={setEtapa} setFrecuenciaModo={setFrecuenciaModo} />
        <BalanceSection {...comun} />
        <ParoSection {...comun} />
        <ComparativaSection {...comun} />
      </div>
    </>
  );
}

export default function Simulador() {
  const { params, error, retry } = useSimParams();
  if (error) {
    return (
      <div className="wrap sim-error">
        <h1>{t('No se han podido cargar los parámetros del simulador')}</h1>
        <p>{String(error.message)}</p>
        <button type="button" className="btn btn--primary" onClick={retry}>{t('Reintentar')}</button>
      </div>
    );
  }
  if (!params) return <p className="wrap loading">{t('Cargando parámetros del simulador…')}</p>;
  return <Simulacion params={params} />;
}
