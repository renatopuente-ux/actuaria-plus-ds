/* Pestanas. El acordeon no necesita JS: <details name> ya lo resuelve. */
(() => {
  const tabs = g => [...g.querySelectorAll('[role="tab"]')];

  function activar(grupo, destino, moverFoco) {
    tabs(grupo).forEach(t => {
      const on = t === destino;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      /* tabindex rotatorio: el grupo entero es UNA parada de tabulador.
         Con tabs normales, seis pestanas son seis pulsaciones antes de
         llegar al contenido. */
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (moverFoco) destino.focus();
  }

  function enfocar(grupo, t) {
    tabs(grupo).forEach(x => { x.tabIndex = x === t ? 0 : -1; });
    t.focus();
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('.m-pestanas [role="tab"]');
    if (t) activar(t.closest('.m-pestanas'), t, false);
  });

  document.addEventListener('keydown', e => {
    const t = e.target.closest('.m-pestanas [role="tab"]');
    if (!t) return;
    const g = t.closest('.m-pestanas');
    const manual = g.dataset.activacion === 'manual';
    const lista = tabs(g), i = lista.indexOf(t);

    if (e.key === 'Enter' || e.key === ' ') {
      if (manual) { e.preventDefault(); activar(g, t, true); }
      return;
    }
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % lista.length;
    if (e.key === 'ArrowLeft')  j = (i - 1 + lista.length) % lista.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End')  j = lista.length - 1;
    if (j === null) return;
    e.preventDefault();
    /* Automatica: la flecha cambia de panel, que es lo mas rapido
       cuando el contenido ya esta cargado. Manual: la flecha solo mueve
       el foco, porque si cambiar de pestana dispara un recalculo, la
       automatica lanzaria uno por cada flecha de paso. */
    if (manual) enfocar(g, lista[j]);
    else activar(g, lista[j], true);
  });

  const arrancar = raiz => (raiz || document).querySelectorAll('.m-pestanas').forEach(g => {
    const act = tabs(g).find(t => t.getAttribute('aria-selected') === 'true') || tabs(g)[0];
    if (act) activar(g, act, false);
  });
  document.addEventListener('DOMContentLoaded', () => arrancar());
  window.arrancarPestanas = arrancar;
})();
