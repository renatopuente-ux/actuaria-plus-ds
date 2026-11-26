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

  /* 2 · ALCANZABILIDAD. La pregunta util no es si dos cajas se tocan
     —un boton de limpiar vive DENTRO de su campo a proposito— sino si
     cada elemento interactivo recibe de verdad el clic. Se le pregunta al
     navegador con elementFromPoint en el centro del elemento: si quien
     responde no es el ni un descendiente suyo, hay algo tapandolo. */
  {
    const act = [...document.querySelectorAll('button:not([disabled]), a[href], input, select, textarea')]
      .filter(visible).filter(e => !e.classList.contains('sr-only'));
    act.forEach(e => {
      const r = e.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return;
      const arriba = document.elementFromPoint(cx, cy);
      if (!arriba) return;
      if (arriba === e || e.contains(arriba) || arriba.contains(e)) return;
      /* una etiqueta que envuelve a su control no lo tapa: lo reenvia */
      if (arriba.closest('label') && arriba.closest('label').contains(e)) return;
      F('tapado', `${nombre(e)} no recibe el clic en su centro: lo intercepta ${nombre(arriba)}`);
    });
  }

  /* 2b · IDENTIFICADORES REPETIDOS. getElementById devuelve el PRIMERO
     del documento, asi que un id duplicado deja el cableado de JS
     apuntando al elemento equivocado sin lanzar ningun error. Tambien
     rompe aria-labelledby y aria-describedby, que resuelven igual. */
  {
    const cuenta = {};
    document.querySelectorAll('[id]').forEach(e => { cuenta[e.id] = (cuenta[e.id] || 0) + 1; });
    Object.entries(cuenta).filter(([, n]) => n > 1)
      .forEach(([id, n]) => F('id-repetido', `«${id}» aparece ${n} veces`));
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
    /* Separar la lista de sombras por comas SIN romper los rgb(), y mirar
       cada entrada entera: 'inset' aparece al FINAL de la suya, asi que
       recortar desde la palabra dejaba vivos sus desplazamientos y daba
       por saliente una sombra hundida. */
    const entradas = s => {
      const out = []; let nivel = 0, act = '';
      for (const ch of s) {
        if (ch === '(') nivel++;
        if (ch === ')') nivel--;
        if (ch === ',' && nivel === 0) { out.push(act); act = ''; } else act += ch;
      }
      if (act.trim()) out.push(act);
      return out;
    };
    const sobresale = s => s !== 'none' &&
      entradas(s).some(x => !/\binset\b/.test(x) && /[1-9]\d*px/.test(x));
    /* Un cliqueable tiene DOS formas legitimas:
         en reposo   -> relieve, sobresale
         pulsado     -> hundido, inset
       Lo prohibido es plano del todo. Y el hundido solo vale si el
       elemento ESTA en ese estado: un filtro apagado y hundido mentiria
       igual que uno plano. */
    const hundido = e => { const s = sombra(e);
      return s !== 'none' && entradas(s).some(x => /\binset\b/.test(x) && /[1-9]\d*px/.test(x)); };
    const pulsado = e =>
      e.getAttribute('aria-pressed') === 'true' ||
      e.hasAttribute('aria-current') ||
      !!e.closest('[aria-sort]') ||
      e.matches(':active');
    [...document.querySelectorAll('button:not([disabled]), a.esc-nav-link[href]')].filter(visible)
      .forEach(e => {
        if (e.closest('.a-anillo')) return;            /* la sombra la lleva el anillo */
        if (sobresale(sombra(e))) return;              /* en reposo, correcto */
        if (hundido(e) && pulsado(e)) return;          /* pulsado, correcto */
        if (hundido(e)) { F('relieve', `hundido sin estar activo: ${nombre(e)}`); return; }
        F('relieve', `cliqueable sin relieve: ${nombre(e)}`);
      });
    /* GENERALIZADO: no basta con vigilar dos clases conocidas. Cualquier
       elemento con relieve que NO se pueda pulsar miente, y el usuario lo
       intenta y cree que esta roto. Ya ha pasado con el icono informativo
       y con los pasos del asistente. */
    const interactivo = e =>
      e.matches('button, a[href], input, select, textarea, summary, [role=button], [role=link], [tabindex]:not([tabindex="-1"])') ||
      !!e.closest('button, a[href], label') ||
      !!e.querySelector('button, a[href], input, select, textarea');
    [...document.querySelectorAll('.lienzo *, .m-kpi, .ficha > *')].filter(visible)
      .forEach(e => {
        if (interactivo(e)) return;
        if (e.dataset.superficie === 'contenedor') return;   /* tarjetas y paneles, declarados */
        if (sobresale(sombra(e))) F('relieve', `no se puede pulsar pero tiene relieve: ${nombre(e)}`);
      });
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

  /* 8 · MOVIMIENTO. No se impone un corte universal de duracion: la pauta
     correcta es que el tiempo salga de un TOKEN compartido, elegido por
     distancia y complejidad, no de un numero suelto en cada regla. Lo que
     si es universal: respetar reduced-motion y animar solo propiedades
     compuestas. */
  {
    const tokens = new Set(['--mov-rapido', '--mov-medio', '--mov-lento']
      .map(t => getComputedStyle(document.documentElement).getPropertyValue(t).trim())
      .filter(Boolean).map(v => parseFloat(v) * (v.includes('ms') ? 1 : 1000)));
    /* Con reduced-motion activo TODA duracion cae a 0.01ms a proposito:
       exigir ahi el token convierte el acierto en 29 fallos. */
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    [...document.querySelectorAll('.a-btn, .a-icono, .a-anillo, .a-campo')].filter(visible).forEach(e => {
      const cs = getComputedStyle(e);
      if (!rm) cs.transitionDuration.split(',').map(x => parseFloat(x) * 1000).filter(x => x > 0)
        .forEach(ms => { if (tokens.size && !tokens.has(ms)) F('movimiento', `${nombre(e)} usa ${ms}ms, que no es un token de movimiento`); });
      /* solo transform y opacity llegan al compositor; animar width, height,
         top o left obliga a recalcular la maquetacion en cada fotograma */
      cs.transitionProperty.split(',').map(s => s.trim()).forEach(prop => {
        if (/^(width|height|top|left|right|bottom|margin|padding)/.test(prop))
          F('movimiento', `${nombre(e)} anima ${prop}, que provoca reflujo`);
      });
    });
    /* NO se lee cssRules: en file:// toda hoja enlazada lanza excepcion y
       el catch daba por ausente lo que si estaba. Se comprueba el
       COMPORTAMIENTO: si el navegador emula reduced-motion, la duracion
       real tiene que desplomarse. La prueba la dispara el runner. */
    if (window.__qaReducedMotion === 'activa') {
      const e = document.querySelector('.a-btn');
      const ms = parseFloat(getComputedStyle(e).transitionDuration) * 1000;
      if (ms > 50) F('movimiento', `con reduced-motion activo la transicion sigue en ${ms}ms`);
    }
  }

  /* 8b · ENTRADA A 16PX, SOLO EN PUNTERO GRUESO. El zoom automatico de
     iOS al enfocar un campo de menos de 16px solo ocurre en dispositivos
     tactiles. Exigirlo en escritorio roba densidad sin dar nada, y esta
     plataforma esta construida para escritorio.
     Se condiciona al puntero y no al ancho porque un iPad en horizontal
     mide 1024px y sigue haciendo zoom. */
  if (matchMedia('(pointer: coarse)').matches) {
    [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]), select, textarea')]
      .filter(visible).forEach(e => {
        const px = parseFloat(getComputedStyle(e).fontSize);
        if (px < 16) F('entrada-16px', `${nombre(e)} tiene ${px}px, iOS hara zoom al enfocarlo`);
      });
    /* y con el dedo, 44px de alto minimo */
    [...document.querySelectorAll('button:not([disabled]), a[href], select')].filter(visible)
      .forEach(e => { if (e.classList.contains('sr-only')) return;
        const h = e.getBoundingClientRect().height;
        if (h < 44) F('tactil-44', `${nombre(e)} mide ${Math.round(h)}px de alto, minimo 44 con el dedo`); });
  }

  /* 8c · MEDIDA DE LINEA. Por encima de 80 caracteres el ojo pierde el
     renglon al volver a la izquierda. */
  [...document.querySelectorAll('p, li')].filter(visible).forEach(e => {
    if (e.children.length > 2 || !e.textContent.trim()) return;
    /* Medir con la unidad ch REAL del elemento, no con fontSize*0.5: el
       ancho del cero depende de la fuente y la estimacion se desvia un
       30% en Prompt, inventando fallos que no existen. */
    const sonda = document.createElement('span');
    sonda.style.cssText = 'position:absolute;visibility:hidden;width:1ch';
    e.appendChild(sonda);
    const anchoCh = sonda.getBoundingClientRect().width;
    sonda.remove();
    if (!anchoCh) return;
    const ch = e.getBoundingClientRect().width / anchoCh;
    if (ch > 80) F('medida', `${nombre(e)} mide ${Math.round(ch)} caracteres, maximo 80`);
  });

  /* 8d · CADENAS DE METADATOS unidas con punto medio: plantilla reconocible
     que aparece sea cual sea el contenido. Mejor prosa corta. */
  [...document.querySelectorAll('.pie, p, li, figcaption')].filter(visible).forEach(e => {
    if ((e.textContent.match(/\s·\s/g) || []).length >= 2)
      F('plantilla', `${nombre(e)} encadena metadatos con punto medio`);
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
