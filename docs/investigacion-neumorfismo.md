# Investigación · awesome-neumorphism

Revisión de los repositorios de
[jqueryscript/awesome-neumorphism](https://github.com/jqueryscript/awesome-neumorphism).
**Nada de esto está aplicado todavía**: es el material para decidir.

Los 10 repos de la lista con código siguen accesibles. Analizados a fondo los
cuatro con CSS/SCSS propio:

| Repo | ★ | Qué aporta |
|---|---|---|
| `themesberg/neumorphism-ui-bootstrap` | 897 | 28 páginas de componentes; la referencia de cobertura |
| `AKAspanion/ui-neumorphism` | 659 | 23 componentes React; mantenido en 2026 |
| `dev-saeed/neumorphic-ui` · `usamamoinakhter/Neumorphism-ui` | 97 · 148 | variantes del mismo patrón |
| `ChemaAlfonso/neumorph.scss` | 37 | la parametrización más limpia |
| `neomorphism/neomo` | 48 | sombra teñida por estado |

---

## 1. El hallazgo que más importa: las sombras van en color SÓLIDO

themesberg, con diferencia el más usado, define:

```scss
$box-shadow-soft:  6px 6px 12px #b8b9be, -6px -6px 12px #ffffff;
$shadow-inset:     inset 2px 2px 5px #b8b9be, inset -3px -3px 7px #FFFFFF;
```

Sin `rgba`. Opacidad total. Y el color oscuro no es arbitrario:

```
superficie #e6e7ee × 0.80 = #b8b9be   ← coincide exactamente
```

**Nuestro sistema usa `rgba(21,31,71,.10–.16)`.** Compuesto sobre la superficie
da `#cdd1de`, que es **22 puntos de luminosidad más claro** que el equivalente
de themesberg. Esa es la explicación medida de por qué el relieve apenas se lee
— el problema que ya se notaba en el botón de icono sobre el lienzo.

### El algoritmo, confirmado

```
sombra_oscura = superficie × k      con k entre 0.80 y 0.85
sombra_clara  = superficie × (2-k)  → en superficies claras satura a blanco
```

- themesberg: k = 0.80 (verificado al byte)
- neumorphism.io por defecto: k = 0.85

Para la superficie de Actuaria `#E8ECF4`:

| k | Sombra oscura | Carácter |
|---|---|---|
| 0.88 | `#ccd0d7` | apenas perceptible |
| 0.84 | `#c3c6cd` | suave |
| **0.80** | **`#babdc3`** | **equivalente a themesberg** |
| 0.76 | `#b0b3b9` | marcado |

La sombra clara satura a `#ffffff` en todos los casos.

---

## 2. Declarar siempre las cuatro sombras

`neumorph.scss` escribe las externas **y** las internas en cada mixin, poniendo
a cero las que no actúan:

```scss
@mixin np-shadow {
  box-shadow: 6px 6px 16px 0 $shadow, -6px -6px 16px 0 $shadow-light,
              inset 0 0 0 0 $shadow, inset 0 0 0 0 $shadow-light;
}
@mixin np-shadow-inverse {
  box-shadow: 0 0 0 0 $shadow, 0 0 0 0 $shadow-light,
              inset 6px 6px 16px 0 $shadow, inset -6px -6px 16px 0 $shadow-light;
}
```

`box-shadow` solo interpola entre listas de **la misma longitud**. Con este
truco, pasar de relieve a hundido se anima; con nuestra implementación actual,
salta. Afecta directamente a `:active` en botones y a los estados de pestañas.

---

## 3. La sombra puede teñirse con el color del componente

`neomo` no usa un gris único: tiñe la pareja con el matiz del propio elemento.

```css
/* variante azul  */ inset -3px -3px 7px #ffffffe5, inset 3px 3px 5px rgba(55,114,216,.288)
/* variante naranja */ inset -3px -3px 7px #f7ba84, inset 3px 3px 5px #27140449
```

Es lo que ya hacemos al derivar del navy de marca, pero ellos lo llevan a cada
estado. Aplicable a `--n-dark` sobre superficies navy y a los estados de error.

---

## 4. Cada tema trae su propia pareja de sombras

`ui-neumorphism` separa por tema en vez de parchear componentes:

```css
.theme--light { --box-shadow-inset-small: inset -1px -1px 1px var(--light-bg-light-shadow),
                                           inset  1px  1px 1px var(--light-bg-dark-shadow); }
.theme--dark  { /* la misma estructura con --dark-bg-* */ }
```

Confirma nuestro enfoque de `--n-dark` / `--n-in-dark`, pero sugiere subirlo a
**tema** en vez de a excepción por componente — relevante porque Actuaria+ tiene
barra lateral navy y lienzo claro conviviendo.

---

## 5. Relación distancia / desenfoque

| Fuente | Distancia | Desenfoque | Ratio |
|---|---|---|---|
| themesberg (soft) | 6px | 12px | 2.0 |
| themesberg (light) | 3px | 6px | 2.0 |
| neumorph.scss | 6px | 16px | 2.7 |
| nuestro `--n-md` | 6px | 16px | 2.7 |

El ratio está bien; lo que falla es el **color**, no la geometría.

---

## 6. Cobertura de componentes como referencia

**themesberg** (28 páginas): acordeones, alertas, badges, cards de blog,
carruseles, migas, botones, collapse, contadores, formularios, cajas de icono,
modales, navbars, navs, paginación, popovers, cards de precio, cards de perfil,
progreso, **pasos**, pestañas, **líneas de tiempo**, tooltips, tipografía, widgets.

**ui-neumorphism** (23): alert, avatar, badge, button, card, carousel, checkbox,
chip, dialog, divider, form, input, list, parallax, progress, radio, slider,
spacer, switch, tab, table, tooltip, typography.

Los que nos faltan y la plataforma real sí necesita: **pasos** (el asistente de
8 pasos), **línea de tiempo** (historial de un estudio), **tabla**, **diálogo**,
**paginación**, **acordeón**.

---

## 7. Lo que NO hay que copiar

**themesberg elimina el anillo de foco:**

```scss
$input-btn-focus-box-shadow: none;
$btn-focus-box-shadow:       $shadow-inset;   // el foco se ve igual que el :active
```

Es una regresión de accesibilidad: con teclado no se distingue el elemento
enfocado del pulsado. Nuestro `:focus-visible` con contorno se queda como está.

**Ninguno de los cuatro verifica contraste.** Son bibliotecas estéticas: ni
ratios, ni tokens de texto, ni comprobación sobre fondo. Ahí el sistema de
Actuaria va por delante y conviene no perderlo al subir la intensidad.

---

## Decisiones que quedan abiertas

1. **Subir la intensidad a k = 0.80** (equivalente a themesberg) o quedarse en
   un término medio como 0.84.
2. **Adoptar las cuatro sombras siempre**, para que relieve ↔ hundido se anime.
3. **Subir las parejas de sombra a nivel de tema** (claro / navy) en lugar de
   excepciones por componente.
4. Añadir los seis componentes que faltan y la plataforma sí usa.
