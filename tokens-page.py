"""Genera pages/00-tokens.html LEYENDO el CSS.

La pagina no se escribe a mano a proposito. Un inventario copiado se
desincroniza del codigo en la primera semana y entonces miente, que es
peor que no tenerlo. Aqui el fuente es css/*.css: si un token cambia o
desaparece, la pagina cambia con el.

Los contrastes tampoco se escriben: se miden EN EL NAVEGADOR al cargar,
con los valores que el navegador resuelve de verdad. Asi funcionan
tambien los color-mix(), que en el fuente son una expresion y no un hex.
"""
import os, re, glob, html

R = os.path.dirname(os.path.abspath(__file__))

# Una declaracion de token va precedida de `{`, `;` o espacio. El
# lookbehind descarta los nombres que son PARTE DE UN SELECTOR:
# `.a-btn--principal:hover` contiene literalmente `--principal:` y se
# colaba como si fuera un token. Daba 5 tokens inventados en el
# inventario y, peor, el comprobador los daba por definidos: un
# var(--principal) fantasma habria pasado sin avisar.
DECL = r"(?<![\w-])(--[\w-]+)\s*:"


def sin_comentarios(txt):
    """Quita los comentarios ANTES de buscar tokens.

    Sin esto, la prosa de un comentario que menciona `--navegable:` se
    captura como si fuera una declaracion, y su texto —que incluia
    `<button>`— acababa inyectado como HTML real en la tabla. Dos bugs
    de una sola causa: no filtrar, y no escapar.
    """
    return re.sub(r"/\*.*?\*/", "", txt, flags=re.S)

def leer_secciones():
    """Agrupa los tokens por el comentario de seccion que los precede.

    NO se lee linea a linea. Las sombras ocupan VARIAS lineas —la regla
    de las cuatro sombras obliga a declararlas todas— y un regex que
    exija el `;` en la misma linea se las salta: faltaban los 9 tokens
    de sombra y la pagina no decia nada, solo mostraba menos filas.
    Se parte el archivo por los encabezados de seccion y se busca sobre
    el bloque entero.
    """
    ruta = os.path.join(R, "css", "01-tokens.css")
    txt = open(ruta, encoding="utf-8").read()
    cuerpo = txt[txt.find(":root"):]

    CABECERA = r"/\*\s*[-\u2500=]*\s*(\d)\s*\u00b7\s*([^\u2500*]{3,70})"
    marcas = [(m.start(), m.group(1), m.group(2).strip(" \u2500-*"))
              for m in re.finditer(CABECERA, cuerpo)]

    secciones = []
    for i, (pos, capa, nom) in enumerate(marcas):
        fin = marcas[i + 1][0] if i + 1 < len(marcas) else len(cuerpo)
        bloque = sin_comentarios(cuerpo[pos:fin])
        toks = [(m.group(1), re.sub(r"\s+", " ", m.group(2)).strip())
                for m in re.finditer(DECL + r"\s*([^;]+);", bloque, re.S)]
        if toks:
            secciones.append([(capa, nom), toks])
    return secciones

def otros_archivos():
    """Tokens definidos fuera de 01-tokens.css, para que no quede ninguno
    sin listar."""
    fuera = []
    for f in sorted(glob.glob(os.path.join(R, "css", "*.css"))):
        if f.endswith("01-tokens.css"):
            continue
        txt = sin_comentarios(open(f, encoding="utf-8").read())
        for m in re.finditer(DECL + r"\s*([^;]+);", txt, re.S):
            fuera.append((os.path.basename(f), m.group(1),
                          re.sub(r"\s+", " ", m.group(2)).strip()))
    return fuera

def tipo(nombre, valor):
    v = valor.lower()
    if re.search(r"#[0-9a-f]{3,8}\b|color-mix|\brgb", v):  return "color"
    if "px" in v and ("shadow" in nombre or re.search(r"\d+px \d+px", v)): return "sombra"
    if re.match(r"^[\d.]+(px|rem|em)$", v) or "--e-" in nombre or "--r-" in nombre: return "medida"
    if "ms" in v or "cubic" in v: return "movimiento"
    if re.search(r"\d+\s*/\s*[\d.]+", v) or "--t-" in nombre or "--ff-" in nombre: return "texto"
    return "otro"

MUESTRA = {
  "color":      '<span class="t-sw" style="background:var({n})"></span>',
  "sombra":     '<span class="t-sw t-sw--sh" style="box-shadow:var({n})"></span>',
  "medida":     '<span class="t-sw t-sw--m"><i style="width:var({n});height:var({n})"></i></span>',
  "movimiento": '<span class="t-sw t-sw--mov"><i style="transition-duration:var({n})"></i></span>',
  "texto":      '<span class="t-sw t-sw--tx" style="font:var({n})">Ag</span>',
  "otro":       '<span class="t-sw t-sw--na">\u2014</span>',
}

_vistos_fila = set()

def fila(nombre, valor, archivo=None):
    """Marca las redefiniciones en vez de ocultarlas.

    --mov-rapido y --mov-medio aparecen dos veces a proposito: valen 0s
    dentro de prefers-reduced-motion. Esconder la segunda fila daria un
    inventario que miente; mostrarla sin etiqueta parece un duplicado
    por error. Se etiqueta.
    """
    t = tipo(nombre, valor)
    marcas = []
    if archivo:
        marcas.append(archivo)
    if nombre in _vistos_fila:
        marcas.append("redefinido")
    _vistos_fila.add(nombre)
    origen = f'<span class="t-org">{" \u00b7 ".join(marcas)}</span>' if marcas else ""
    return (f'<tr data-token="{nombre}" data-tipo="{t}">'
            f'<td class="t-mu">{MUESTRA[t].format(n=nombre)}</td>'
            f'<td class="t-nom"><code>{nombre}</code>{origen}</td>'
            f'<td class="t-val"><code>{html.escape(valor)}</code></td>'
            f'<td class="t-res"></td><td class="t-con"></td></tr>')

def construir():
    partes = []
    NOMBRE_CAPA = {
      "1": ("Primitivos",
            "Valores en bruto de la marca. No tienen funcion todavia: un "
            "<code>#151F47</code> no se puede poner en una pantalla hasta que "
            "algo diga para que sirve. Aqui es donde manda el brandbook."),
      "2": ("Sem\u00e1nticos",
            "Le dan oficio a un primitivo: <em>esto es texto fuerte</em>, "
            "<em>esto es la superficie hundida</em>. Es la capa que un tema "
            "re-apunta, y por eso los componentes solo pueden usar esta."),
      "3": ("Sistema",
            "Decisiones transversales: la luz del neumorfismo, el movimiento y "
            "el orden de las capas. No son color ni tama\u00f1o, pero se "
            "declaran igual para que nadie los improvise."),
    }
    # Las secciones del CSS NO vienen ordenadas por capa: la 1 reaparece
    # despues de la 2 (espacio y radios van al final). Emitir en ese
    # orden abria <section id="capa-1"> dos veces, y un id duplicado
    # rompe getElementById y las referencias aria. Se agrupa primero.
    porCapa = {}
    for (capa, nom), toks in leer_secciones():
        if toks:
            porCapa.setdefault(capa, []).append((nom, toks))

    for capa in ("1", "2", "3"):
        if capa not in porCapa:
            continue
        titulo, texto = NOMBRE_CAPA[capa]
        n = sum(len(t) for _, t in porCapa[capa])
        partes.append(f'<section class="ficha" id="capa-{capa}">'
                      f'<h2>{titulo}</h2><p class="resumen">{texto}</p>'
                      f'<p class="t-cuenta">{n} tokens</p>')
        for nom, toks in porCapa[capa]:
            partes.append(f'<h3 class="t-sec">{nom}</h3>'
                          '<table class="t-tabla"><thead><tr>'
                          '<th>Muestra</th><th>Token</th><th>Valor declarado</th>'
                          '<th>Valor resuelto</th><th>Contraste</th>'
                          '</tr></thead><tbody>')
            partes.extend(fila(n_, v) for n_, v in toks)
            partes.append("</tbody></table>")
        partes.append("</section>")


    fuera = otros_archivos()
    if fuera:
        partes.append('<section class="ficha" id="otros"><h2>Definidos fuera de 01-tokens.css</h2>'
                      '<p class="resumen">Tokens que viven en la hoja de su propia capa. '
                      'Se listan aqu\u00ed para que el inventario est\u00e9 completo: un token '
                      'que nadie ve es un token que alguien reinventa.</p>'
                      '<table class="t-tabla"><thead><tr><th>Muestra</th><th>Token</th>'
                      '<th>Valor declarado</th><th>Valor resuelto</th><th>Contraste</th>'
                      '</tr></thead><tbody>')
        partes.extend(fila(n, v, a) for a, n, v in fuera)
        partes.append("</tbody></table></section>")
    return "\n".join(partes)

if __name__ == "__main__":
    cuerpo = construir()
    HEAD = open(os.path.join(R, "_plantilla", "head.html"), encoding="utf-8").read()
    PIE = open(os.path.join(R, "_plantilla", "pie.html"), encoding="utf-8").read()
    intro = (
      '<header class="esc-intro"><h1>Tokens</h1>'
      '<p>Las tres capas del sistema, le\u00eddas del CSS. Esta p\u00e1gina la genera '
      '<code>tokens-page.py</code> a partir de <code>css/*.css</code>: no hay '
      'ninguna lista copiada a mano que se pueda quedar atr\u00e1s.</p>'
      '<p>Los contrastes se <strong>miden en el navegador</strong> al cargar, '
      'sobre los valores ya resueltos. Un <code>color-mix()</code> en el fuente '
      'es una expresi\u00f3n, no un color: solo el navegador sabe en qu\u00e9 acaba.</p>'
      '</header>')
    salida = (HEAD.format(titulo="Tokens", base="../") + intro + cuerpo + "\n"
              + PIE.replace("{base}", "../").replace("</body>",
                  '<script src="../js/tokens.js" defer></script>\n</body>'))
    destino = os.path.join(R, "pages", "00-tokens.html")
    open(destino, "w", encoding="utf-8", newline="\n").write(salida)
    n = cuerpo.count("<tr data-token")
    print(f"pages/00-tokens.html generado con {n} tokens")
