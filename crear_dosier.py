from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml
import os

doc = Document()

# ── Configurar márgenes ──
for section in doc.sections:
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin = Cm(3)
    section.right_margin = Cm(2.5)

# ── Estilos ──
style = doc.styles['Normal']
font = style.font
font.name = 'Calibri'
font.size = Pt(11)
style.paragraph_format.space_after = Pt(6)
style.paragraph_format.line_spacing = 1.15

for level in range(1, 4):
    h = doc.styles[f'Heading {level}']
    h.font.color.rgb = RGBColor(0x1A, 0x3C, 0x6E)
    h.font.name = 'Calibri'
    h.paragraph_format.space_before = Pt(18 if level == 1 else 12)
    h.paragraph_format.space_after = Pt(6)

# ── Función para borde de celda ──
def set_cell_shading(cell, color):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def add_formatted_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = ''
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_cell_shading(cell, '1A3C6E')
    for r_idx, row_data in enumerate(rows):
        for c_idx, val in enumerate(row_data):
            cell = table.rows[r_idx + 1].cells[c_idx]
            cell.text = ''
            p = cell.paragraphs[0]
            run = p.add_run(str(val))
            run.font.size = Pt(10)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if r_idx % 2 == 0:
                set_cell_shading(cell, 'EBF0F7')
    if col_widths:
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Cm(w)
    return table

# ═══════════════════════════════════════════════
# PORTADA
# ═══════════════════════════════════════════════
for _ in range(6):
    doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('DOSIER TÉCNICO')
run.font.size = Pt(28)
run.bold = True
run.font.color.rgb = RGBColor(0x1A, 0x3C, 0x6E)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('───────')
run.font.size = Pt(18)
run.font.color.rgb = RGBColor(0xC0, 0x80, 0x00)

doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('ACEITE ROMPE DOLOR')
run.font.size = Pt(36)
run.bold = True
run.font.color.rgb = RGBColor(0x8B, 0x00, 0x00)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('Analgésico tópico de origen natural')
run.font.size = Pt(16)
run.font.italic = True
run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run('')
run.font.size = Pt(11)

for _ in range(4):
    doc.add_paragraph()

info_lines = [
    ('Formulación:', 'F-ACE-002'),
    ('Versión:', '2.0'),
    ('Fecha de elaboración:', 'Mayo 2026'),
    ('Elaborado por:', '[Nombre del fabricante]'),
]
for label, value in info_lines:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(f'{label}  ')
    run.bold = True
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
    run = p.add_run(value)
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

doc.add_page_break()

# ═══════════════════════════════════════════════
# ÍNDICE
# ═══════════════════════════════════════════════
doc.add_heading('ÍNDICE', level=1)
toc_items = [
    '1. Ficha técnica del producto',
    '2. Composición cualitativa y cuantitativa',
    '3. Descripción de principios activos',
    '4. Descripción de los macerados vegetales',
    '5. Propiedades farmacológicas',
    '6. Indicaciones terapéuticas',
    '7. Contraindicaciones y precauciones',
    '8. Modo de empleo',
    '9. Reacciones adversas',
    '10. Presentación y condiciones de conservación',
    '11. Método de elaboración',
    '12. Control de calidad',
    '13. Bibliografía',
]
for item in toc_items:
    p = doc.add_paragraph(item)
    p.paragraph_format.space_after = Pt(4)

doc.add_page_break()

# ═══════════════════════════════════════════════
# 1. FICHA TÉCNICA
# ═══════════════════════════════════════════════
doc.add_heading('1. Ficha técnica del producto', level=1)

headers = ['Parámetro', 'Descripción']
rows = [
    ['Nombre del producto', 'Aceite Rompe Dolor'],
    ['Código de formulación', 'F-ACE-002'],
    ['Versión', '2.0'],
    ['Categoría', 'Analgésico tópico / Linimento'],
    ['Presentación', 'Frasco de vidrio ámbar con gotero'],
    ['Volumen neto', '250 ml (u otro según envasado)'],
    ['Vehículo', 'Aceite mineral (USP) con macerados vegetales'],
    ['pH', 'No aplica (producto oleoso)'],
    ['Densidad aprox.', '0.87 – 0.92 g/ml'],
    ['Conservación', 'Lugar fresco, seco y protegido de la luz'],
    ['Periodo de validez', '12 meses (con Vitamina E)'],
]
add_formatted_table(doc, headers, rows)

doc.add_paragraph()

# ═══════════════════════════════════════════════
# 2. COMPOSICIÓN
# ═══════════════════════════════════════════════
doc.add_heading('2. Composición cualitativa y cuantitativa', level=1)
doc.add_paragraph('Formulación para un lote de 2,815 ml de aceite base total.')

headers = ['Ingrediente', 'Cantidad', '% p/p aprox.', 'Función']
rows = [
    ['Aceite mineral (base sobrante)', '565 ml', '19.4%', 'Vehículo oleoso'],
    ['Macerado de Romero (Rosmarinus officinalis)', '~450 ml*', '16.0%', 'Antiinflamatorio, analgésico'],
    ['Macerado de Árnica (Arnica montana)', '~450 ml*', '16.0%', 'Antiinflamatorio, analgésico'],
    ['Macerado de Tomillo (Thymus vulgaris)', '~450 ml*', '16.0%', 'Antiséptico, rubefaciente'],
    ['Macerado de Caléndula (Calendula officinalis)', '~450 ml*', '16.0%', 'Cicatrizante, antiinflamatorio'],
    ['Macerado de Cedro (Cedrus atlantica)', '~450 ml*', '16.0%', 'Antiséptico, astringente'],
    ['Alcanfor (C10H16O)', '180 g', '6.3%', 'Analgésico tópico, rubefaciente'],
    ['Mentol cristalizado (C10H20O)', '100 g', '3.5%', 'Analgésico, efecto refrigerante'],
    ['Salicilato de metilo (C8H8O3)', '250 ml', '8.6%', 'Antiinflamatorio, antirreumático'],
    ['Aceite esencial de Eucalipto', '15 ml', '0.5%', 'Sinergista, penetración cutánea'],
    ['Vitamina E (acetato de tocoferilo)', '5 ml', '0.2%', 'Antioxidante, estabilizante'],
]
add_formatted_table(doc, headers, rows)

p = doc.add_paragraph()
run = p.add_run('* Cantidad aproximada después del filtrado de la maceración (recuperación estimada del 90% sobre 500 ml por planta).')
run.font.size = Pt(9)
run.italic = True
run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

doc.add_page_break()

# ═══════════════════════════════════════════════
# 3. PRINCIPIOS ACTIVOS
# ═══════════════════════════════════════════════
doc.add_heading('3. Descripción de principios activos', level=1)

actives = [
    ('Alcanfor', 'C10H16O',
     'Compuesto terpénico cristalino blanco de aroma característico. Se obtiene de la madera del alcanforero (Cinnamomum camphora) o por síntesis. Actúa como rubefaciente y analgésico tópico. Penetra la piel produciendo una sensación de calor moderado que alivia dolores musculares y articulares. Concentración en fórmula: ~6.3%.'),
    ('Mentol cristalizado', 'C10H20O',
     'Alcohol terpénico cristalino obtenido del aceite esencial de menta (Mentha piperita). Proporciona una sensación de frío intenso mediante la activación de los canales TRPM8. Produce analgesia por contrairritación y modulación de la percepción del dolor. Concentración en fórmula: ~3.5%.'),
    ('Salicilato de metilo', 'C8H8O3',
     'Éster metílico del ácido salicílico, de aroma inconfundible. Es un antiinflamatorio y analgésico tópico del grupo de los salicilatos. Se absorbe a través de la piel y actúa inhibiendo la ciclooxigenasa (COX), reduciendo la síntesis de prostaglandinas implicadas en el proceso inflamatorio. Concentración en fórmula: ~8.6%.'),
    ('Aceite esencial de Eucalipto', '—',
     'Obtenido por destilación de las hojas de Eucalyptus globulus. Su componente principal, el eucaliptol (1,8-cineol), posee propiedades analgésicas y antiinflamatorias, además de potenciar la penetración transdérmica de los demás principios activos. Aporta un aroma refrescante que mejora la experiencia sensorial del producto. Concentración en fórmula: ~0.5%.'),
    ('Vitamina E (α-tocoferol)', 'C29H50O2',
     'Potente antioxidante liposoluble. Protege los ácidos grasos de los aceites macerados frente a la oxidación y el enranciamiento. Además, contribuye a la regeneración cutánea y potencia el efecto antiinflamatorio. Concentración en fórmula: ~0.2%.'),
]

for name, formula, desc in actives:
    doc.add_heading(name, level=2)
    p = doc.add_paragraph()
    run = p.add_run(f'Fórmula molecular: {formula}')
    run.bold = True
    run.font.size = Pt(10)
    doc.add_paragraph(desc)

# ═══════════════════════════════════════════════
# 4. MACERADOS VEGETALES
# ═══════════════════════════════════════════════
doc.add_heading('4. Descripción de los macerados vegetales', level=1)
doc.add_paragraph(
    'Los macerados se elaboran mediante la extracción por contacto de drogas vegetales secas en aceite mineral '
    'durante un período de 7 a 14 días, con agitación periódica y protección de la luz. Posteriormente se filtran '
    'para obtener un aceite medicinal enriquecido con los principios activos liposolubles de cada planta.'
)

herbs = [
    ('Romero (Rosmarinus officinalis)',
     'Contiene ácido rosmarínico, flavonoides y aceite esencial (alcanfor, borneol, eucaliptol). '
     'Propiedades antiinflamatorias, analgésicas y rubefacientes. Mejora la circulación local.'),
    ('Árnica (Arnica montana)',
     'Contiene lactonas sesquiterpénicas (helenalina), flavonoides y aceite esencial. '
     'Antiinflamatorio y analgésico tópico de referencia para contusiones, hematomas y dolores musculares.'),
    ('Tomillo (Thymus vulgaris)',
     'Contiene timol, carvacrol, flavonoides y ácidos fenólicos. '
     'Antiséptico, rubefaciente y ligeramente analgésico. Complementa la acción de los demás activos.'),
    ('Caléndula (Calendula officinalis)',
     'Contiene triterpenoides (faradiol), flavonoides y carotenoides. '
     'Antiinflamatorio, cicatrizante y regenerador cutáneo. Ideal para dolores con componente inflamatorio.'),
    ('Cedro (Cedrus atlantica / Cedrus deodara)',
     'Contiene sesquiterpenos (himachalol, atlantona) con propiedades antisépticas, '
     'astringentes y antiinflamatorias. Contribuye a la estabilidad microbiológica del producto.'),
]

for name, desc in herbs:
    p = doc.add_paragraph()
    run = p.add_run(f'{name}: ')
    run.bold = True
    run.font.size = Pt(10)
    run = p.add_run(desc)
    run.font.size = Pt(10)

doc.add_page_break()

# ═══════════════════════════════════════════════
# 5. PROPIEDADES FARMACOLÓGICAS
# ═══════════════════════════════════════════════
doc.add_heading('5. Propiedades farmacológicas', level=1)

doc.add_heading('Mecanismo de acción', level=2)
doc.add_paragraph(
    'El Aceite Rompe Dolor actúa mediante tres mecanismos complementarios:\n\n'
    '1. Efecto contrairritante: El alcanfor, mentol y salicilato de metilo estimulan los receptores '
    'sensoriales de la piel, produciendo sensaciones alternas de calor y frío que compiten con la '
    'señal dolorosa a nivel medular (teoría de la compuerta del dolor de Melzack y Wall).\n\n'
    '2. Inhibición de la cascada inflamatoria: El salicilato de metilo inhibe la ciclooxigenasa (COX), '
    'reduciendo la síntesis de prostaglandinas. Los macerados de árnica, romero y caléndula aportan '
    'flavonoides y terpenoides con acción antiinflamatoria complementaria.\n\n'
    '3. Vasomodulación periférica: El mentol produce vasoconstricción inicial seguida de vasodilatación, '
    'mientras que el alcanfor provoca rubefacción, mejorando el flujo sanguíneo local y facilitando '
    'la eliminación de mediadores inflamatorios.'
)

doc.add_heading('Farmacocinética (vía tópica)', level=2)
doc.add_paragraph(
    'Penetración transdérmica favorecida por el vehículo oleoso y la presencia de aceite esencial de '
    'eucalipto (potenciador de absorción). Los activos alcanzan tejidos subcutáneos y músculo superficial. '
    'El salicilato de metilo se absorbe y es hidrolizado por esterasas cutáneas liberando ácido salicílico. '
    'El alcanfor y mentol se absorben rápidamente y se eliminan por vía renal tras metabolización hepática.'
)

# ═══════════════════════════════════════════════
# 6. INDICACIONES
# ═══════════════════════════════════════════════
doc.add_heading('6. Indicaciones terapéuticas', level=1)

indicaciones = [
    'Dolores musculares y contracturas',
    'Dolores articulares (artritis, artrosis, reumatismo)',
    'Lumbalgia y dorsalgia',
    'Torceduras, esguinces y contusiones',
    'Hematomas y equimosis',
    'Dolores cervicales y tortícolis',
    'Calambres musculares',
    'Dolor post-esfuerzo o post-ejercicio',
]
for ind in indicaciones:
    p = doc.add_paragraph(ind, style='List Bullet')

# ═══════════════════════════════════════════════
# 7. CONTRAINDICACIONES
# ═══════════════════════════════════════════════
doc.add_heading('7. Contraindicaciones y precauciones', level=1)

doc.add_heading('Contraindicaciones absolutas', level=2)
contra = [
    'Hipersensibilidad conocida a alguno de los componentes (salicilatos, alcanfor, mentol, plantas de la familia Asteraceae como árnica y caléndula)',
    'No aplicar sobre heridas abiertas, piel irritada, quemaduras o eczemas',
    'Embarazo y lactancia (especialmente en abdomen y zonas extensas)',
    'Niños menores de 6 años (riesgo de toxicidad por alcanfor)',
    'Antecedentes de asma bronquial sensible a salicilatos',
]
for c in contra:
    doc.add_paragraph(c, style='List Bullet')

doc.add_heading('Precauciones', level=2)
prec = [
    'Uso exclusivo externo. No ingerir. Evitar contacto con ojos y mucosas.',
    'No aplicar en grandes extensiones de piel ni con vendajes oclusivos.',
    'En caso de irritación o erupción cutánea, suspender el uso inmediatamente.',
    'Lavarse las manos después de cada aplicación.',
    'Mantener fuera del alcance de los niños.',
    'No usar junto con otros analgésicos tópicos sin supervisión.',
    'No exponer la zona tratada a fuentes de calor directas (bolsas de agua caliente, lámparas infrarrojas) para evitar quemaduras.',
]
for p_text in prec:
    doc.add_paragraph(p_text, style='List Bullet')

doc.add_page_break()

# ═══════════════════════════════════════════════
# 8. MODO DE EMPLEO
# ═══════════════════════════════════════════════
doc.add_heading('8. Modo de empleo', level=1)

p = doc.add_paragraph()
run = p.add_run('Posología:')
run.bold = True
doc.add_paragraph(
    'Aplicar de 3 a 5 ml del aceite sobre la zona dolorida, realizando un masaje suave y circular '
    'hasta su completa absorción. Repetir la aplicación 2 a 3 veces al día, o según necesidad. '
    'No superar las 4 aplicaciones en 24 horas.'
)

p = doc.add_paragraph()
run = p.add_run('Instrucciones de aplicación:')
run.bold = True
pasos = [
    'Agitar bien el frasco antes de cada uso.',
    'Verter la cantidad necesaria en la palma de la mano.',
    'Aplicar mediante masaje suave en la zona afectada.',
    'Dejar secar al aire durante 1-2 minutos antes de vestirse.',
    'Lavar las manos tras la aplicación.',
]
for paso in pasos:
    doc.add_paragraph(paso, style='ListBullet')

doc.add_paragraph('Duración del tratamiento: Según criterio del paciente, sin exceder 7-10 días consecutivos. '
                   'Si el dolor persiste, consultar a un profesional de la salud.')

# ═══════════════════════════════════════════════
# 9. REACCIONES ADVERSAS
# ═══════════════════════════════════════════════
doc.add_heading('9. Reacciones adversas', level=1)

headers = ['Frecuencia', 'Reacción']
rows = [
    ['Frecuentes (>1/100)', 'Sensación de calor o frío intenso transitorio en la zona de aplicación'],
    ['Poco frecuentes (<1/100)', 'Eritema leve, prurito o sensación de hormigueo'],
    ['Raras (<1/1000)', 'Reacciones alérgicas cutáneas (dermatitis de contacto)'],
    ['Muy raras (<1/10000)', 'Broncoespasmo en pacientes con asma sensible a salicilatos'],
]
add_formatted_table(doc, headers, rows)

doc.add_paragraph()
doc.add_paragraph('En caso de reacción adversa, suspender el uso y consultar a un profesional de la salud.')

# ═══════════════════════════════════════════════
# 10. PRESENTACIÓN Y CONSERVACIÓN
# ═══════════════════════════════════════════════
doc.add_heading('10. Presentación y condiciones de conservación', level=1)

headers = ['Parámetro', 'Especificación']
rows = [
    ['Envase', 'Frasco de vidrio ámbar con tapa de seguridad y gotero'],
    ['Capacidad', '250 ml, 500 ml o según presentación comercial'],
    ['Etiquetado', 'Según normativa local (nombre, composición, lote, fecha de caducidad, precauciones)'],
    ['Temperatura de conservación', '15 – 25 °C (temperatura ambiente, evitar calor extremo)'],
    ['Protección de la luz', 'Sí — conservar en envase ámbar, protegido de la luz directa'],
    ['Humedad', 'Ambiente seco, libre de humedad'],
    ['Vida útil estimada', '12 meses a partir de la fecha de elaboración (con Vitamina E)'],
    ['Periodo post-apertura', '6 meses después de abierto'],
]
add_formatted_table(doc, headers, rows)

doc.add_page_break()

# ═══════════════════════════════════════════════
# 11. MÉTODO DE ELABORACIÓN
# ═══════════════════════════════════════════════
doc.add_heading('11. Método de elaboración', level=1)

doc.add_heading('11.1 Elaboración de los macerados vegetales', level=2)
pasos_mac = [
    'Pesar 100 g de cada droga vegetal seca y troceada (romero, árnica, tomillo, caléndola, cedro).',
    'Colocar cada planta por separado en un recipiente de vidrio ámbar con tapa hermética.',
    'Cubrir cada una con 500 ml de aceite mineral.',
    'Cerrar herméticamente y etiquetar con nombre y fecha.',
    'Dejar macerar durante 7 a 14 días a temperatura ambiente (20-25 °C), protegido de la luz.',
    'Agitar suavemente una vez al día para facilitar la extracción.',
    'Transcurrido el tiempo, filtrar cada macerado con filtro de tela o papel de filtro.',
    'Recoger el aceite filtrado. Rendimiento aproximado: 90%, unos 450 ml por cada planta.',
]
for i, paso in enumerate(pasos_mac, 1):
    doc.add_paragraph(f'{i}. {paso}')

doc.add_heading('11.2 Preparación del Aceite Rompe Dolor', level=2)
pasos_prep = [
    'En un recipiente de vidrio o acero inoxidable, verter los 250 ml de salicilato de metilo.',
    'Agregar los 180 g de alcanfor y los 100 g de mentol cristalizado al salicilato de metilo.',
    'Agitar o remover hasta disolución completa de los cristales.',
    'Incorporar los 15 ml de aceite esencial de eucalipto y los 5 ml de vitamina E. Mezclar.',
    'En un recipiente más grande (capacidad mínima 3.5 L), verter los 2,815 ml de aceite base:',
    '\ta) 565 ml de aceite mineral puro sobrante',
    '\tb) ~2,250 ml de la mezcla de los 5 macerados vegetales filtrados',
    'Verter lentamente la mezcla de principios activos sobre el aceite base, agitando constantemente.',
    'Agitar durante 5-10 minutos para garantizar la homogeneidad.',
    'Envasar en frascos de vidrio ámbar, etiquetar con número de lote y fecha de caducidad.',
]
for i, paso in enumerate(pasos_prep, 1):
    doc.add_paragraph(f'{i}. {paso}')

# ═══════════════════════════════════════════════
# 12. CONTROL DE CALIDAD
# ═══════════════════════════════════════════════
doc.add_heading('12. Control de calidad', level=1)

headers = ['Parámetro', 'Método', 'Especificación']
rows = [
    ['Aspecto', 'Inspección visual', 'Líquido oleoso límpido, ligeramente amarillento-verdoso'],
    ['Olor', 'Organoléptico', 'Característico a alcanfor, mentol y salicilato'],
    ['Homogeneidad', 'Inspección visual', 'Sin separación de fases ni precipitados visibles'],
    ['Densidad', 'Pienometría (25 °C)', '0.87 – 0.92 g/ml'],
    ['Índice de refracción', 'Refractometría (25 °C)', '1.460 – 1.470'],
    ['Estabilidad oxidativa', 'Prueba de enranciamiento', 'Sin cambios significativos a 40 °C / 75% HR / 30 días'],
    ['Recuento microbiológico', 'Si es aplicable', '< 100 UFC/g (hongos y levaduras), < 10 UFC/g (bacterias)'],
    ['Prueba de irritación', 'Prueba parche (patch test)', 'No irritante primario en piel humana'],
]
add_formatted_table(doc, headers, rows)

doc.add_paragraph()

# ═══════════════════════════════════════════════
# 13. BIBLIOGRAFÍA
# ═══════════════════════════════════════════════
doc.add_heading('13. Bibliografía', level=1)

refs = [
    'Bruneton, J. (2001). Farmacognosia: Fitoquímica. Plantas Medicinales. 2ª ed. Editorial Acribia.',
    'Pérez-López, F. et al. (2018). "Efficacy of topical methyl salicylate and menthol in musculoskeletal pain." Pain Research and Management, 2018, 1-8.',
    'European Medicines Agency (EMA). (2016). "Assessment report on Camphora." EMA/HMPC/162241/2014.',
    'Blumenthal, M. et al. (2000). Herbal Medicine: Expanded Commission E Monographs. American Botanical Council.',
    'Farmacopea de los Estados Unidos Mexicanos (FEUM). Monografías de drogas vegetales.',
    'Martindale: The Complete Drug Reference. (2017). 39th ed. Pharmaceutical Press.',
    'World Health Organization (WHO). (2004). WHO Monographs on Selected Medicinal Plants. Vol. 2.',
    'Kligman, A.M. (1983). "A biological approach to the therapy of acne." (Métodos de evaluación de irritación cutánea).',
]
for i, ref in enumerate(refs, 1):
    doc.add_paragraph(f'{i}. {ref}')

# ── Guardar ──
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Dosier_Aceite_Rompe_Dolor.docx')
doc.save(output_path)
print(f'Documento guardado: {output_path}')
