# Cartoon FX Remaster para Google AI Studio

Este paquete prepara las texturas PNG del proyecto Unity para utilizarlas como recursos de una app web en Google AI Studio.

## Contenido
- `public/assets/cfxr/`: texturas PNG listas para referenciar desde la app.
- `assets.catalog.json`: nombre, ruta, dimensiones, categoría y ruta original de cada PNG.
- `unity-prefabs-index.json`: índice de nombres/categorías de prefabs de Unity como referencia para el modelo.
- `PROMPT_AI_STUDIO_ES.txt`: prompt para pedir a AI Studio una integración basada en estos recursos.

## Uso
1. Extrae el ZIP.
2. En Google AI Studio, abre **Build** y añade los archivos del proyecto, o crea un repositorio GitHub con esta carpeta y usa **Import from GitHub**.
3. Pega el prompt de `PROMPT_AI_STUDIO_ES.txt`.
4. En la app web, las rutas de imagen empiezan por `/assets/cfxr/`.

Las imágenes son texturas, muchas con transparencia o spritesheets; se pueden mostrar como imágenes, pero los PNG por sí solos no reproducen la animación, el sistema de partículas ni los materiales originales.

## Compatibilidad
El original es un paquete de Unity. Los prefabs `.prefab`, materiales `.mat`, shaders `.shader`/`.cginc`, scripts C# y escenas `.unity` no se convierten automáticamente en efectos ejecutables de navegador. El índice de prefabs aporta nombres y categorías como contexto, pero recrear el comportamiento requiere implementarlo en la app web.
