"""Barrido de var(--token) sin definir.

Un var() inexistente NO da error: la propiedad cae a su valor inicial y el
componente se ve mal sin ninguna senal. Ha pasado tres veces en este repo:
  gap: var(--e-7)                 la escala salta del 6 al 8 -> gap 0
  border-color: var(--p-success-700)   no existia -> cae a currentColor
  color-mix(... var(--p-danger-text))  no existia -> degradado no se pinta

El linter del navegador no lo ve bien porque leer cssRules lanza excepcion
en file://. Esta comprobacion es estatica, sobre el fuente, y corre antes
de cada publicacion.
"""
import os, re, glob, sys

R = os.path.dirname(os.path.abspath(__file__))

# Una declaracion de token va precedida de `{`, `;` o espacio. El
# lookbehind descarta los nombres que son PARTE DE UN SELECTOR:
# `.a-btn--principal:hover` contiene literalmente `--principal:` y se
# colaba como si fuera un token. Daba 5 tokens inventados en el
# inventario y, peor, el comprobador los daba por definidos: un
# var(--principal) fantasma habria pasado sin avisar.
DECL = r"(?<![\w-])(--[\w-]+)\s*:"


def sin_comentarios(txt):
    """Un comentario que explica un token escribiendo `--x:` NO lo define.

    Contarlo como definido es peor que no contar nada: deja pasar un
    var(--x) fantasma que el navegador resolvera a vacio, que es
    justamente lo que esta comprobacion existe para evitar.
    """
    return re.sub(r"/\*.*?\*/", "", txt, flags=re.S)

definidos = set()
for f in glob.glob(os.path.join(R, "css", "*.css")):
    definidos |= set(re.findall(DECL,
                                sin_comentarios(open(f, encoding="utf-8").read())))

def zonas_css(f, linea):
    """En un .css manda la linea entera. En un .html, var() solo SURTE
    EFECTO dentro de style="" o de un bloque <style>: en la prosa es
    texto. La pagina de principios documenta el fallo de `var(--e-7)`
    escribiendolo, y marcarlo seria un falso positivo que acabaria
    ensenando a ignorar el informe."""
    if f.endswith(".css"):
        return [linea]
    return (re.findall(r'style="([^"]*)"', linea)
            + re.findall(r"style='([^']*)'", linea))

fallos = []
fuentes = (glob.glob(os.path.join(R, "css", "*.css"))
           + glob.glob(os.path.join(R, "pages", "*.html"))
           + glob.glob(os.path.join(R, "*.html")))
for f in fuentes:
    for n, linea in enumerate(open(f, encoding="utf-8"), 1):
        for zona in zonas_css(f, linea):
            for m in re.finditer(r"var\(\s*(--[\w-]+)", sin_comentarios(zona)):
                if m.group(1) not in definidos:
                    fallos.append(f"{os.path.relpath(f, R)}:{n}  {m.group(1)}  ->  {zona.strip()[:70]}")

print(f"{len(definidos)} tokens definidos")
if fallos:
    print(f"\n{len(fallos)} REFERENCIA(S) FANTASMA:")
    for x in fallos:
        print("  " + x)
    sys.exit(1)
print("sin referencias fantasma")
