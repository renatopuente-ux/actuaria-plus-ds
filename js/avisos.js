/* Aviso global. Dos reglas que no son negociables y una tercera que se
   olvida siempre.

   1. EL PAPEL ARIA DEPENDE DE LA GRAVEDAD. role="alert" interrumpe al
      lector de pantalla a mitad de frase; role="status" espera a que
      termine. Un error merece la interrupcion. Un «guardado» no: poner
      role="alert" a todo convierte cada confirmacion en un corte.

   2. SOLO SE DESVANECE SOLO SI ES UNA CONFIRMACION SIN ACCION. Si lleva
      boton dentro, o es un error, se queda hasta que el usuario cierre.
      WCAG 2.2.1 exige poder ampliar o desactivar un limite de tiempo, y
      nadie lee «no se pudo guardar el estudio» en cuatro segundos.

   3. EL TEMPORIZADOR SE PARA CON EL RATON ENCIMA Y CON EL FOCO DENTRO.
      Sin esto, el aviso se va justo cuando el usuario acerca el cursor
      para leerlo, o mientras tabula hacia su boton. */
(() => {
  const TIPOS = { ok: 'ok', info: 'info', aviso: 'aviso', error: 'error' };

  function pila() {
    let p = document.querySelector('.o-avisos');
    if (!p) {
      p = document.createElement('div');
      p.className = 'o-avisos';
      document.body.appendChild(p);
    }
    return p;
  }

  function avisar({ titulo, texto, tipo = 'info', accion, ms = 5000, destino } = {}) {
    const t = TIPOS[tipo] ? tipo : 'info';
    const grave = (t === 'error' || t === 'aviso');
    const el = document.createElement('div');
    el.className = `o-aviso o-aviso--${t}`;
    /* (1) */
    el.setAttribute('role', t === 'error' ? 'alert' : 'status');
    el.setAttribute('aria-live', t === 'error' ? 'assertive' : 'polite');

    const cuerpo = document.createElement('div');
    cuerpo.className = 'o-aviso__texto';
    if (titulo) {
      const h = document.createElement('strong');
      h.className = 'o-aviso__titulo';
      h.textContent = titulo;
      cuerpo.appendChild(h);
    }
    if (texto) cuerpo.appendChild(document.createTextNode(texto));
    el.appendChild(cuerpo);

    if (accion) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'a-btn a-btn--sm a-btn--fantasma';
      b.textContent = accion.texto;
      b.addEventListener('click', () => { accion.hacer?.(); cerrar(); });
      el.appendChild(b);
    }

    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'o-aviso__cerrar';
    x.setAttribute('aria-label', `Cerrar aviso${titulo ? ': ' + titulo : ''}`);
    x.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" '
                + 'stroke-width="2" stroke-linecap="round" aria-hidden="true">'
                + '<path d="M4 4l8 8M12 4l-8 8"/></svg>';
    x.addEventListener('click', cerrar);
    el.appendChild(x);

    let reloj = null;
    /* (2) El error y el que lleva accion NO se van solos. */
    const seVa = !grave && !accion;
    const arrancar = () => { if (seVa) reloj = setTimeout(cerrar, ms); };
    const parar    = () => { if (reloj) { clearTimeout(reloj); reloj = null; } };
    /* (3) */
    el.addEventListener('mouseenter', parar);
    el.addEventListener('mouseleave', arrancar);
    el.addEventListener('focusin',  parar);
    el.addEventListener('focusout', e => {
      if (!el.contains(e.relatedTarget)) arrancar();
    });

    function cerrar() {
      parar();
      el.remove();
      /* Devolver el foco: si el usuario estaba DENTRO del aviso y este
         desaparece, el foco se iria al <body> y el teclado se quedaria
         sin punto de partida. */
      if (destino && document.contains(destino)) destino.focus();
    }

    pila().appendChild(el);
    arrancar();
    return { cerrar, elemento: el };
  }

  window.avisar = avisar;
})();
