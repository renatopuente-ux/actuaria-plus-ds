# Actuaria+ Design System

Sistema de diseño con el que se renueva la plataforma **Actuaria+**.
Construido por capas según el *Atomic Design* de Brad Frost, con lenguaje
**neumórfico** sobre los tokens normativos del brandbook de Actuaria.

> **En vivo:** https://renatopuente-ux.github.io/actuaria-plus-ds/

---

## Por qué existe

La plataforma actual es **Material UI con el navy de marca pintado encima**.
Medido en producción (`act-compass`, v2.0.3):

| Medido hoy | Debería ser |
|---|---|
| Todo en **Nunito** (204 elementos), sin Lemon Milk ni Prompt | Tres familias con roles que no se intercambian |
| Sombras de elevación Material, una sola dirección | Relieve neumórfico: pareja luz/sombra |
| Textos en `rgba(0,0,0,.6)` y `rgba(0,0,0,.87)` | Tokens de texto trazables al brandbook |
| 105 elementos con `box-shadow:none` | La forma dice la función |

---

## La ley de relieve

Vale para todo el sistema y no admite excepciones:

| Tratamiento | Significado |
|---|---|
| **Relieve** | Se puede pulsar |
| **Hundido** | Acepta entrada, o es un carril |
| **Plano y opaco** | Informativo: ni se pulsa ni se escribe |

Es binaria, sobrevive al daltonismo (la señal es la sombra, no el color) y
clasifica cualquier componente nuevo con una sola pregunta: *¿se pulsa?*

Si todo sobresale, el relieve deja de significar nada — por eso las tarjetas
y los paneles son superficie plana, no botones gigantes.

---

## Arquitectura

```
tokens/tokens.json      fuente de verdad, derivada del brandbook
css/00-reset.css        mínimo imprescindible
css/00b-fuentes.css     @font-face (Lemon Milk se referencia, no se copia)
css/01-tokens.css       primitivo → semántico → componente
css/02-atomos.css       capa 1
css/90-escaparate.css   chrome del catálogo (NO forma parte del sistema)
pages/0N-*.html         una página por capa de Frost
js/ds.js                delegación única en document
```

### Tres capas de token, sin saltarse ninguna

1. **Primitivo** — el valor crudo del brandbook. Nunca se usa directo en un componente.
2. **Semántico** — el rol: qué significa ese valor en una interfaz.
3. **Componente** — se define junto al componente.

---

## Contraste

Todos los pares están medidos, y **contra qué fondo** se midió está anotado en el CSS.
No es un detalle: el mismo naranja da **6.03:1 sobre blanco y 5.09:1 sobre la superficie
de la app**. Un ratio sin decir el fondo no significa nada.

| Token | Sobre `--sup-app` |
|---|---|
| `--txt-fuerte` | 15.5:1 |
| `--txt-medio` | 7.9:1 |
| `--txt-debil` | 5.3:1 |
| `--txt-acento` | 5.1:1 |
| `--txt-enlace` | 8.2:1 |

Los rellenos de estado son **opacos**, nunca `rgba`: un tinte con alpha hereda la
superficie de debajo y su contraste cambia solo.

---

## La regla que manda

> «Si un color, fuente o valor no aparece en `tokens.json` o en `/brand`,
> NO es de marca: no lo inventes.»
> — Brandbook de Actuaria

---

## Estado

- [x] **0 · Fundamentos** — tokens, reset, fuentes, contraste verificado
- [x] **1 · Átomos** — botón, icono, campo, etiqueta, chip, punto, interruptor, casilla, barra, enlace, esqueleto
- [ ] **2 · Moléculas**
- [ ] **3 · Organismos**
- [ ] **4 · Plantillas**
- [ ] **5 · Páginas**
