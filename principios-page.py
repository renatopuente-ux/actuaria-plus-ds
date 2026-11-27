"""Genera pages/00-principios.html.

La prosa se escribe aqui, pero la COBERTURA se lee de qa.js. Un principio
sin comprobacion que lo vigile es una intencion, no una regla: si la
tabla se copiase a mano, en dos semanas dira que algo se verifica cuando
ya no se verifica.
"""
import os, re

R = os.path.dirname(os.path.abspath(__file__))

def comprobaciones():
    q = open(os.path.join(R, "qa.js"), encoding="utf-8").read()
    return sorted(set(re.findall(r"F\('([\w-]+)'", q)))

# (titulo, regla, mecanismo, [comprobaciones que lo vigilan])
PRINCIPIOS = [
 ("El relieve dice qu\u00e9 se pulsa",
  "Relieve en reposo = se pulsa. Hundido = ya est\u00e1 activo. Plano y opaco = "
  "solo informa.",
  "Es la \u00fanica se\u00f1al que distingue un control de una etiqueta cuando los dos "
  "son una p\u00edldora peque\u00f1a. Un elemento que invita a pulsar y no responde no se "
  "lee como decorativo: se lee como interfaz rota.",
  ["relieve", "cursor", "deshabilitado"]),

 ("La ley gobierna controles, no enlaces",
  "Un enlace no se pulsa, se sigue. Va en texto plano y se identifica por color, "
  "subrayado, cursor y contexto. Si lleva fondo o borde propio, vuelve a ser un "
  "control y la ley le alcanza.",
  "Si la ley alcanzara a los enlaces, cada enlace de un p\u00e1rrafo tendr\u00eda que ser "
  "un bot\u00f3n. Y dar relieve a los seis enlaces de un men\u00fa hace que el activo deje "
  "de verse.",
  ["enlace", "enlace-solo-color", "relieve"]),

 ("La sombra la decide el sustrato",
  "La pareja de sombras sale de la superficie INMEDIATA, no de la p\u00e1gina. Un "
  "elemento de color propio no puede estar extruido: va dentro de un anillo del "
  "color del lienzo.",
  "En cuanto un componente introduce una sub-superficie de color \u2014la pista de un "
  "interruptor, una cabecera navy\u2014 lo que se apoya encima hereda por inercia la "
  "pareja clara y aparece un halo gris sucio.",
  ["relieve"]),

 ("La forma es la segunda se\u00f1al",
  "P\u00edldora completa solo en botones. Rect\u00e1ngulo suave en lo que se escribe. "
  "C\u00edrculo con relieve = bot\u00f3n de icono; c\u00edrculo plano = icono informativo.",
  "La redundancia es deliberada: si alguien toca las sombras, la forma sigue "
  "diciendo para qu\u00e9 sirve cada cosa.",
  ["forma"]),

 ("Opaco, nunca un tinte con alpha",
  "Los rellenos son colores s\u00f3lidos. Nada de <code>rgba()</code> como fondo de "
  "algo que lleve texto.",
  "Un relleno transl\u00facido hereda la superficie de debajo: la misma pastilla mide "
  "8:1 sobre blanco y 1.32:1 sobre navy. El contraste deja de ser calculable.",
  []),

 ("Se mide con WCAG 2 y con APCA",
  "Los dos modelos, siempre. Cuando discrepen, mirar el componente.",
  "WCAG 2 sobrepondera el offset +0.05 en luminancias bajas, as\u00ed que en tonos "
  "medios saturados premia el texto oscuro cuando el ojo pide el claro. Sobre el "
  "naranja de marca: WCAG 2 dice 5.05 para la tinta oscura y APCA dice 39.8, que "
  "no llega al m\u00ednimo legible.",
  []),

 ("Para salvar un contraste se cambia el texto, nunca la marca",
  "El color de marca se queda. Se cambia la tinta, el tama\u00f1o o la FORMA del "
  "componente.",
  "Un relleno oscuro y saturado no sostiene texto peque\u00f1o, y forzar el bot\u00f3n a "
  "crecer para aprobar la casilla produce un bot\u00f3n de portada metido en una barra "
  "de herramientas. La salida es que el color no tenga que sostener texto: aro de "
  "color sobre superficie clara.",
  []),

 ("El nivel de un sem\u00e1ntico se elige midiendo",
  "No por el nombre. Los niveles del brandbook no est\u00e1n igualados "
  "perceptualmente: <code>ok</code> y <code>error</code> funcionan con su 100, "
  "<code>aviso</code> necesita el 500 y <code>info</code> no funciona con ninguno "
  "neto.",
  "El 100 de info es un lavado casi blanco (87.9 de luminosidad) mientras sus "
  "hermanos son tonos saturados entre 42 y 71. Usarlo por coherencia de nombre "
  "lo hace desaparecer sobre la superficie.",
  []),

 ("Escritorio primero, y la escala la decide el puntero",
  "Las reglas t\u00e1ctiles se condicionan a <code>pointer: coarse</code>, nunca a un "
  "ancho.",
  "Un iPad en horizontal mide 1024px y sigue siendo t\u00e1ctil. El m\u00ednimo de 16px en "
  "campos existe solo por el zoom autom\u00e1tico de iOS, as\u00ed que imponerlo en "
  "escritorio roba densidad sin dar nada.",
  ["tactil-44", "entrada-16px", "area-tactil"]),

 ("Se verifica la maquetaci\u00f3n, no solo el color",
  "Un <code>var()</code> inexistente no da error: la propiedad cae a su valor "
  "inicial y el componente se ve mal en silencio.",
  "<code>gap: var(--e-7)</code> con una escala que salta del 6 al 8 deja "
  "<code>gap: 0</code> y los elementos se montan. Ning\u00fan grep lo ve: hay que "
  "preguntar al valor computado.",
  ["var-fantasma", "variante-fantasma", "texto-partido", "alineacion", "tapado",
   "id-repetido", "medida", "plantilla"]),

 ("Un validador con falsos positivos se acaba ignorando",
  "Cada comprobaci\u00f3n nueva debe demostrar que SABE fallar: inyectar el defecto, "
  "ver que lo caza, retirarlo y ver que vuelve a cero.",
  "Un informe con rojos que no son problemas ense\u00f1a a ignorar los rojos que s\u00ed "
  "lo son. Y un cero por una prueba que no se ejecut\u00f3 es peor que un fallo.",
  []),

 ("Un concepto, un bloque",
  "Las variantes viven dentro del \u00e1tomo. Una capa superior compone: no introduce "
  "color ni sombra propios.",
  "Si una mol\u00e9cula necesita un valor que no existe abajo, lo que falta es un "
  "\u00e1tomo, no una excepci\u00f3n en la mol\u00e9cula.",
  ["sin-nombre", "emoji", "movimiento"]),
]

JERARQUIA = [
  ("1", "La decisi\u00f3n del equipo de Actuaria",
   "Manda sobre todo lo dem\u00e1s, incluidas las gu\u00edas externas y este documento."),
  ("2", "El brandbook",
   "Normativo. <q>Si un color, fuente o valor no aparece en tokens.json o en "
   "/brand, NO es de marca: no lo inventes.</q> Cuando el brandbook y la "
   "producci\u00f3n difieran, manda el brandbook y la brecha se <strong>reporta</strong>, "
   "nunca se resuelve en silencio."),
  ("3", "Las gu\u00edas externas de UI/UX",
   "\u00datiles mientras no contradigan a las dos anteriores. Donde chocan, queda "
   "anotado: aqu\u00ed la sombra S\u00cd es affordance y los r\u00f3tulos de marca S\u00cd van en "
   "may\u00fasculas."),
]

def construir():
    p = ['<section class="ficha" id="jerarquia"><h2>Jerarqu\u00eda normativa</h2>'
         '<p class="resumen">Cuando dos fuentes se contradicen, gana la de arriba. '
         'Esto no es una preferencia: es el orden con el que se resuelve cualquier '
         'discusi\u00f3n sobre este sistema.</p><ol class="pr-jer">']
    for n, t, d in JERARQUIA:
        p.append(f'<li><span class="pr-n">{n}</span><div><h3>{t}</h3><p>{d}</p></div></li>')
    p.append("</ol></section>")

    p.append('<section class="ficha" id="leyes"><h2>Las leyes</h2>'
             '<p class="resumen">Cada una dice qu\u00e9 comprobaci\u00f3n la vigila. '
             'Un principio sin comprobaci\u00f3n es una intenci\u00f3n, no una regla.</p>')
    for i, (tit, regla, porque, checks) in enumerate(PRINCIPIOS, 1):
        vig = ("".join(f'<code class="pr-chk">{c}</code>' for c in checks)
               if checks else '<span class="pr-manual">revisi\u00f3n humana</span>')
        p.append(
          f'<article class="pr-ley"><h3><span class="pr-i">{i:02d}</span>{tit}</h3>'
          f'<p class="pr-regla">{regla}</p>'
          f'<p class="pr-porque"><strong>Por qu\u00e9.</strong> {porque}</p>'
          f'<p class="pr-vig"><strong>Lo vigila:</strong> {vig}</p></article>')
    p.append("</section>")

    todas = comprobaciones()
    usadas = {c for _, _, _, cs in PRINCIPIOS for c in cs}
    sueltas = [c for c in todas if c not in usadas]
    p.append('<section class="ficha" id="cobertura"><h2>Cobertura</h2>'
             f'<p class="resumen">{len(todas)} comprobaciones automaticas, le\u00eddas de '
             '<code>qa.js</code>, m\u00e1s <code>tokens-check.py</code> sobre el fuente. '
             'La lista se genera: no puede quedarse atr\u00e1s.</p>'
             '<div class="pr-chips">')
    for c in todas:
        clase = "pr-chk" + ("" if c in usadas else " pr-chk--suelta")
        p.append(f'<code class="{clase}">{c}</code>')
    p.append("</div>")
    if sueltas:
        p.append('<p class="pr-nota">En gris, las comprobaciones que a\u00fan no cuelgan de '
                 'ninguna ley escrita: o falta la ley, o sobra la comprobaci\u00f3n.</p>')
    p.append("</section>")
    return "\n".join(p)

if __name__ == "__main__":
    HEAD = open(os.path.join(R, "_plantilla", "head.html"), encoding="utf-8").read()
    PIE = open(os.path.join(R, "_plantilla", "pie.html"), encoding="utf-8").read()
    intro = ('<header class="esc-intro"><h1>Principios</h1>'
             '<p>Las reglas que deciden c\u00f3mo se construye cada pieza, y la '
             'comprobaci\u00f3n que vigila cada una.</p></header>')
    salida = (HEAD.format(titulo="Principios", base="../") + intro + construir() + "\n"
              + PIE.replace("{base}", "../"))
    open(os.path.join(R, "pages", "00-principios.html"), "w",
         encoding="utf-8", newline="\n").write(salida)
    print(f"pages/00-principios.html: {len(PRINCIPIOS)} leyes, "
          f"{len(comprobaciones())} comprobaciones")
