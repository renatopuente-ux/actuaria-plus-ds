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
definidos = set()
for f in glob.glob(os.path.join(R, "css", "*.css")):
    definidos |= set(re.findall(r"(--[\w-]+)\s*:", open(f, encoding="utf-8").read()))

fallos = []
fuentes = (glob.glob(os.path.join(R, "css", "*.css"))
           + glob.glob(os.path.join(R, "pages", "*.html"))
           + glob.glob(os.path.join(R, "*.html")))
for f in fuentes:
    for n, linea in enumerate(open(f, encoding="utf-8"), 1):
        for m in re.finditer(r"var\(\s*(--[\w-]+)", linea):
            if m.group(1) not in definidos:
                fallos.append(f"{os.path.relpath(f, R)}:{n}  {m.group(1)}  ->  {linea.strip()[:70]}")

print(f"{len(definidos)} tokens definidos")
if fallos:
    print(f"\n{len(fallos)} REFERENCIA(S) FANTASMA:")
    for x in fallos:
        print("  " + x)
    sys.exit(1)
print("sin referencias fantasma")
