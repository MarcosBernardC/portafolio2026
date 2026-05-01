- # Changelog

  Todos los cambios notables en este proyecto serán documentados en este archivo.

  ## [1.2.0] - 2026-05-01

  ### Added
  
  - **Markdown Post-Processor:** Motor de limpieza quirúrgica para etiquetas `<p>` redundantes en badges de GitHub, permitiendo alineación horizontal nativa.
  - **Dynamic Truncation:** Sistema de control de desbordamiento tipográfico para títulos de proyectos (>27 caracteres).
  
  ### Fixed
  
  - **Visual Consistency:** Eliminación de saltos de línea forzados en la cabecera del visor de documentos, alineando badges de estado y motor de orquestación.
  - **Alignment:** Corrección de micro-márgenes en elementos de telemetría para mantener el minimalismo industrial.

  ------
  
  ## [1.1.1] - 2026-05-01
  
  ### Changed
  
  - **UX Refinement:** Optimización del motor de animaciones mediante doble frame de renderizado (`requestAnimationFrame`) para eliminar artefactos visuales en los avisos de seguridad.
  - **Cinematic Transitions:** Sincronización de tiempos de desvanecimiento y desplazamiento para una experiencia de usuario más fluida y profesional.
  
  ------

  ## [1.1.0] - 2026-05-01
  
  ### Added
  
  - **Dynamic Sorting Engine:** Implementación de lógica de ordenamiento automático que prioriza activos públicos y desplaza activos privados al final de cada sección.
  - **Protocolo Visual de Privacidad:** Integración de identidad visual `#DE6143` (Terracota Industrial) para la señalización de activos restringidos.
  - **Numeración Autoincremental:** Sistema de IDs dinámicos para proyectos que garantiza una secuencia limpia (`01.`, `02.`, etc.) independientemente del origen de datos.
  - **Sincronización Operacional:** Inyección dinámica del stack de entorno (Fedora/NVIM) y estado de sincronización (`SYNC_OK`) directamente desde los metadatos del sistema.
  
  ### Changed
  
  - **Arquitectura de Secciones:** Transición de un modelo de tres secciones a una estructura plana basada en madurez: `ACTIVE LABS` y `LEGACY ARCHIVE`.
  - **UX de Interacción:** Sustitución de cursores ambiguos por un sistema de botones diferenciados (`SRC // REPO` vs `PRIV // ARCH`) con avisos de seguridad personalizados.
  
  ### Fixed
  
  - **Normalización de Datos:** Corrección en el motor de renderizado para manejar estados en mayúsculas y limpieza de strings en campos de fecha.
  
  ------
  
  ## [1.0.0] - 2026-05-01
  
  ### Added
  
  - **Initial Release:** Despliegue de la arquitectura base del portafolio.
  - **Orquestación de Datos:** Implementación del motor **Synquork** para la sincronización automatizada de metadatos de proyectos.
  - **Data-Driven UI:** Arquitectura basada en un esquema JSON para el renderizado dinámico de activos y estados de laboratorio.
  - **Design System:** Interfaz basada en minimalismo industrial con tipografía y espaciado de estilo LaTeX.
  
  ### Fixed
  
  - **Documentación:** Refactorización del README para corregir la atribución de autoría y desvincular dependencias de proyectos académicos previos.
  
  ### Security
  
  - **Autenticación:** Implementación de acceso mediante llaves SSH y configuración de agentes locales para el despliegue seguro hacia GitHub.
