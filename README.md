## LyricForge – Generador Automático de Canciones

Aplicación web responsive que genera letras de canciones completas con un motor local (plantillas + variaciones).

## Características
- Home con CTA: “Crea tu canción en segundos”.
- Formulario: Género, Emoción, Tema opcional.
- Estructura: Estrofa 1, Puente, Coro, Estrofa 2, Estribillo, Coro repetido, Final.
- Acciones: Copiar, Guardar .txt, Compartir, Regenerar.

## Ejecutar
Servidor estático (no requiere backend). Por ejemplo:
- Python 3: python3 -m http.server 8000 --bind 0.0.0.0
- Node: npx serve -l 8000

Abre http://localhost:8000

## Arquitectura
- Motor en `app.js`, fácil de sustituir por backend/LLM.

## Licencia
MIT
