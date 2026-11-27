/* Calendario. Tres trampas de fechas en JavaScript, las tres cazadas
   aqui porque las tres producen un bug que solo aparece ciertos dias
   del ano —y por eso llega a produccion.

   1. DESBORDAMIENTO DE setMonth. new Date(2026,0,31).setMonth(1) NO da
      28 de febrero: da el 3 de MARZO, porque el 31 de febrero no
      existe y el motor sigue contando. Pulsar «mes siguiente» desde el
      31 de enero se saltaria febrero entero. Se arregla poniendo el
      dia a 1 ANTES de cambiar de mes y recortando despues.

   2. toISOString DEVUELVE OTRO DIA. Convierte a UTC, asi que a las
      00:00 en hora peninsular retrocede al dia anterior. MEDIDO con el
      huso de Madrid: new Date(2027,5,15).toISOString() da 2027-06-14.
      Un dia entero de diferencia en la fecha de valuacion. La fecha se
      formatea a mano con los getters locales.

   3. SUMAR 24 HORAS EN MILISEGUNDOS SE DESVIA CON EL CAMBIO DE HORA.
      MEDIDO en Madrid, partiendo del 29 de octubre de 2027 y sumando
      86400000 ms cuatro veces:
          30/10 00:00 · 31/10 00:00 · 31/10 23:00 · 1/11 23:00
      A partir del cambio se queda UNA HORA CORTO, y en cuanto esa hora
      cruza la medianoche el dia es el anterior: donde deberia poner 1
      de noviembre pone 31 de octubre.
      En primavera el dia aguanta pero la hora queda en 01:00, asi que
      dos fechas que deberian ser el mismo instante se comparan como
      distintas y «este es el dia elegido» falla en silencio.
      setDate(getDate()+1) cuenta por calendario, no por duracion, y no
      tiene ninguno de los dos problemas. */
(() => {
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio',
                 'agosto','septiembre','octubre','noviembre','diciembre'];
  const DIAS  = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
  const INI   = ['L','M','X','J','V','S','D'];

  const clave = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-`
                   + `${String(d.getDate()).padStart(2,'0')}`;          /* (2) */
  const leer  = s => { const [a,m,d] = s.split('-').map(Number);
                       return new Date(a, m-1, d); };
  const largo = d => `${DIAS[(d.getDay()+6)%7]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  const mismo = (a,b) => a && b && clave(a) === clave(b);

  /* (1) Mover de mes sin desbordar: dia a 1, cambio, y recorte al
     ultimo dia real del mes de destino. */
  function moverMes(d, n) {
    const y = new Date(d.getFullYear(), d.getMonth(), 1);
    y.setMonth(y.getMonth() + n);
    const ultimo = new Date(y.getFullYear(), y.getMonth() + 1, 0).getDate();
    y.setDate(Math.min(d.getDate(), ultimo));
    return y;
  }
  /* (3) Por calendario, nunca por milisegundos. */
  const moverDia = (d, n) => { const y = new Date(d); y.setDate(y.getDate() + n); return y; };

  function montar(c) {
    const campo   = document.getElementById(c.dataset.campo) || null;
    const rejilla = c.querySelector('.m-cal__rejilla');
    const rotulo  = c.querySelector('.m-cal__mes');
    const aviso   = c.querySelector('[data-aviso]');
    const min = c.dataset.min ? leer(c.dataset.min) : null;
    const max = c.dataset.max ? leer(c.dataset.max) : null;
    const hoy = new Date(); hoy.setHours(0,0,0,0);

    let elegida = c.dataset.valor ? leer(c.dataset.valor) : null;
    let foco    = elegida ? new Date(elegida) : new Date(hoy);
    let vista   = new Date(foco.getFullYear(), foco.getMonth(), 1);

    const fuera = d => (min && d < min) || (max && d > max);

    function pintar(anunciarMes) {
      rotulo.textContent = `${MESES[vista.getMonth()]} de ${vista.getFullYear()}`;
      rejilla.innerHTML = '';

      /* Lunes primero: en Espana la semana no empieza en domingo. */
      const primero = new Date(vista.getFullYear(), vista.getMonth(), 1);
      const hueco   = (primero.getDay() + 6) % 7;
      const dias    = new Date(vista.getFullYear(), vista.getMonth()+1, 0).getDate();
      const celdas  = Math.ceil((hueco + dias) / 7) * 7;

      for (let i = 0; i < celdas; i++) {
        const d = new Date(vista.getFullYear(), vista.getMonth(), i - hueco + 1);
        const delMes = d.getMonth() === vista.getMonth();
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'm-cal__dia';
        b.setAttribute('role', 'gridcell');
        b.textContent = d.getDate();
        /* Nombre completo: «14» a secas no dice nada al oirlo suelto. */
        b.setAttribute('aria-label', largo(d));
        if (!delMes) b.dataset.otroMes = 'si';
        if (mismo(d, hoy)) b.setAttribute('aria-current', 'date');
        if (mismo(d, elegida)) b.setAttribute('aria-selected', 'true');
        else b.setAttribute('aria-selected', 'false');
        if (fuera(d)) { b.setAttribute('aria-disabled', 'true'); b.tabIndex = -1; }
        else b.tabIndex = mismo(d, foco) ? 0 : -1;
        b.dataset.fecha = clave(d);
        rejilla.appendChild(b);
      }
      /* Si el dia con foco cayo fuera de la vista —al cambiar de mes—
         la rejilla se quedaria SIN parada de tabulador. */
      if (!rejilla.querySelector('[tabindex="0"]')) {
        const libre = [...rejilla.querySelectorAll('.m-cal__dia')]
          .find(b => b.getAttribute('aria-disabled') !== 'true' && !b.dataset.otroMes);
        if (libre) libre.tabIndex = 0;
      }
      if (anunciarMes && aviso) aviso.textContent = rotulo.textContent;
    }

    function irA(d, mover) {
      foco = d;
      if (d.getMonth() !== vista.getMonth() || d.getFullYear() !== vista.getFullYear()) {
        vista = new Date(d.getFullYear(), d.getMonth(), 1);
        pintar(true);
      } else pintar(false);
      if (mover) rejilla.querySelector(`[data-fecha="${clave(d)}"]`)?.focus();
    }

    function elegir(d) {
      if (fuera(d)) return;
      elegida = d; foco = d; pintar(false);
      rejilla.querySelector(`[data-fecha="${clave(d)}"]`)?.focus();
      if (campo) campo.value = `${String(d.getDate()).padStart(2,'0')}/`
                             + `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      if (aviso) aviso.textContent = `Seleccionado ${largo(d)}`;
      c.dispatchEvent(new CustomEvent('cal:elegido', { detail: { fecha: clave(d) }, bubbles: true }));
    }

    c.querySelector('[data-mes="-1"]').addEventListener('click', () => { vista = moverMes(vista,-1); foco = new Date(vista); pintar(true); });
    c.querySelector('[data-mes="1"]') .addEventListener('click', () => { vista = moverMes(vista, 1); foco = new Date(vista); pintar(true); });

    rejilla.addEventListener('click', e => {
      const b = e.target.closest('.m-cal__dia'); if (!b) return;
      if (b.getAttribute('aria-disabled') === 'true') return;
      elegir(leer(b.dataset.fecha));
    });

    rejilla.addEventListener('keydown', e => {
      const b = e.target.closest('.m-cal__dia'); if (!b) return;
      const d = leer(b.dataset.fecha);
      let n = null;
      if (e.key === 'ArrowRight') n = moverDia(d, 1);
      if (e.key === 'ArrowLeft')  n = moverDia(d,-1);
      if (e.key === 'ArrowDown')  n = moverDia(d, 7);
      if (e.key === 'ArrowUp')    n = moverDia(d,-7);
      if (e.key === 'Home')       n = moverDia(d, -((d.getDay()+6)%7));
      if (e.key === 'End')        n = moverDia(d, 6-((d.getDay()+6)%7));
      if (e.key === 'PageUp')     n = moverMes(d, e.shiftKey ? -12 : -1);
      if (e.key === 'PageDown')   n = moverMes(d, e.shiftKey ?  12 :  1);
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(d); return; }
      if (!n) return;
      e.preventDefault(); irA(n, true);
    });

    pintar(false);
  }

  const arrancar = r => (r || document).querySelectorAll('.m-cal').forEach(montar);
  document.addEventListener('DOMContentLoaded', () => arrancar());
  window.arrancarCalendarios = arrancar;
})();
