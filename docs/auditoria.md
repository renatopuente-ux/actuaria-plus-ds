# Auditoría del sistema

Motivo: dos defectos de sustrato llegaron a publicarse con el linter en
verde. La causa no fue que se escaparan por poco — fue que **la ley
estaba escrita y no tenía comprobación**.

## El hallazgo principal

De las 12 leyes, **dos no las vigilaba nadie**:

| Ley | Estado antes | Ahora |
|---|---|---|
| 5 · Opaco, nunca un tinte con alpha | sin comprobación | `alpha` |
| 6 · Se mide con WCAG 2 y con APCA | **sin comprobación** | `contraste` |

La 6 es la grave: el sistema entero presume de medir contraste, y cada
medida se había hecho **a mano, caso por caso**, en el momento de
diseñar el componente. Nada vigilaba las regresiones. Un cambio de
sustrato —y ha habido varios— podía dejar texto por debajo de 4.5 sin
que saltara nada.

Ahora `qa.js` mide cada elemento con texto contra **su sustrato real**
—el primer ancestro con fondo opaco, no la página— y reporta el Lc de
APCA junto al ratio WCAG.

## Lo que encontró al estrenarse

**Mi primera versión dio 215 fallos.** No eran del sistema: eran míos.
`getComputedStyle` no siempre devuelve `rgb()`. Cuando el valor viene
de un `color-mix()` —las franjas de tabla— Chrome serializa
`color(srgb 0.959412 0.966471 0.980588)`, con los canales **de 0 a 1**.
Leídos como 0–255, un gris casi blanco se convierte en casi negro.

Un validador así se ignora en dos días. Corregido el lector, quedan
0 fallos reales, y las trampas siguen cazándose.

## Lo que encontró la auditoría estática

`auditoria.py` mira lo que no se ve desde el navegador:

- **`.a-barra--ok` no existía.** La barra «completada» se pintaba azul.
  Se retira en vez de inventarla: medido contra la pista `#dbe0ea`,
  `success-500` da **1.67** y `success-700` **2.06**, por debajo del 3:1
  de WCAG 1.4.11. Oscurecer el verde lo prohíbe la ley 7. La señal de
  completado es el 100 % y el rótulo, no el tono.
- **`.t-cuenta` no existía.** Usada dos veces en la página de Tokens sin
  hacer nada.
- **Dos declaraciones muertas con alpha bajo texto**, ya tapadas por
  reglas posteriores. No fallaban hoy, pero habrían devuelto la
  infracción en cuanto alguien borrase la regla que las tapa.
- **22 colores escritos a mano** fuera de los tokens. Los que llevan
  alpha legítimo —el velo, las sombras flotantes, el brillo de carga—
  pasan a ser tokens (`--velo`, `--sombra-flotante`, `--sombra-globo`,
  `--brillo-carga`) para que alguien pueda revisarlos.

## Un punto ciego estructural de `qa.js`

`variante-fantasma` no cazó `.a-barra--ok` y no es un descuido: la
comprobación compara el estilo **del elemento**, y esa variante habría
pintado un **hijo**. Desde el navegador eso es difícil de ver.

La auditoría estática sí lo caza, leyendo el CSS. Son herramientas
complementarias, no redundantes:

- `auditoria.py` · lo que existe o no existe en el código
- `tokens-check.py` · `var()` que no resuelve
- `qa.js` · lo que se ve al pintar

## Antes de publicar

```bash
python auditoria.py     # cobertura de leyes, clases fantasma, colores a mano
python tokens-check.py  # var(--x) inexistente
python catalogo.py      # ds.json y llms.txt al día
python build.py         # sella los hashes
```

Y `qa.js` en las 8 páginas × 2 punteros.

Los cuatro salen con código 1 si algo falla, para que no haya que leer
la salida con cuidado.

## Lo que la auditoría NO cubre

Honestidad sobre los límites:

- **APCA se informa, no se exige.** El filtro sigue siendo WCAG 2, que
  es lo normativo. Cuando discrepen, hay que mirar el componente.
- **Las leyes 7, 8 y 11 no son automatizables del todo.** «Cambiar el
  texto y no la marca» o «elegir el nivel midiendo» son decisiones. Lo
  que sí se vigila es su consecuencia: ningún color a mano y ningún
  contraste por debajo del umbral.
- **El tema oscuro no existe todavía**, así que nada de esto está
  medido sobre fondo oscuro.
