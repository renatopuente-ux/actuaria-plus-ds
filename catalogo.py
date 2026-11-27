#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Catalogo legible por agentes, generado desde las propias fichas.

POR QUE EXISTE
  Un sistema de diseno solo sirve si se usa bien, y hoy una parte del
  codigo la escribe un agente. Si el agente solo puede raspar el HTML
  de la documentacion, se lleva el marcado y PIERDE LAS REGLAS: copia
  un boton y no se entera de que el naranja no vale como relleno con
  texto pequeno, ni de que lo plano es informativo.

  Por eso el catalogo no es una lista de fragmentos. Cada entrada lleva
  su «usar cuando» y su «nunca», que es lo unico que impide que el
  agente use el componente correcto en el sitio equivocado.

  Se genera desde pages/*.html: una sola fuente, sin copias que se
  desincronicen.

SALIDA
  ds.json    catalogo completo, para leer con codigo
  llms.txt   indice en texto plano (convencion llmstxt.org)
  AGENTS.md  las reglas que un agente debe respetar al escribir codigo
"""
import json, os, re, sys
from html import unescape

RAIZ = os.path.dirname(os.path.abspath(__file__))
CAPAS = [("pages/01-atomos.html", 1, "atomo"),
         ("pages/02-moleculas.html", 2, "molecula"),
         ("pages/03-organismos.html", 3, "organismo"),
         ("pages/04-superposicion.html", 3, "superposicion"),
         ("pages/05-plantillas.html", 4, "plantilla"),
         ("pages/06-paginas.html", 5, "pagina")]

def limpio(h):
    """HTML -> texto. Se queda con el texto de <code> para no perder los
    nombres de clase que van dentro de las reglas."""
    h = re.sub(r"<br\s*/?>", " ", h)
    h = re.sub(r"<[^>]+>", "", h)
    return re.sub(r"\s+", " ", unescape(h)).strip()

def lista(bloque, clase):
    m = re.search(r'<div class="regla regla--%s">(.*?)</div>' % clase, bloque, re.S)
    if not m: return []
    return [limpio(x) for x in re.findall(r"<li>(.*?)</li>", m.group(1), re.S)]

def requisitos(bloque):
    m = re.search(r'<table class="t-req">(.*?)</table>', bloque, re.S)
    if not m: return []
    out = []
    for fila in re.findall(r"<tr>(.*?)</tr>", m.group(1), re.S):
        celdas = [limpio(c) for c in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", fila, re.S)]
        if len(celdas) == 3 and celdas[0] != "Zona":
            out.append({"zona": celdas[0], "admite": celdas[1], "si_se_pasa": celdas[2]})
    return out

def fichas(ruta, capa, tipo):
    p = os.path.join(RAIZ, ruta)
    if not os.path.exists(p): return []
    txt = open(p, encoding="utf-8").read()
    out = []
    for m in re.finditer(r'<section class="ficha" id="([a-z0-9-]+)">(.*?)</section>', txt, re.S):
        idf, cuerpo = m.group(1), m.group(2)
        h2 = re.search(r"<h2>(.*?)</h2>", cuerpo, re.S)
        cl = re.search(r'<span class="clase">(.*?)</span>', cuerpo, re.S)
        rs = re.search(r'<p class="resumen">(.*?)</p>', cuerpo, re.S)
        # El <code> interior es OPCIONAL: las fichas antiguas lo omiten.
        # Con el regex rigido, 30 de 51 componentes salian sin ejemplo.
        cd = re.search(r'<pre class="codigo">(?:<code>)?(.*?)(?:</code>)?</pre>', cuerpo, re.S)
        if not h2: continue
        clase = limpio(cl.group(1)) if cl else None
        # En las paginas el rotulo dice «instancia de .t-listado»: es una
        # referencia a la plantilla, no una clase que se pueda escribir
        # en un atributo. Separarlo evita que el agente ponga
        # class="instancia de .t-listado".
        instancia_de = None
        if clase and clase.startswith("instancia de "):
            instancia_de = clase[len("instancia de "):].strip()
            clase = None
        # Sin clase CSS no es un componente: es una guia («Qué es una
        # plantilla»). Se conserva, pero etiquetada, para que el agente
        # no intente instanciarla.
        e = {"id": idf, "nombre": limpio(h2.group(1)), "capa": capa,
             "tipo": tipo if (clase or instancia_de) else "guia",
             "clase": clase,
             "instancia_de": instancia_de,
             "resumen": limpio(rs.group(1)) if rs else "",
             "usar_cuando": lista(cuerpo, "si"),
             "nunca": lista(cuerpo, "no"),
             "ejemplo": unescape(cd.group(1)).strip() if cd else None,
             # Una plantilla no trae «usar cuando / nunca»: trae la tabla
             # de requisitos de contenido, que es su aportacion real
             # segun Frost. Sin esto el agente se lleva la maqueta y
             # pierde los limites.
             "requisitos": requisitos(cuerpo),
             "url": "https://renatopuente-ux.github.io/actuaria-plus-ds/%s#%s"
                    % (ruta.replace("pages/", "pages/"), idf)}
        out.append(e)
    return out

def tokens():
    t = open(os.path.join(RAIZ, "css", "01-tokens.css"), encoding="utf-8").read()
    t = re.sub(r"/\*.*?\*/", "", t, flags=re.S)
    DECL = r"(?<![\w-])(--[\w-]+)\s*:\s*([^;]+);"
    vistos, out = set(), []
    for m in re.finditer(DECL, t, re.S):
        n, v = m.group(1), re.sub(r"\s+", " ", m.group(2)).strip()
        if n in vistos: continue
        vistos.add(n); out.append({"token": n, "valor": v})
    return out

def main():
    comps = []
    for ruta, capa, tipo in CAPAS:
        comps.extend(fichas(ruta, capa, tipo))

    leyes = []
    pr = os.path.join(RAIZ, "pages", "00-principios.html")
    if os.path.exists(pr):
        h = open(pr, encoding="utf-8").read()
        # Las leyes son <article class="pr-ley">, no section.ficha. Con
        # el selector equivocado salian 3 (los grupos) en vez de 12.
        for m in re.finditer(r'<article class="pr-ley">(.*?)</article>', h, re.S):
            t = re.search(r"<h3>(.*?)</h3>", m.group(1), re.S)
            g = re.search(r'<p class="pr-regla">(.*?)</p>', m.group(1), re.S)
            q = re.search(r'<p class="pr-porque">(.*?)</p>', m.group(1), re.S)
            # El numero vive en <span class="pr-i">01</span> dentro del
            # h3; sin quitarlo queda «01El relieve dice que se pulsa».
            bruto = t.group(1) if t else ""
            num = re.search(r'<span class="pr-i">(.*?)</span>', bruto)
            titulo = limpio(re.sub(r'<span class="pr-i">.*?</span>', "", bruto))
            if t: leyes.append({"n": limpio(num.group(1)) if num else None,
                                "ley": titulo,
                                "regla": limpio(g.group(1)) if g else "",
                                "por_que": limpio(q.group(1)) if q else ""})

    ds = {"nombre": "Actuaria DS 27",
          "descripcion": "Sistema de diseno neumorfico de Actuaria+, en Atomic Design.",
          "base": "https://renatopuente-ux.github.io/actuaria-plus-ds/",
          "idioma": "es",
          "jerarquia_normativa": [
              "1. La decision del equipo de Actuaria",
              "2. El brandbook de Actuaria",
              "3. Las guias externas de UI/UX"],
          "reglas_duras": [
              "Si un color, fuente o valor no aparece en tokens.json o en /brand, NO es de marca: no lo inventes.",
              "RELIEVE = se puede pulsar · HUNDIDO = pulsado o activo · PLANO = informativo.",
              "Los rellenos son opacos: nada de alpha, porque el contraste tiene que poder calcularse.",
              "Titulos en Lemon Milk en mayusculas (respaldo Nunito Black); cuerpo en Prompt Regular.",
              "Naranja sobre navy: usar #FFBBA1 para cumplir AA; nunca #DF5E2D puro como texto sobre navy.",
              "El naranja no vale como relleno con texto pequeno encima: con blanco da 3.64.",
              "La plataforma es de escritorio; lo tactil se adapta con pointer: coarse, nunca por ancho."],
          "leyes": leyes,
          "tokens": tokens(),
          "componentes": comps}

    with open(os.path.join(RAIZ, "ds.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(ds, f, ensure_ascii=False, indent=2)

    # llms.txt · convencion llmstxt.org: indice corto en texto plano
    L = ["# Actuaria DS 27", "",
         "> Sistema de diseno neumorfico de Actuaria+, en Atomic Design.",
         "> Catalogo completo y legible por maquina en ds.json.", "",
         "## Reglas duras"]
    L += ["- " + r for r in ds["reglas_duras"]]
    L += ["", "## Componentes"]
    for c in comps:
        L.append("- [%s](%s): %s%s" % (c["nombre"], c["url"],
                 (c["clase"] + " — ") if c["clase"] else "", c["resumen"][:150]))
    L += ["", "## Fundamentos",
          "- [Tokens](%spages/00-tokens.html): %d tokens" % (ds["base"], len(ds["tokens"])),
          "- [Principios](%spages/00-principios.html): %d leyes" % (ds["base"], len(leyes)),
          "- [ds.json](%sds.json): catalogo completo" % ds["base"]]
    with open(os.path.join(RAIZ, "llms.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(L) + "\n")

    reales = [c for c in comps if c["tipo"] != "guia"]
    # Una pagina no lleva fragmento: su instancia ES la pagina entera,
    # y recortarla a diez lineas daria un ejemplo que no se sostiene.
    sin_ej = [c["nombre"] for c in reales
              if not c["ejemplo"] and c["tipo"] != "pagina"]
    sin_regla = [c["nombre"] for c in reales
                 if not c["usar_cuando"] and not c["requisitos"] and c["tipo"] != "pagina"]
    print("ds.json: %d componentes (+%d guias), %d tokens, %d leyes"
          % (len(reales), len(comps) - len(reales), len(ds["tokens"]), len(leyes)))
    print("llms.txt: %d lineas" % len(L))
    # Un catalogo a medias es peor que ninguno: el agente se fia igual.
    malo = False
    if len(reales) < 40:
        print("AVISO: solo %d componentes; revisa el extractor" % len(reales), file=sys.stderr); malo = True
    if len(leyes) != 12:
        print("AVISO: %d leyes, se esperaban 12" % len(leyes), file=sys.stderr); malo = True
    if sin_regla:
        print("AVISO: %d sin reglas ni requisitos: %s"
              % (len(sin_regla), ", ".join(sin_regla[:6])), file=sys.stderr); malo = True
    if sin_ej:
        print("AVISO: %d componentes sin ejemplo: %s"
              % (len(sin_ej), ", ".join(sin_ej[:6])), file=sys.stderr); malo = True
    return 1 if malo else 0

if __name__ == "__main__":
    raise SystemExit(main())
