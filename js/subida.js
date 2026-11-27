/* Subida de archivos. La zona es un area de destino; el boton es quien
   abre el dialogo. */
(() => {
  const MB = 1024 * 1024;

  /* Tamano en es-ES. «1.8 MB» con punto decimal es ingles y despista
     cuando el resto de la aplicacion usa coma. */
  const peso = b => b < 1024 ? `${b} B`
    : b < MB ? `${(b / 1024).toLocaleString('es-ES', { maximumFractionDigits: 0 })} KB`
    : `${(b / MB).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`;

  const ICONO = `<svg viewBox="0 0 20 20" width="18" height="18" fill="none"
    stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">
    <path d="M11.5 2.5H5.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V6.5z"/>
    <path d="M11.5 2.5v4h4"/></svg>`;

  function revisar(f, zona) {
    const maxMB = Number(zona.dataset.maxMb || 10);
    const tipos = (zona.dataset.tipos || '').split(',').map(s => s.trim()).filter(Boolean);
    if (f.size > maxMB * MB) return `Pesa ${peso(f.size)} y el máximo es ${maxMB} MB`;
    if (tipos.length) {
      const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
      if (!tipos.includes(ext)) return `Formato ${ext} no admitido`;
    }
    return null;
  }

  function pintar(zona, archivos) {
    const ul = zona.parentElement.querySelector('.m-archivos');
    if (!ul) return;
    ul.textContent = '';
    archivos.forEach((f, i) => {
      const err = revisar(f, zona);
      const li = document.createElement('li');
      li.className = 'm-archivo' + (err ? ' m-archivo--malo' : '');
      const ic = document.createElement('span');
      ic.className = 'm-archivo__icono'; ic.innerHTML = ICONO;
      const n = document.createElement('span');
      n.className = 'm-archivo__nombre'; n.textContent = f.name;
      const p = document.createElement('span');
      p.className = 'm-archivo__peso'; p.textContent = peso(f.size);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'a-icono a-icono--sm';
      b.setAttribute('aria-label', `Quitar ${f.name}`);
      b.innerHTML = `<svg viewBox="0 0 16 16" width="13" height="13" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8"/></svg>`;
      b.addEventListener('click', () => {
        archivos.splice(i, 1);
        pintar(zona, archivos);
        avisar(zona, `${f.name} quitado`);
      });
      li.append(ic, n, p, b);
      if (err) {
        const e = document.createElement('span');
        e.className = 'm-archivo__error'; e.textContent = err;
        li.append(e);
      }
      ul.append(li);
    });
  }

  const avisar = (zona, texto) => {
    const a = zona.parentElement.querySelector('[data-aviso]');
    if (a) a.textContent = texto;
  };

  function construir(zona) {
    const input = zona.querySelector('input[type="file"]');
    const lista = [];

    const anadir = fs => {
      [...fs].forEach(f => lista.push(f));
      pintar(zona, lista);
      const malos = lista.filter(f => revisar(f, zona)).length;
      avisar(zona, `${lista.length} archivo${lista.length === 1 ? '' : 's'}`
                 + (malos ? `, ${malos} con problemas` : ''));
    };

    input.addEventListener('change', () => { anadir(input.files); input.value = ''; });

    /* El boton se cablea aqui, no con onclick en el HTML: un manejador
       en linea no se puede auditar, no respeta la Content-Security-
       Policy y se pierde en cuanto el marcado se genera desde otro
       sitio. */
    const abrir = zona.querySelector('[data-abrir-archivo]');
    if (abrir) abrir.addEventListener('click', () => input.click());

    /* dragover hay que CANCELARLO o el navegador abre el archivo en una
       pestana y el usuario pierde el formulario entero. */
    ['dragenter', 'dragover'].forEach(ev =>
      zona.addEventListener(ev, e => { e.preventDefault(); zona.dataset.encima = 'si'; }));
    ['dragleave', 'drop'].forEach(ev =>
      zona.addEventListener(ev, e => { e.preventDefault(); delete zona.dataset.encima; }));
    zona.addEventListener('drop', e => { if (e.dataTransfer) anadir(e.dataTransfer.files); });
  }

  const arrancar = raiz => (raiz || document).querySelectorAll('.m-subida').forEach(construir);
  document.addEventListener('DOMContentLoaded', () => arrancar());
  window.arrancarSubidas = arrancar;
})();
