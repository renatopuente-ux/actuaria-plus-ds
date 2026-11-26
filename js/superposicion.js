/* superposicion.js · lo minimo que el navegador NO resuelve solo.
   Todo lo demas (foco atrapado, Escape, capa superior, fondo inerte,
   cierre al pulsar fuera) lo dan <dialog> y [popover] de serie. */
(() => {
  'use strict';

  /* 1 · DEVOLVER EL FOCO AL DISPARADOR.
     <dialog> mueve el foco dentro al abrir y lo devuelve al cerrar SI el
     dialogo se abrio desde un elemento enfocado. Cuando se abre por
     teclado global o por codigo, no hay a quien devolverlo, y el foco cae
     al principio de la pagina. Se guarda explicitamente. */
  const abrir = (dlg, disparador) => {
    dlg.__volverA = disparador || document.activeElement;
    dlg.showModal();
    /* A DONDE VA EL FOCO. El primer enfocable suele ser la X de cerrar, y
       dejar ahi el foco hace que lo primero que ofrece el teclado sea
       salir. Orden de preferencia:
         1. lo marcado con autofocus (en un dialogo destructivo, la opcion
            SEGURA: nunca la que borra)
         2. el primer control que no sea el de cerrar
         3. el propio dialogo, para que el lector lea titulo y cuerpo */
    const marcado = dlg.querySelector('[autofocus]');
    const utiles = [...dlg.querySelectorAll('input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])')]
      .filter(e => !e.hasAttribute('data-cierra') && !/cerrar/i.test(e.getAttribute('aria-label') || ''));
    (marcado || utiles[0] || dlg).focus();
  };
  const alCerrar = e => {
    const v = e.target.__volverA;
    if (v && document.contains(v)) v.focus();
  };

  document.querySelectorAll('dialog').forEach(d => d.addEventListener('close', alCerrar));

  document.addEventListener('click', e => {
    const ab = e.target.closest('[data-abre]');
    if (ab) {
      const d = document.getElementById(ab.dataset.abre);
      if (d) { abrir(d, ab); return; }
    }
    const ce = e.target.closest('[data-cierra]');
    if (ce) {
      const d = ce.closest('dialog') || document.getElementById(ce.dataset.cierra);
      if (d) d.close(ce.dataset.cierra || 'cerrar');
    }
  });

  /* 2 · RECORRER EL MENU CON FLECHAS.
     [popover] abre y cierra, pero no mueve el foco entre opciones. Sin
     esto el menu se abre y el teclado se queda fuera. */
  document.querySelectorAll('.s-menu').forEach(menu => {
    menu.addEventListener('keydown', e => {
      const ops = [...menu.querySelectorAll('.s-menu__opcion:not([aria-disabled="true"])')];
      if (!ops.length) return;
      const i = ops.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); ops[(i + 1) % ops.length].focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); ops[(i - 1 + ops.length) % ops.length].focus(); }
      if (e.key === 'Home')      { e.preventDefault(); ops[0].focus(); }
      if (e.key === 'End')       { e.preventDefault(); ops[ops.length - 1].focus(); }
    });
    menu.addEventListener('toggle', e => {
      if (e.newState !== 'open') return;
      const p = menu.querySelector('.s-menu__opcion:not([aria-disabled="true"])');
      if (p) p.focus();
    });
  });

  /* 3 · ANCLAR el flotante a su disparador. */
  const anclar = (flotante, disp) => {
    const r = disp.getBoundingClientRect();
    flotante.style.top = `${r.bottom + window.scrollY + 6}px`;
    flotante.style.left = `${Math.min(r.left + window.scrollX, innerWidth - flotante.offsetWidth - 12)}px`;
  };
  document.querySelectorAll('[popovertarget]').forEach(disp => {
    const f = document.getElementById(disp.getAttribute('popovertarget'));
    if (!f) return;
    f.addEventListener('toggle', e => { if (e.newState === 'open') anclar(f, disp); });
  });

  /* 4 · PALETA DE COMANDOS. El atajo tiene ademas un boton visible: un
     atajo que no se ve no existe para quien no lo conoce. */
  const paleta = document.getElementById('paleta-comandos');
  /* Comprobacion defensiva: si el id choca con otra cosa, getElementById
     devuelve el primero del documento y el cableado falla EN SILENCIO.
     Paso justo con id="paleta", que era tambien el ancla de su ficha. */
  if (paleta && paleta.tagName === 'DIALOG') {
    const campo = paleta.querySelector('input');
    const lista = paleta.querySelector('.s-paleta__lista');
    const vacio = paleta.querySelector('.s-paleta__vacio');
    const items = [...lista.querySelectorAll('li')];
    addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        paleta.open ? paleta.close() : abrir(paleta, document.activeElement);
      }
    });
    campo?.addEventListener('input', () => {
      const q = campo.value.trim().toLowerCase();
      let n = 0;
      items.forEach(li => {
        const ok = !q || li.textContent.toLowerCase().includes(q);
        li.hidden = !ok; if (ok) n++;
      });
      /* Un buscador sin resultados nunca se queda en blanco */
      if (vacio) vacio.hidden = n > 0;
    });
  }
})();
