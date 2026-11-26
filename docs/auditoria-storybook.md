# El Storybook actual, medido

Auditoría de [`actuaria-ui-storybook.web.app`](https://actuaria-ui-storybook.web.app),
que es lo que este sistema viene a sustituir. **49 componentes, 245 historias, 8 categorías.**
Todo lo de abajo está medido en el DOM, no estimado.

## Los colores no son los del brandbook

| Token del Storybook | Valor | Brandbook | |
|---|---|---|---|
| `--navy` | `#0f1f3d` | `#151F47` | **distinto** |
| `--navy-2` | `#1e3a6e` | — | inventado |
| `--navy-3` | `#253d6e` | — | inventado |
| `--indigo` | `#4c64d9` | — | **inventado** |
| `--indigo-2` | `#3b51c0` | — | inventado |
| `--indigo-soft` | `#4c64d91a` | — | inventado, **con alpha** |
| `--indigo-ring` | `#4c64d959` | — | inventado, **con alpha** |
| `--orange` | `#de5e2d` | `#DF5E2D` | **a un dígito** |
| `--green` | `#00c781` | `#00C781` | coincide |
| `--yellow` | `#ffbb38` | `#FFBB38` | coincide |
| `--red` | `#ff4040` | `#FF4040` | coincide |
| `--green-text` | `#00925e` | — | inventado |
| `--yellow-text` | `#b07d00` | — | inventado |
| `--red-text` | `#c0392b` | — | inventado |

Los tres semánticos base están bien. El resto no.

Lo más serio es la **rampa índigo completa**: cuatro tokens de un color que no
existe en la marca, dos de ellos con transparencia. El brandbook es explícito:
«si un color no aparece en `tokens.json` o en `/brand`, NO es de marca: no lo
inventes».

El naranja a un dígito (`de` en vez de `df`) no se ve a simple vista, pero es
una deriva: el valor dejó de venir de la fuente y pasó a copiarse a mano.

## La tipografía de marca no está

Familias encontradas: **Nunito, Nunito Sans, Operator Mono, ui-monospace**.

No hay Lemon Milk en ningún titular ni Prompt en ningún párrafo. La regla del
brandbook —«títulos siempre en Lemon Milk, cuerpo siempre en Prompt»— no está
aplicada en ninguna parte. Y conviven dos variantes de Nunito, que es una
inconsistencia dentro de la propia inconsistencia.

## Todo tiene el mismo radio

`border-radius: 12px` en botones, campos y tarjetas por igual. No hay píldora,
así que nada distingue por forma una acción de un contenedor.

## No hay ley transversal

49 componentes y ninguna regla que diga qué se puede pulsar. Botones, tarjetas y
etiquetas comparten sombra y radio, así que el usuario tiene que probar.

---

## Qué cubre ya el sistema nuevo

**22 de los 49**, con equivalencia directa:

| Storybook | Sistema nuevo |
|---|---|
| Button, ButtonGroup | `a-btn` + `a-anillo` |
| Input, Textarea, Select, Label | `a-campo`, `a-area`, `a-select`, `a-etiqueta` |
| Checkbox, Progress, Badge | `a-casilla`, `a-barra`, `a-chip` |
| IconContainer | `a-medallon` |
| Card | `o-panel` |
| SearchInput | `m-busqueda` |
| Table, DataTable | `m-tabla` + `o-listado` |
| Pagination, Stepper | `m-paginacion`, `m-pasos` |
| TagGroup | `m-filtros` |
| Alert, EmptyState | `m-alerta`, `m-vacio` |
| Breadcrumbs | ruta de `o-cabecera` |
| NavSidebar | `o-lateral` |

## Lo que el sistema nuevo añade y el Storybook no tiene

`a-interruptor` (switch), `a-esqueleto` (skeleton), `a-anillo`, `m-kpi`,
`o-indicadores`, `o-asistente`, `o-maqueta`.

## Los 27 que faltan por construir

**Formularios (7)** · Autocomplete, Combobox, FileUpload, InputGroup,
NumberStepper, SegmentedControl, Slider

**Superposición (5)** · Dialog, Drawer, DropdownMenu, Popover, Command

**Navegación (2)** · Accordion, Tabs

**Datos (6)** · Avatar, BadgeDot, Calendar, Rating, SummaryList, TextBlock

**Avisos (2)** · AlertGlobal, Tooltip

**Disposición (3)** · Footer, NavHeader, SlotPlaceholder

**Primitivos (2)** · Separator, TextLink

Los de superposición son los de más riesgo: diálogo, cajón y menú necesitan
gestión de foco, cierre con Escape y devolución del foco al disparador. Ahí es
donde más se rompe la accesibilidad.
