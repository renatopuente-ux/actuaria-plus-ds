/* Autocompletar y combobox. Un solo motor: el esqueleto ARIA es el
   mismo y solo cambia si el texto libre vale o no. */
(() => {
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  /* Resalta la coincidencia SIN usar innerHTML con texto del usuario:
     se construye con nodos, asi una opcion que contenga <script> o
     comillas no puede inyectar nada. */
  function pintarNombre(cel, texto, consulta) {
    cel.textContent = '';
    const i = consulta ? norm(texto).indexOf(norm(consulta)) : -1;
    if (i < 0) { cel.append(texto); return; }
    cel.append(texto.slice(0, i));
    const m = document.createElement('mark');
    m.textContent = texto.slice(i, i + consulta.length);
    cel.append(m, texto.slice(i + consulta.length));
  }

  const datos = c => {
    try { return JSON.parse(c.querySelector('[data-opciones]').textContent); }
    catch (e) { return []; }
  };

  function construir(c) {
    const campo = c.querySelector('.m-combo__campo');
    const lista = c.querySelector('.m-combo__lista');
    /* El aviso vive FUERA del .m-combo —es hermano, dentro del campo—
       porque una region viva no debe estar dentro de algo que se
       oculta: si el contenedor se marca hidden, el lector deja de
       anunciar. Se busca en el ancestro, no dentro. */
    const aviso = (c.closest('.m-campo') || c.parentElement || document)
                    .querySelector('[data-aviso]');
    const cerrado = c.classList.contains('m-combo--cerrado');
    let activo = -1, visibles = [];

    const abrir = () => { lista.hidden = false; campo.setAttribute('aria-expanded', 'true'); };
    const cerrar = () => {
      lista.hidden = true;
      campo.setAttribute('aria-expanded', 'false');
      campo.removeAttribute('aria-activedescendant');
      activo = -1;
    };

    function marcar(i) {
      [...lista.querySelectorAll('.m-combo__opcion')].forEach(o => o.classList.remove('activa'));
      activo = i;
      if (i < 0) { campo.removeAttribute('aria-activedescendant'); return; }
      const o = lista.querySelectorAll('.m-combo__opcion')[i];
      if (!o) return;
      o.classList.add('activa');
      campo.setAttribute('aria-activedescendant', o.id);
      /* block:'nearest' y no scrollIntoView() a secas: el segundo
         desplaza TAMBIEN la pagina y el campo se va de la vista. */
      o.scrollIntoView({ block: 'nearest' });
    }

    function filtrar() {
      const q = campo.value.trim();
      visibles = datos(c).filter(o => !q || norm(o.texto).includes(norm(q)));
      lista.textContent = '';
      if (!visibles.length) {
        const v = document.createElement('li');
        v.className = 'm-combo__vacio';
        v.textContent = q ? `Sin resultados para «${q}»` : 'Escribe para buscar';
        lista.append(v);
      } else {
        visibles.forEach((o, i) => {
          const li = document.createElement('li');
          li.className = 'm-combo__opcion';
          li.id = `${c.id}-op-${i}`;
          li.setAttribute('role', 'option');
          li.setAttribute('aria-selected', 'false');
          const n = document.createElement('span');
          pintarNombre(n, o.texto, q);
          li.append(n);
          if (o.nota) {
            const s = document.createElement('span');
            s.className = 'secundario'; s.textContent = o.nota;
            li.append(s);
          }
          li.addEventListener('mousedown', e => { e.preventDefault(); elegir(i); });
          lista.append(li);
        });
      }
      /* El recuento se anuncia por aria-live. Sin esto, quien usa
         lector no sabe si quedan 50 resultados o ninguno. */
      if (aviso) aviso.textContent = visibles.length
        ? `${visibles.length} resultado${visibles.length > 1 ? 's' : ''}`
        : 'Sin resultados';
      marcar(-1);
      abrir();
    }

    function elegir(i) {
      const o = visibles[i]; if (!o) return;
      campo.value = o.texto;
      campo.dataset.valor = o.valor ?? o.texto;
      /* Se guarda la ultima eleccion VALIDA aqui, no solo al salir del
         campo: sin esto, escribir basura despues de elegir revertia a
         vacio y el usuario perdia la seleccion que ya habia hecho. */
      campo.dataset.ultimo = o.texto;
      cerrar();
      c.dispatchEvent(new CustomEvent('elegido', { bubbles: true, detail: o }));
    }

    campo.addEventListener('input', filtrar);
    campo.addEventListener('focus', filtrar);

    campo.addEventListener('keydown', e => {
      const n = lista.querySelectorAll('.m-combo__opcion').length;
      if (e.key === 'ArrowDown') { e.preventDefault(); if (lista.hidden) filtrar(); if (n) marcar((activo + 1) % n); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) marcar((activo - 1 + n) % n); }
      else if (e.key === 'Home' && !lista.hidden) { e.preventDefault(); if (n) marcar(0); }
      else if (e.key === 'End' && !lista.hidden) { e.preventDefault(); if (n) marcar(n - 1); }
      else if (e.key === 'Enter') { if (activo >= 0) { e.preventDefault(); elegir(activo); } }
      else if (e.key === 'Escape') {
        /* Primera Escape cierra; segunda limpia. Cerrar y limpiar a la
           vez hace perder lo escrito de un golpe sin poder deshacerlo. */
        if (!lista.hidden) cerrar();
        else { campo.value = ''; delete campo.dataset.valor; }
      }
    });

    campo.addEventListener('blur', () => {
      /* En el cerrado, lo escrito a mano no vale: se revierte a la
         ultima eleccion, o se vacia. Dejarlo tal cual produce un valor
         que el formulario no sabe interpretar. */
      if (cerrado) {
        const ok = datos(c).some(o => norm(o.texto) === norm(campo.value.trim()));
        if (!ok) { campo.value = campo.dataset.ultimo || ''; }
        else campo.dataset.ultimo = campo.value;
      }
      cerrar();
    });

    document.addEventListener('click', e => { if (!c.contains(e.target)) cerrar(); });
    cerrar();
  }

  const arrancar = raiz => (raiz || document).querySelectorAll('.m-combo').forEach(construir);
  document.addEventListener('DOMContentLoaded', () => arrancar());
  window.arrancarCombos = arrancar;
})();
