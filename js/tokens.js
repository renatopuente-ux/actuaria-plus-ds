/* Resuelve y MIDE cada token en el navegador.

   El fuente no basta: --fill-info es un color-mix() y --sup-app apunta a
   otro token. Solo el navegador sabe en que acaban, asi que se pregunta
   al valor computado en vez de interpretar el CSS a mano. */
(() => {
  const sondeo = document.createElement('span');
  sondeo.style.cssText = 'position:absolute;left:-9999px;width:0;height:0';
  document.body.appendChild(sondeo);

  const resolver = (token, prop) => {
    sondeo.style.cssText = 'position:absolute;left:-9999px';
    sondeo.style.setProperty(prop, `var(${token})`);
    const v = getComputedStyle(sondeo)[prop];
    sondeo.style.removeProperty(prop);
    return v;
  };

  const aRGB = c => {
    const m = (c.match(/[\d.]+/g) || []).map(Number);
    if (!m.length) return null;
    return /^color\(/.test(c) ? m.slice(0, 3).map(x => x * 255) : m.slice(0, 3);
  };
  const lum = c => {
    const f = c.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
    return .2126 * f[0] + .7152 * f[1] + .0722 * f[2];
  };
  const ratio = (a, b) => {
    const x = lum(a), y = lum(b), hi = Math.max(x, y), lo = Math.min(x, y);
    return (hi + .05) / (lo + .05);
  };
  const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

  /* Contra que fondo se mide cada cosa. Un ratio sin su fondo no
     significa nada: el mismo naranja da 6.03 sobre blanco y 5.09 sobre
     la superficie de la app. */
  /* Se resuelven con la sonda, NO con getPropertyValue: --sup-app vale
     literalmente «var(--p-sup-1)», y pasarle eso al medidor daba NaN en
     las 38 filas de color. El valor declarado de un token no es su
     valor; solo el navegador lo resuelve. */
  const FONDO = {
    app:     resolver('--sup-app', 'color')     || '#E8ECF4',
    tarjeta: resolver('--sup-elevada', 'color') || '#FFFFFF',
    navy:    resolver('--p-navy', 'color')      || '#151F47'
  };
  const fondoDe = token =>
    /inverso|on-dark|naranja-soft/.test(token) ? ['navy', FONDO.navy] : ['app', FONDO.app];

  document.querySelectorAll('tr[data-token]').forEach(tr => {
    const token = tr.dataset.token, tipo = tr.dataset.tipo;
    const prop = tipo === 'color' ? 'color'
               : tipo === 'sombra' ? 'box-shadow'
               : tipo === 'texto' ? 'font'
               : tipo === 'movimiento' ? 'transition-duration' : 'width';
    const val = resolver(token, prop);
    tr.querySelector('.t-res').textContent = tipo === 'color' ? (aRGB(val) ? hex(aRGB(val)) : val) : val;

    if (tipo !== 'color') return;
    const c = aRGB(val); if (!c) return;
    const [nombreFondo, fondo] = fondoDe(token);
    const f = aRGB(fondo); if (!f) return;
    const r = ratio(c, f);

    /* SOLO SE JUZGA LO QUE TIENE UMBRAL.
         --txt-*   tiene que leerse            -> 4.5
         --fill-*  tiene que delimitarse       -> 1.3
         el resto  es materia prima, no un uso -> sin veredicto

       Medir --p-surface contra la superficie da 1.00, que no es un
       fallo: es el mismo color. Pintarlo en rojo llenaba la pagina de
       suspensos falsos, y un informe con rojos que no son problemas
       ensena a ignorar los rojos que si lo son. La cifra se sigue
       mostrando, porque el dato es util; lo que se retira es el juicio
       sobre quien no lo merece. */
    const esTexto  = /^--txt-/.test(token);
    const esRelleno = /^--fill-/.test(token);
    const td = tr.querySelector('.t-con');
    if (!esTexto && !esRelleno) {
      td.innerHTML = `<b class="neutro">${r.toFixed(2)}</b>`
                   + `<span class="t-fondo">sobre ${nombreFondo} \u00b7 informativo</span>`;
      return;
    }
    const minimo = esTexto ? 4.5 : 1.3;
    const pasa = r >= minimo;
    td.innerHTML = `<b class="${pasa ? 'ok' : 'mal'}">${r.toFixed(2)}</b>`
                 + `<span class="t-fondo">sobre ${nombreFondo} \u00b7 m\u00ednimo ${minimo}</span>`;
  });

  sondeo.remove();
})();
