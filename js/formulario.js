/* Segmentado y deslizador. Delegacion unica en document. */
(() => {

  /* ── Segmentado ────────────────────────────────────────────────────
     Un radiogroup de verdad: UNA sola parada de tabulador para todo el
     grupo y las flechas recorren las opciones. Una fila de botones
     normales obliga a tabular una vez por opcion, que con ocho filtros
     es un viaje de ocho pulsaciones para llegar al contenido. */
  const opciones = g => [...g.querySelectorAll('[role="radio"]')];

  function marcar(grupo, destino, moverFoco) {
    opciones(grupo).forEach(o => {
      const activo = o === destino;
      o.setAttribute('aria-checked', activo ? 'true' : 'false');
      /* tabindex rotatorio: solo el activo entra con el tabulador */
      o.tabIndex = activo ? 0 : -1;
    });
    if (moverFoco) destino.focus();
    grupo.dispatchEvent(new CustomEvent('cambio', {
      bubbles: true, detail: { valor: destino.dataset.valor ?? destino.textContent.trim() }
    }));
  }

  document.addEventListener('click', e => {
    const o = e.target.closest('.a-segmentado [role="radio"]');
    if (o) marcar(o.closest('.a-segmentado'), o, false);
  });

  document.addEventListener('keydown', e => {
    const o = e.target.closest('.a-segmentado [role="radio"]');
    if (!o) return;
    const g = o.closest('.a-segmentado'), lista = opciones(g), i = lista.indexOf(o);
    let j = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % lista.length;
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   j = (i - 1 + lista.length) % lista.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End')  j = lista.length - 1;
    if (j === null) return;
    e.preventDefault();
    marcar(g, lista[j], true);
  });

  /* ── Deslizador ────────────────────────────────────────────────────
     El relleno del recorrido no existe en CSS puro: hay que calcular el
     porcentaje y pasarlo como variable. Se recalcula en 'input' para
     que siga al dedo, no solo al soltar. */
  function pintar(r) {
    const min = Number(r.min || 0), max = Number(r.max || 100);
    const pct = max === min ? 0 : ((Number(r.value) - min) / (max - min)) * 100;
    r.style.setProperty('--relleno', pct + '%');
    const caja = r.closest('.a-deslizador');
    const salida = caja && caja.querySelector('.valor');
    if (salida) {
      const u = salida.dataset.unidad || '';
      /* El numero se formatea en es-ES: separador de miles y coma
         decimal. Un importe actuarial sin formatear es ilegible. */
      salida.textContent = Number(r.value).toLocaleString('es-ES') + (u ? ' ' + u : '');
    }
  }

  document.addEventListener('input', e => {
    if (e.target.matches('.a-deslizador input[type="range"]')) pintar(e.target);
  });

  const arrancar = raiz => {
    (raiz || document).querySelectorAll('.a-deslizador input[type="range"]').forEach(pintar);
    (raiz || document).querySelectorAll('.a-segmentado').forEach(g => {
      const act = opciones(g).find(o => o.getAttribute('aria-checked') === 'true') || opciones(g)[0];
      if (act) marcar(g, act, false);
    });
  };
  document.addEventListener('DOMContentLoaded', () => arrancar());
  window.arrancarFormulario = arrancar;
})();
