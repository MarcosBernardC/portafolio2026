# MARCOS BERNARD // PORTAFOLIO 2026

![Status](https://img.shields.io/badge/Status-Operational-brightgreen?style=for-the-badge)
![Engine](https://img.shields.io/badge/Engine-Synquork_v2.0-blue?style=for-the-badge&logo=python&logoColor=white)
![OS](https://img.shields.io/badge/OS-Fedora_43-0B57A4?style=for-the-badge&logo=fedora&logoColor=white)
![Shell](https://img.shields.io/badge/Shell-Fish-D31027?style=for-the-badge&logo=fishshell&logoColor=white)
![Editor](https://img.shields.io/badge/Editor-Neovim-57A143?style=for-the-badge&logo=neovim&logoColor=white)

**Static Orchestrator for Engineering Assets**

**Engine:** Synquork TUI v2.0 (Automated Meta-Orchestrator)
**Status:** Operational - Phase 1

## 🛠 Technical Stack

- **Frontend:** Vanilla HTML5 / CSS3 (Industrial Grid System) / JavaScript (ES6+).
- **Data Architecture:** Data-driven logic via centralized JSON schema.
- **Automation:** Synquork CLI (Python-based) for local-to-cloud metadata synchronization.
- **Environment:** Developed under Fedora 43, optimized for Neovim and Fish Shell workflows.

## 🚀 System Architecture: The Sync Loop

Este ecosistema implementa un pipeline de integración continua (CI) local. El motor **Synquork** actúa como un orquestador que escanea los directorios de trabajo, extrae telemetría de Git y actualiza de forma atómica el estado del portafolio en `docs/data/projects.json`.

1. **Source:** Repositorios de proyectos locales (contienen `meta.json`).
2. **Orchestrator:** Synquork TUI (Valida, formatea y consolida).
3. **Target:** GitHub Pages (Static Hosting).

## ⚖️ License and Attribution

- **Author:** Marcos Bernard (Electronics Engineer).
- **Compliance:** Este repositorio es de código abierto y cumple con los estándares de integridad técnica. El desarrollo de los algoritmos de sincronización y la lógica de renderizado es propiedad intelectual del autor.
- **Academic Note:** Documentación preparada para la transparencia en procesos de auditoría técnica y académica.
