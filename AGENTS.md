# Actuaria DS 27 · instrucciones para agentes

Sistema de diseño de **Actuaria+**, en Atomic Design. Si vas a escribir
interfaz para este producto, lee esto antes de generar una sola línea.

- Catálogo legible por máquina: [`ds.json`](https://renatopuente-ux.github.io/actuaria-plus-ds/ds.json) — 56 componentes, 96 tokens, 12 leyes
- Índice corto: [`llms.txt`](https://renatopuente-ux.github.io/actuaria-plus-ds/llms.txt)
- Documentación navegable: https://renatopuente-ux.github.io/actuaria-plus-ds/

## Lo primero: no inventes

- Si un color, fuente o valor no aparece en tokens.json o en /brand, NO es de marca: no lo inventes.
- RELIEVE = se puede pulsar · HUNDIDO = pulsado o activo · PLANO = informativo.
- Los rellenos son opacos: nada de alpha, porque el contraste tiene que poder calcularse.
- Titulos en Lemon Milk en mayusculas (respaldo Nunito Black); cuerpo en Prompt Regular.
- Naranja sobre navy: usar #FFBBA1 para cumplir AA; nunca #DF5E2D puro como texto sobre navy.
- El naranja no vale como relleno con texto pequeno encima: con blanco da 3.64.
- La plataforma es de escritorio; lo tactil se adapta con pointer: coarse, nunca por ancho.

Cuando dudes, el orden de autoridad es:

1. La decisión del equipo de Actuaria
2. El brandbook de Actuaria
3. Las guías externas de UI/UX

Si necesitas un valor que no existe, **no lo inventes: dilo**. Un hex
nuevo pasa desapercibido en revisión y se queda para siempre.

## Las 12 leyes

01. **El relieve dice qué se pulsa** — Relieve en reposo = se pulsa. Hundido = ya está activo. Plano y opaco = solo informa.
02. **La ley gobierna controles, no enlaces** — Un enlace no se pulsa, se sigue. Va en texto plano y se identifica por color, subrayado, cursor y contexto. Si lleva fondo o borde propio, vuelve a ser un control y la ley le alcanza.
03. **La sombra la decide el sustrato** — La pareja de sombras sale de la superficie INMEDIATA, no de la página. Un elemento de color propio no puede estar extruido: va dentro de un anillo del color del lienzo.
04. **La forma es la segunda señal** — Píldora completa solo en botones. Rectángulo suave en lo que se escribe. Círculo con relieve = botón de icono; círculo plano = icono informativo.
05. **Opaco, nunca un tinte con alpha** — Los rellenos son colores sólidos. Nada de rgba() como fondo de algo que lleve texto.
06. **Se mide con WCAG 2 y con APCA** — Los dos modelos, siempre. Cuando discrepen, mirar el componente.
07. **Para salvar un contraste se cambia el texto, nunca la marca** — El color de marca se queda. Se cambia la tinta, el tamaño o la FORMA del componente.
08. **El nivel de un semántico se elige midiendo** — No por el nombre. Los niveles del brandbook no están igualados perceptualmente: ok y error funcionan con su 100, aviso necesita el 500 y info no funciona con ninguno neto.
09. **Escritorio primero, y la escala la decide el puntero** — Las reglas táctiles se condicionan a pointer: coarse, nunca a un ancho.
10. **Se verifica la maquetación, no solo el color** — Un var() inexistente no da error: la propiedad cae a su valor inicial y el componente se ve mal en silencio.
11. **Un validador con falsos positivos se acaba ignorando** — Cada comprobación nueva debe demostrar que SABE fallar: inyectar el defecto, ver que lo caza, retirarlo y ver que vuelve a cero.
12. **Un concepto, un bloque** — Las variantes viven dentro del átomo. Una capa superior compone: no introduce color ni sombra propios.

## Cómo usar el catálogo

Cada componente trae `clase`, `resumen`, `usar_cuando`, `nunca` y
`ejemplo`. Las plantillas traen además `requisitos`: qué admite cada
zona y qué pasa si se pasa.

**Lee `nunca` antes de copiar `ejemplo`.** Es la parte que impide usar
el componente correcto en el sitio equivocado, y es justo la que se
pierde cuando se copia solo el marcado.

```python
import json, urllib.request
ds = json.load(urllib.request.urlopen("https://renatopuente-ux.github.io/actuaria-plus-ds/ds.json"))
c = next(x for x in ds["componentes"] if x["clase"] == ".a-btn")
print(c["usar_cuando"], c["nunca"], c["ejemplo"], sep="\n")
```

Dos avisos sobre el propio catálogo:

- `clase` es `null` en las páginas. Una página es una instancia, no una
  clase: mira `instancia_de` para saber de qué plantilla sale.
- Las entradas con `tipo: "guia"` explican la capa y no se instancian.

## Inventario

- **atomo** (19): `.a-btn`, `.a-anillo`, `.a-icono`, `.a-medallon`, `.a-campo`, `.a-select`, `.a-chip`, `.a-interruptor · .a-casilla`, `.a-barra · .a-esqueleto`, `.a-grupo`, `.a-segmentado`, `.a-deslizador`…
- **molecula** (16): `.m-campo`, `.m-busqueda`, `.m-kpi`, `.m-pasos`, `.m-filtros`, `.m-tabla`, `.m-paginacion`, `.m-alerta`, `.m-vacio`, `.m-combo`, `.m-subida`, `.m-pestanas`…
- **organismo** (9): `.o-cabecera`, `.o-indicadores`, `.o-listado`, `.o-asistente`, `.o-lateral`, `.o-maqueta`, `.o-navegacion`, `.o-pie`, `.o-aviso`
- **superposicion** (6): `.s-dialogo`, `.s-cajon`, `.s-menu`, `.s-globo`, `.s-pista`, `.s-paleta`
- **plantilla** (3): `.t-pagina.t-listado`, `.t-pagina.t-asistente`, `.t-pagina.t-detalle`
- **pagina** (3): `.t-listado`, `.t-asistente`, `.t-detalle`

## Antes de dar por terminado

```bash
python tokens-check.py   # caza var(--x) inexistente: en el navegador falla en silencio
python catalogo.py       # regenera ds.json y llms.txt desde las fichas
```

Y `qa.js` se ejecuta en el navegador sobre la página: ~22
comprobaciones de la ley de relieve, contraste, área táctil, medida de
línea y ARIA, en escritorio y en `pointer: coarse`.

Una advertencia por experiencia propia: **un comprobador en verde no
significa que esté bien**. Antes de fiarte de un 0, mete el fallo a
mano y comprueba que lo caza. Varias veces, aquí, el roto fue el
instrumento y no la pieza.
