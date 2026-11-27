/* Campo numerico. Una sola delegacion en document, asi lo que se inyecte
   despues funciona sin registrar nada. */
(() => {
  const campo = b => b.parentElement.querySelector('input[type="number"]');

  const limites = i => ({
    min: i.min === '' ? -Infinity : Number(i.min),
    max: i.max === '' ?  Infinity : Number(i.max),
    paso: Number(i.step) || 1
  });

  /* Los botones se apagan al llegar al tope. Sin esto el usuario sigue
     pulsando contra un limite invisible y cree que el campo esta roto. */
  function sincronizar(caja) {
    const i = caja.querySelector('input[type="number"]');
    if (!i) return;
    const { min, max } = limites(i);
    const v = Number(i.value);
    const menos = caja.querySelector('[data-num="-"]');
    const mas   = caja.querySelector('[data-num="+"]');
    if (menos) menos.disabled = !(v > min);
    if (mas)   mas.disabled   = !(v < max);
  }

  function mover(caja, signo) {
    const i = caja.querySelector('input[type="number"]');
    if (!i || i.disabled) return;
    const { min, max, paso } = limites(i);
    const actual = i.value === '' ? 0 : Number(i.value);
    i.value = String(Math.min(max, Math.max(min, actual + signo * paso)));
    /* 'input' para que reaccione quien escuche, 'change' para formularios */
    i.dispatchEvent(new Event('input',  { bubbles: true }));
    i.dispatchEvent(new Event('change', { bubbles: true }));
    sincronizar(caja);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-num]');
    if (!b) return;
    e.preventDefault();
    mover(b.closest('.a-numero'), b.dataset.num === '+' ? 1 : -1);
    campo(b) && campo(b).focus();
  });

  document.addEventListener('input', e => {
    const caja = e.target.closest('.a-numero');
    if (caja) sincronizar(caja);
  });

  /* LA RUEDA NO TOCA EL VALOR.
     Con el cursor sobre un type=number, rodar la pagina cambia la cifra
     en silencio: una tasa de 2,75 pasa a 3,75 y nadie se entera hasta
     que el calculo sale mal. El navegador solo lo hace si el campo
     tiene el foco, asi que se lo quitamos y dejamos que la pagina siga
     rodando con normalidad. Pasivo no: hay que poder frenarlo. */
  document.addEventListener('wheel', e => {
    const i = e.target.closest('input[type="number"]');
    if (i && document.activeElement === i) i.blur();
  }, { passive: true });

  document.addEventListener('DOMContentLoaded',
    () => document.querySelectorAll('.a-numero').forEach(sincronizar));
  window.sincronizarNumeros = () => document.querySelectorAll('.a-numero').forEach(sincronizar);
})();
