#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Auditoria del sistema. Lo que qa.js no puede ver desde el navegador.

LA PREGUNTA QUE IMPORTA
  Dos defectos de sustrato llegaron a publicarse con el linter en
  verde. La causa no fue el ojo de nadie: fue que LA LEY ESTABA
  ESCRITA Y NO TENIA COMPROBACION. Una ley sin comprobacion es una
  nota.

  Por eso lo primero que hace esta auditoria es cruzar las 12 leyes
  contra las categorias que qa.js sabe reportar, y decir cuales no
  vigila nadie.

El resto son cosas que solo se ven leyendo el codigo: un hex escrito a
mano fuera de los tokens, una clase que se usa y no existe (no da
error: no hace nada), un componente sin ficha, un JS que nadie enlaza.
"""
import os, re, sys
from collections import defaultdict

RAIZ = os.path.dirname(os.path.abspath(__file__))
CSS = os.path.join(RAIZ, "css")
PAGS = os.path.join(RAIZ, "pages")

def leer(p):
    return open(p, encoding="utf-8").read()

def sin_comentarios(t):
    """Quita los comentarios CONSERVANDO los saltos de linea. Si se
    borran a secas, todas las lineas posteriores se desplazan y el
    informe senala sitios que no son: un informe con lineas falsas se
    deja de mirar al segundo intento."""
    return re.sub(r"/\*.*?\*/",
                  lambda m: "\n" * m.group(0).count("\n"), t, flags=re.S)

# ── 1 · COBERTURA DE LAS LEYES ────────────────────────────────────────
# Cada ley declara que categoria de qa.js la vigila. Si una ley no tiene
# categoria, o la categoria no existe en qa.js, se reporta.
LEYES = {
    "01 El relieve dice que se pulsa":            ["relieve"],
    "02 La ley gobierna controles, no enlaces":   ["enlace", "enlace-solo-color"],
    "03 La sombra la decide el sustrato":         ["sustrato"],
    "04 La forma es la segunda senal":            ["forma"],
    "05 Opaco, nunca un tinte con alpha":         ["alpha"],
    "06 Se mide con WCAG 2 y con APCA":           ["contraste"],
    "07 Para salvar un contraste se cambia el texto, nunca la marca":
                                                  ["hex-a-mano"],   # estatico
    "08 El nivel de un semantico se elige midiendo":
                                                  ["contraste"],
    "09 Escritorio primero, la escala la decide el puntero":
                                                  ["tactil-44", "entrada-16px", "area-tactil"],
    "10 Se verifica la maquetacion, no solo el color":
                                                  ["var-fantasma", "tapado", "texto-partido",
                                                   "medida", "alineacion"],
    "11 Un validador con falsos positivos se ignora":
                                                  ["*proceso*"],    # pruebas negativas
    "12 Un concepto, un bloque":                  ["variante-fantasma"],
}

def cobertura():
    qa = leer(os.path.join(RAIZ, "qa.js"))
    cats = set(re.findall(r"F\('([a-z0-9-]+)'", qa))
    fallos = []
    for ley, necesarias in LEYES.items():
        faltan = [c for c in necesarias
                  if c not in cats and not c.startswith("*") and c != "hex-a-mano"]
        if faltan:
            fallos.append("ley sin comprobacion: %s -> falta %s" % (ley, ", ".join(faltan)))
    huerfanas = sorted(cats - {c for v in LEYES.values() for c in v})
    return fallos, cats, huerfanas

# ── 2 · HEX ESCRITOS A MANO FUERA DE LOS TOKENS ───────────────────────
def hex_a_mano():
    """Un color literal fuera de 01-tokens.css es un color inventado: no
    aparece en la pagina de Tokens, nadie lo revisa y se queda."""
    malos = []
    for f in sorted(os.listdir(CSS)):
        if f == "01-tokens.css":
            continue
        t = sin_comentarios(leer(os.path.join(CSS, f)))
        for m in re.finditer(r"#[0-9a-fA-F]{3,8}\b", t):
            linea = t[:m.start()].count("\n") + 1
            malos.append("%s:%d  %s" % (f, linea, m.group(0)))
        for m in re.finditer(r"\brgba?\(", t):
            linea = t[:m.start()].count("\n") + 1
            malos.append("%s:%d  rgb() literal" % (f, linea))
    return malos

# ── 3 · CLASES: definidas sin usar, y usadas sin definir ──────────────
def clases():
    definidas = set()
    for f in os.listdir(CSS):
        t = sin_comentarios(leer(os.path.join(CSS, f)))
        # Cualquier aparicion cuenta, tambien dentro de un selector
        # descendiente: «.m-pestanas [role=tab]» define .m-pestanas como
        # gancho aunque no tenga reglas propias.
        definidas |= set(re.findall(r"\.((?:a|m|o|s|t|pg|esc|pr)-[a-z0-9_-]+)", t))
    # Un gancho de JS —una clase sin reglas CSS que el script usa como
    # selector— es legitimo: .m-pestanas no pinta nada, pero pestanas.js
    # la busca. Cuenta como definida.
    for f in os.listdir(os.path.join(RAIZ, "js")):
        t = leer(os.path.join(RAIZ, "js", f))
        definidas |= set(re.findall(r"\.((?:a|m|o|s|t|pg)-[a-z0-9_-]+)", t))
        definidas |= set(re.findall(r"contains\(['\"]((?:a|m|o|s|t|pg)-[a-z0-9_-]+)", t))

    # BEM: si existe .o-listado__barra, el bloque .o-listado es la raiz
    # del espacio de nombres aunque no tenga reglas propias.
    definidas |= {c.split("__")[0] for c in definidas if "__" in c}

    usadas = set()
    htmls = [os.path.join(PAGS, x) for x in os.listdir(PAGS) if x.endswith(".html")]
    htmls.append(os.path.join(RAIZ, "index.html"))
    for p in htmls:
        t = leer(p)
        for m in re.finditer(r'class="([^"]+)"', t):
            usadas |= set(m.group(1).split())
    # las que el JS anade en caliente
    for f in os.listdir(os.path.join(RAIZ, "js")):
        t = leer(os.path.join(RAIZ, "js", f))
        # Las cadenas del JS suelen traer VARIAS clases juntas
        # («a-btn a-btn--sm a-btn--fantasma»): hay que partirlas, o cada
        # cadena entera se cuenta como una clase inexistente.
        for m in re.finditer(r"['\"`]([a-z0-9_ -]*(?:a|m|o|s|t|pg)-[a-z0-9_ -]+)['\"`]", t):
            usadas |= set(m.group(1).split())
        for m in re.finditer(r"className\s*=\s*['\"`]([^'\"`]+)", t):
            usadas |= set(m.group(1).split())
        # Y las que se componen con plantilla —`o-aviso--${t}`— no se
        # pueden resolver estaticamente: se cubren con el prefijo.
        for m in re.finditer(r"((?:a|m|o|s|t|pg)-[a-z0-9-]+)--\$\{", t):
            usadas |= {c for c in definidas if c.startswith(m.group(1) + "--")}
    muertas = sorted(c for c in definidas - usadas if not c.startswith(("esc-", "pr-")))
    fantasmas = sorted(c for c in usadas - definidas
                       if re.match(r"^(a|m|o|s|t|pg)-", c) and "$" not in c)
    return muertas, fantasmas

# ── 4 · COMPONENTES SIN FICHA ─────────────────────────────────────────
def sin_ficha():
    import json
    p = os.path.join(RAIZ, "ds.json")
    if not os.path.exists(p):
        return ["ds.json no existe: ejecuta catalogo.py"]
    cat = json.load(open(p, encoding="utf-8"))
    # Una ficha puede documentar varias clases: «.a-interruptor · .a-casilla».
    documentadas = set()
    for c in cat["componentes"]:
        if c.get("clase"):
            documentadas |= {x.strip() for x in re.split(r"[·,/]", c["clase"]) if x.strip()}
        # y las que aparecen en su ejemplo tambien estan documentadas
        if c.get("ejemplo"):
            documentadas |= {"." + x for x in re.findall(r'class="([^"]+)"', c["ejemplo"])
                             for x in x.split()}
    base = set()
    for f in ("02-atomos.css", "03-moleculas.css", "04-organismos.css", "05-superposicion.css"):
        t = sin_comentarios(leer(os.path.join(CSS, f)))
        for c in re.findall(r"\.((?:a|m|o|s)-[a-z0-9-]+)", t):
            if "--" not in c:
                base.add("." + c)
    return sorted(base - documentadas)

# ── 5 · JS QUE NADIE ENLAZA ───────────────────────────────────────────
def js_suelto():
    """No basta mirar la plantilla: alguna pagina generada enlaza su JS
    directamente (la de Tokens lo hace). Se busca en todo el HTML."""
    todo = leer(os.path.join(RAIZ, "_plantilla", "pie.html"))
    for d, _, fs in os.walk(RAIZ):
        if ".git" in d:
            continue
        for f in fs:
            if f.endswith((".html", ".py")):
                todo += leer(os.path.join(d, f))
    return sorted(f for f in os.listdir(os.path.join(RAIZ, "js"))
                  if f.endswith(".js") and f not in todo)

# ── 6 · !important ────────────────────────────────────────────────────
def importantes():
    out = []
    for f in sorted(os.listdir(CSS)):
        t = sin_comentarios(leer(os.path.join(CSS, f)))
        n = t.count("!important")
        if n:
            out.append("%s: %d" % (f, n))
    return out

def seccion(titulo, items, explica="", duro=True):
    print("\n" + "=" * 68)
    print(titulo)
    print("=" * 68)
    if explica:
        print(explica)
    if not items:
        print("  sin hallazgos")
        return 0
    for x in items[:40]:
        print("  - %s" % x)
    if len(items) > 40:
        print("  ... y %d mas" % (len(items) - 40))
    return len(items) if duro else 0

def main():
    graves = 0
    fallos, cats, huerfanas = cobertura()
    graves += seccion("1 · COBERTURA DE LAS LEYES",
        fallos,
        "Una ley sin comprobacion es una nota. qa.js reporta %d categorias." % len(cats))
    if huerfanas:
        print("  (categorias que no mapean a ninguna ley: %s)" % ", ".join(huerfanas))

    graves += seccion("2 · COLORES ESCRITOS A MANO FUERA DE LOS TOKENS",
        hex_a_mano(),
        "Un literal fuera de 01-tokens.css no sale en la pagina de Tokens\ny nadie lo revisa. Brandbook: si no esta en tokens, no es de marca.")

    muertas, fantasmas = clases()
    graves += seccion("3a · CLASES USADAS QUE NO EXISTEN",
        fantasmas,
        "No dan error: simplemente no hacen nada. Es el fallo mas silencioso\nque hay en CSS.")
    seccion("3b · CLASES DEFINIDAS QUE NADIE USA",
        muertas, "Codigo muerto. No rompe, pero envejece y confunde.", duro=False)

    seccion("4 · COMPONENTES DEL CSS SIN FICHA",
        sin_ficha(), "Existen y nadie sabe cuando usarlos.", duro=False)

    graves += seccion("5 · JAVASCRIPT QUE NADIE ENLAZA",
        js_suelto(), "Si no esta en _plantilla/pie.html, no se ejecuta.")

    seccion("6 · !important",
        importantes(), "Cada uno es una pelea de especificidad sin resolver.", duro=False)

    print("\n" + "=" * 68)
    print("HALLAZGOS QUE EXIGEN ACCION: %d" % graves)
    print("=" * 68)
    return 1 if graves else 0

if __name__ == "__main__":
    raise SystemExit(main())
