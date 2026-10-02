# Carpintería Valdevez

Landing estática en español, basada en la opción 2 aprobada: título centrado, crema y oliva, retrato personalizado de Porfirio bajo la llamada a WhatsApp y galería de inspiración.

## Vista local

Requiere Node.js. Ejecutar `node serve.mjs` y abrir `http://127.0.0.1:4173`.

## Retrato

El retrato de Porfirio es estático. Se retiraron el efecto de deformación facial, el seguimiento del cursor, su aviso y el control de pausa. Se conservan las transiciones de entrada del contenido.

## Contenido y contacto

WhatsApp: +58 414 0331941, tomado del material de marca compartido. Instagram: @carpinteriavaldevez. No hay formularios ni almacenamiento de datos. Los enlaces abren la conversación para que el visitante envíe su consulta. La galería reúne fotografías de trabajos y del taller compartidas por Carpintería Valdevez. Las muestras de madera son texturas ilustrativas, no una identificación botánica.

## Archivos

- `dist/index.html`: contenido y enlaces.
- `dist/styles.css`: diseño responsive y entradas animadas.
- `dist/centered-hero.css`: composición de la opción 2 y adaptación móvil.
- `dist/assets/porfirio-centered.webp`: escena optimizada de 123 KB; PNG conservado como original.
- `dist/motion-math.js`: coordenadas y amortiguación.
- `dist/assets/`: arte local optimizado para web.
- `verify.mjs`: comprobaciones de mapeo del cursor y recursos.

Validación: `node verify.mjs`; `node --check dist/app.js`.

## Optimización de carga y SEO (2026-10-02)

La galería usa 17 copias WebP de hasta 1280 píxeles (1,42 MB en total frente a 9,08 MB de los originales), con dimensiones explícitas y carga diferida desde el HTML. Los originales se conservan. El favicon y el icono de Apple tienen tamaños específicos; el logo de los datos estructurados usa una copia de 512 píxeles. Los videos tienen `preload="none"` para evitar descargar metadatos antes de reproducirse; sus portadas todavía pueden descargarse. El encabezado de trabajos identifica el servicio y Caracas. Se conserva el título, la descripción, la URL canónica y el marcado LocalBusiness, incorporando el año de fundación ya visible en la página.

Después de publicar, repetir Lighthouse móvil y escritorio sin extensiones. Estos cambios no constituyen una nueva medición de Lighthouse ni garantizan posiciones en Google.

Comparación visual e interacciones: `design-qa.md` y capturas en `output/`.

La configuración de Sites está en `.openai/hosting.json`. Mantener su ID para siguientes publicaciones. No se requieren dependencias, claves API ni un proceso de compilación.
