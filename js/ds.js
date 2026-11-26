/* ═══════════════════════════════════════════════════════════════════════
   ACTUARIA+ DS · comportamiento
   Una sola delegacion en document: un componente nuevo no necesita JS
   propio, y lo que se inyecte despues funciona sin re-registrar nada.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  document.addEventListener('click', e => {
    /* grupos de seleccion: pestanas, segmentados, filtros */
    const opcion = e.target.closest('[data-grupo]');
    if (opcion) {
      const grupo = opcion.dataset.grupo;
      document.querySelectorAll(`[data-grupo="${grupo}"]`).forEach(o => {
        const activo = o === opcion;
        o.setAttribute('aria-pressed', activo);
        o.classList.toggle('activo', activo);
      });
    }

    /* capas: popover, menu, modal */
    const disparador = e.target.closest('[data-abre]');
    if (disparador) {
      const capa = document.getElementById(disparador.dataset.abre);
      if (capa) {
        const abierta = capa.hasAttribute('hidden');
        document.querySelectorAll('[data-capa]').forEach(c => c.setAttribute('hidden',''));
        if (abierta) capa.removeAttribute('hidden');
        disparador.setAttribute('aria-expanded', abierta);
      }
    }
    if (e.target.closest('[data-cierra]')) {
      e.target.closest('[data-capa]')?.setAttribute('hidden','');
    }
  });

  /* Esc cierra cualquier capa abierta */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('[data-capa]:not([hidden])').forEach(c => c.setAttribute('hidden',''));
    }
  });

  window.dsArrancar = () => {};   /* punto de extension para capas superiores */
})();
