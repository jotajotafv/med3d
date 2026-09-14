# MED3D: design brief
Design read: estudiantes y personas interesadas en medicina, registro científico sobrio, experiencia de exploración.
Concept spine: mesa de disección digital, revelar una estructura por vez.
Delivery tier: editorial con geometría 3D real interactiva como herramienta central.
Animation mode: non-animated — user: "No utilizar animaciones largas que ralenticen el uso." and "Cuando una experiencia requiera interacción tridimensional real, debe implementarse en 3D y no sustituirse por video."
La petición concreta de rendimiento, movimiento discreto y 3D real prima sobre el scroll de video predeterminado.
Brand: MED3D provisional; sin logo definitivo, solo nombre tipográfico.
Palette: #101C24 fondo; #172731 panel; #EDF3F5 texto; #A8B8C0 secundario; #86BEC8 acento.
Razón: paleta médica solicitada, sin neón. Rojo únicamente tejidos o aviso de emergencia.
Type: Geist + Geist Mono, escala contenida, sans serif profesional.
Corners: paneles 12px, controles 6px, microchips redondeados por función.
Motion: orbit control por usuario, separación anatómica amortiguada, hover 160ms; reduced-motion.
Hero: composición de modelo anatómico real, título breve a izquierda, espacio negativo, dos CTA compactas.
Section plan:
- Hero: texto y escena real manipulable.
- Tres vías de aprendizaje: filas numeradas con verbo, descripción y enlace.
- Anatomía destacada: un strip de órganos seleccionables a atlas.
- Procedimientos: díptico de imagen de instrumento y lista editorial.
- Primeros auxilios: módulo RCP destacado y mosaico de situaciones.
- Conoce tu cuerpo: notas breves con fuente y enlaces.
- Footer: mapa navegación, alcance educativo.
Eyebrow budget: 2.
Asset plan: Higgsfield reference board, composición editorial cover, fotografía conceptual equipo presión, equipo formación RCP.
No generación de logo definitivo, film ornamental, iconos de emergencia inexactos o falsas mallas médicas.
Generated content is not a medical reference. GLB anatomy comes from HRA/HuBMAP CC BY 4.0.
Functional UI icons: Phosphor consistent outline; dense atlas controls need legible exact glyphs.
CTA inventory:
- Explorar anatomía: relleno cian discreto con flecha.
- Descubrir la plataforma: enlace texto, scroll natural.
- Ruta educativa: fila completa, borde y movimiento corto de flecha.
- Ver procedimiento: enlace contextual integrado a imagen.
- Atlas controls: botones compactos con estados aria-pressed.
No emojis, fictional claims, testimonials, giant buttons, excessive decoration or blocking animation.
Mobile: nav toggled, single column hero, canvas 400px, atlas sheets, touch orbit and pinch.
Accessibility: headings, labelled controls, visible focus, keyboard tree, accessible textual alternative.
Scope: first functional version, selected organs, adult BP and CPR schematic scenes, expandable catalog.
Medical: reference links and documentary date, no claim of clinical validation.
Previous build axes: none in this conversation.
Performance goals: route lazy loading, local compressed GLB, DPR cap 1.5, no persistent hero animation.
Security: no forms, no accounts, no medical personal data or remote user input in first release.
