
```
# Sistema de Automatización de Inventario (SIA) - Minimarket

Sistema de automatización de procesos y consultas de inventario en tiempo real para un minimarket, desarrollado mediante flujos de trabajo en n8n, base de datos relacional en PostgreSQL y mensajería automatizada a través de la API de Bots de Telegram.

## Descripción General

El proyecto centraliza la gestión y consulta de stock mediante un bot de Telegram (`@SIA_ConsultasUCM_BOT`). Las solicitudes entrantes son interceptadas por n8n, procesadas para extraer comandos y parámetros, y ejecutadas de forma segura contra una base de datos PostgreSQL contenerizada en Docker.

## Arquitectura y Tecnologías

* **Orquestación y Automatización:** n8n
* **Base de Datos:** PostgreSQL
* **Contenerización:** Docker y Docker Compose
* **Interfaz de Usuario:** Telegram Bot API (Webhooks)
* **Exposición Local (Desarrollo):** Túneles inversos (SSH / Cloudflare Tunnel)

## Estructura del Flujo en n8n

El flujo principal (`Flujo Minimarket`) sigue una arquitectura modular de cuatro etapas:

1. **Telegram Trigger:** Escucha eventos de tipo `message` provenientes del webhook registrado en Telegram.
2. **Edit Fields (Set):** Procesa el texto del mensaje entrante para extraer y estructurar las variables `Comando` (ej. `/stock`) y `CodigoBarras`.
3. **Switch:** Evalúa el valor de `Comando` para enrutar la ejecución hacia la operación correspondiente.
4. **PostgreSQL (Execute a SQL query):** Ejecuta consultas SQL parametrizadas (`$1`, `$2`) utilizando *Query Parameters* para prevenir inyección SQL y recuperar o actualizar el estado del inventario.

## Comandos Soportados

| Comando | Sintaxis | Descripción |
| :--- | :--- | :--- |
| `/stock` | `/stock <codigo_barras>` | Consulta la información y el stock actual de un producto específico en la tabla `productos`. |

## Requisitos Previos

* Docker Desktop / Docker Engine y Docker Compose instalados.
* Token de bot activo generado mediante `@BotFather` en Telegram.
* Servicio de túnel HTTPS activo para exponer el puerto local `5678` hacia los servidores de Telegram en entornos de desarrollo.

## Instalación y Despliegue Local

1. Clonar el repositorio y acceder al directorio del backend:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd SIA/backend
```

2. Configurar las variables de entorno en `docker-compose.yml` (o archivo `.env`), asegurándose de definir la URL pública del webhook (`N8N_WEBHOOK_URL`) y las credenciales de PostgreSQL.
    
3. Levantar los servicios en segundo plano:
    
    Bash
    
    ```
    docker compose up -d
    ```
    
4. Acceder al panel de n8n en `http://localhost:5678`, importar o activar el flujo de trabajo y configurar las credenciales de Telegram y PostgreSQL.
    

## Buenas Prácticas de Seguridad

- Las consultas a PostgreSQL utilizan estrictamente parámetros vinculados (_Query Parameters_) en lugar de interpolación directa de texto.
    
- Los tokens de Telegram y credenciales de base de datos no deben versionarse en texto plano dentro del repositorio.
    

## Equipo de Desarrollo

|**Integrante**|**Rol / Responsabilidades**|
|---|---|
|**Diego Abdias Saldaña Fuentes**|Configuración de infraestructura en Docker, diseño e implementación de flujos en n8n, integración con Telegram Bot API y consultas parametrizadas en PostgreSQL.|
|**Victor Adan Farias Rivas**|_[Especificar tareas asignadas]_|
|**Joaquin Torres**|_[Especificar tareas asignadas]_|

## Contacto

Para consultas técnicas o información sobre el repositorio:

- **Diego Abdias Saldaña Fuentes** - saldanafuentesabdiasdiego@gmail.com
    

```

Las tareas de Victor Adan Farias Rivas y Joaquin Torres quedaron con marcadores de posición porque en este chat no se registraron sus responsabilidades específicas dentro del proyecto SIA. Si me indicas qué hizo cada uno, actualizo la tabla de inmediato.
```