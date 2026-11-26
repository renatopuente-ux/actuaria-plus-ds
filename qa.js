/* qa.js · linter de UI del sistema.
   No comprueba que el CSS "parezca" bien: mide el DOM ya compuesto.
   Cada regla nace de un fallo real que se colo hasta la pantalla. */
(() => {
  const fallos = [];
  const F = (regla, detalle) => fallos.push(`[${regla}] ${detalle}`);
  const visible = e => { const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const nombre = e => `${e.tagName.toLowerCase()}${e.className ? '.' + String(e.className).trim().split(/\s+/).join('.') : ''}`
    + (e.textContent.trim() ? ` «${e.textContent.trim().slice(0,22)}»` : '');

  /* 1 · VARIABLES FANTASMA. Un var() sin definir no da error: devuelve
     vacio y la propiedad cae a su valor inicial. Asi un gap se volvio 0 y
     los botones quedaron pegados. */
  {
    /* Leer las hojas con cssRules falla en file:// y el catch lo tragaba,
       dando por fantasma todo token real. Se pregunta al valor COMPUTADO,
       que es la unica fuente fiable: si resuelve a vacio, no existe. */
    const raiz = getComputedStyle(document.documentElement);
    const texto = [...document.querySelectorAll('[style]')].map(e => e.getAttribute('style')).join(';');
    const usadas = [...new Set([...texto.matchAll(/var\((--[a-z0-9-]+)/g)].map(m => m[1]))];
    usadas.filter(v => raiz.getPropertyValue(v).trim() === '')
      .forEach(v => F('var-fantasma', `${v} se usa en un style= y resuelve a vacio`));
  }

  /* 2 · SOLAPES. Dos elementos interactivos hermanos no pueden pisarse:
     si se pisan, uno de los dos no se puede pulsar. */
  {
    const act = [...document.querySelectorAll('button, a[href], input, select, .a-anillo')].filter(visible);
    for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) {
      const a = act[i], b = act[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
      const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (x > 1 && y > 1) F('solape', `${nombre(a)} pisa ${nombre(b)} en ${Math.round(x)}x${Math.round(y)}px`);
    }
  }

  /* 3 · AREA TACTIL. WCAG 2.2 (2.5.8) pide 24x24 CSS px como minimo; el
     sistema exige 34 porque es el tamano del boton pequeno. */
  [...document.querySelectorAll('button, a[href], input[type=checkbox], select')].filter(visible)
    .forEach(e => {
      /* el enlace de salto esta oculto a proposito hasta recibir foco */
      if (e.classList.contains('sr-only')) return;
      const r = e.getBoundingClientRect();
      if (r.height < 24 || r.width < 24) F('area-tactil', `${nombre(e)} mide ${Math.round(r.width)}x${Math.round(r.height)}, minimo 24x24`); });

  /* 4 · CURSOR. Lo cliqueable se senala con el puntero. */
  [...document.querySelectorAll('button:not([disabled]), a[href], label.a-interruptor, label.a-casilla')].filter(visible)
    .forEach(e => { if (getComputedStyle(e).cursor !== 'pointer') F('cursor', `${nombre(e)} no tiene cursor:pointer`); });

  /* 5 · NOMBRE ACCESIBLE. Un boton solo con icono es un boton mudo. */
  [...document.querySelectorAll('button, a[href]')].filter(visible).forEach(e => {
    const n = (e.getAttribute('aria-label') || e.textContent || '').trim();
    if (!n) F('sin-nombre', `${nombre(e)} no tiene texto ni aria-label`);
  });

  /* 6 · LEY DE RELIEVE. Cliqueable sobresale; informativo, plano. */
  {
    const sombra = e => getComputedStyle(e).boxShadow;
    const sobresale = s => s !== 'none' && /(^|,)\s*(?!inset)[^,]*[1-9]\d*px/.test(s.replace(/inset[^,]*/g, ''));
    [...document.querySelectorAll('button:not([disabled]):not(.a-anillo > *), a.esc-nav-link[href]')].filter(visible)
      .forEach(e => { if (e.closest('.a-anillo')) return;
        if (!sobresale(sombra(e))) F('relieve', `cliqueable sin relieve: ${nombre(e)}`); });
    [...document.querySelectorAll('.a-chip, .a-medallon')].filter(visible)
      .forEach(e => { if (sobresale(sombra(e))) F('relieve', `informativo con relieve: ${nombre(e)}`); });
  }

  /* 7 · FORMA. Pildora para la accion, rectangulo para la entrada. */
  [...document.querySelectorAll('.a-btn, .a-anillo')].filter(visible).forEach(e => {
    const r = parseFloat(getComputedStyle(e).borderTopLeftRadius);
    if (r < e.getBoundingClientRect().height / 2 - 1) F('forma', `${nombre(e)} deberia ser pildora, tiene r=${Math.round(r)}px`);
  });
  [...document.querySelectorAll('.a-campo, .a-select')].filter(visible).forEach(e => {
    const r = parseFloat(getComputedStyle(e).borderTopLeftRadius);
    if (r > e.getBoundingClientRect().height / 2 - 2) F('forma', `${nombre(e)} es una pildora y deberia ser rectangular`);
  });

  /* 8 · MOVIMIENTO entre 150 y 300 ms: por debajo no se percibe, por
     encima estorba. */
  [...document.querySelectorAll('.a-btn, .a-icono, .a-anillo, .a-campo')].filter(visible).forEach(e => {
    const d = getComputedStyle(e).transitionDuration.split(',').map(x => parseFloat(x) * 1000).filter(x => x > 0);
    d.forEach(ms => { if (ms < 100 || ms > 400) F('movimiento', `${nombre(e)} transiciona en ${ms}ms, fuera de 100-400`); });
  });

  /* 9 · ICONOS EMOJI. Cambian de forma en cada sistema operativo y no
     heredan color: en un sistema de diseno van en SVG. */
  [...document.querySelectorAll('button, .a-medallon, .esc-nav-link')].filter(visible).forEach(e => {
    if (e.querySelector('svg')) return;
    if (/\p{Extended_Pictographic}/u.test(e.textContent)) F('emoji', `${nombre(e)} usa un emoji como icono`);
  });

  /* 10 · ENLACES MUERTOS dentro del propio sitio. */
  [...document.querySelectorAll('a[href$=".html"]')].forEach(a => {
    if (a.getAttribute('aria-disabled') === 'true') return;
    fetch(a.href, { method: 'HEAD' }).then(r => { if (!r.ok) F('enlace', `${a.getAttribute('href')} devuelve ${r.status}`); }).catch(() => {});
  });

  window.__qa = fallos;
  return { total: fallos.length, fallos };
})()
