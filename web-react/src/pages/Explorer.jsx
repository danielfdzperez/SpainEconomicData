import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Workbench } from '../components/Workbench.jsx';
import { presetById } from '../content/presets.js';
import { t } from '../i18n/index.js';
import { decodeState, encodeState } from '../state/urlState.js';

export default function Explorer() {
  const [params] = useSearchParams();
  const fallback = presetById('core');
  // El estado inicial sale de la URL; después manda el Workbench y la URL se reescribe con replaceState (el router no se entera).
  // Si el router sí detecta un cambio (se pega otro enlace en la misma pestaña, atrás/adelante), `key` cambia y el gráfico se reconstruye.
  const key = params.toString();
  const initial = useMemo(() => decodeState(params, fallback.state), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const [status, setStatus] = useState('');

  const onStateChange = useCallback((state) => {
    window.history.replaceState(null, '', `#/explorador?${encodeState(state)}`);
  }, []);

  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setStatus(t('Enlace copiado.')); }
    catch { setStatus(t('Copia la dirección del navegador.')); }
  };

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <h1>{t('Explorador')}</h1>
          <p className="page-head__lead">{t('Elige series, tipo de dato y años. Si las series se miden en lo mismo, las verás en el mismo eje; si no, usa «Índice» o «Variación» para compararlas.')}</p>
          <p><button type="button" className="btn btn--ghost" onClick={share}>{t('Copiar enlace a este gráfico')}</button> <span className="muted" role="status">{status}</span></p>
        </div>
      </section>
      <div className="wrap explorer"><Workbench key={key} initial={initial} variant="full" onStateChange={onStateChange} /></div>
    </>
  );
}
