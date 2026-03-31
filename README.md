# Marvin Baptista Portfolio

Sitio web estatico creado para presentar el portafolio profesional de **Marvin Baptista**:

- Experiencia en VR/Game Development
- Proyectos de Web Development
- Demos, stack tecnico y contacto profesional

El objetivo es tener una web rapida, simple de mantener y facil de publicar en GitHub Pages.

## Caracteristicas

- Sitio **100% estatico** (HTML, CSS, JavaScript)
- Secciones enfocadas en conversion profesional (showcase, proyectos, contacto)
- Galerias con imagenes locales
- Portafolio web configurable desde `main.js`
- Listo para desplegar en `docs/` con GitHub Pages

## Estructura del proyecto

```txt
/
|-- docs/
|   |-- index.html
|   |-- assets/
|   |   |-- css/style.css
|   |   |-- js/main.js
|   |   `-- img/
|-- README.md
`-- .gitignore
```

## Ejecutar localmente

1. Abrir `docs/index.html` en el navegador.
2. Recomendado: levantar un servidor estatico para evitar rutas `file://`.

Ejemplo:

```bash
npx serve docs
```

## Personalizacion rapida

- Contenido principal: `docs/index.html`
- Estilos visuales: `docs/assets/css/style.css`
- Proyectos web (imagenes + links): `docs/assets/js/main.js`
- Imagenes del portafolio web: `docs/assets/img/web/`

## Deploy en GitHub Pages

1. Subir el repo a la rama `main`.
2. Ir a **Settings > Pages**.
3. En *Build and deployment*, elegir:
   - Branch: `main`
   - Folder: `/docs`
4. Guardar y esperar la publicacion.

## Enfoque del proyecto

Este repositorio esta pensado para evolucionar como una vitrina profesional:

- Mostrar resultados reales
- Consolidar marca personal
- Facilitar contacto con clientes y reclutadores