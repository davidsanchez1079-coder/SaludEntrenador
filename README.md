# SaludEntrenador

Plataforma de salud y entrenamiento personal con inteligencia artificial. Permite a entrenadores personales y nutriologos gestionar perfiles de clientes, registrar informacion de salud, y generar rutinas de entrenamiento personalizadas usando la API de OpenAI (GPT-4o).

## Arquitectura

```
┌─────────────────┐         ┌──────────────────────┐
│   Frontend       │  REST   │     Backend           │
│   React + Vite   │ ◄─────► │   Spring Boot 3       │
│   Puerto 5173    │  JSON   │   Puerto 8080         │
└─────────────────┘         │                       │
                             │  ┌─────────────────┐ │
                             │  │ H2 Database      │ │
                             │  │ (dev / en memoria)│ │
                             │  └─────────────────┘ │
                             │                       │
                             │  ┌─────────────────┐ │
                             │  │ API OpenAI       │ │
                             │  │ (GPT-4o)         │ │
                             │  └─────────────────┘ │
                             └──────────────────────┘
```

## Tecnologias

### Backend
- **Java 17+** (probado con Java 21)
- **Spring Boot 3.4** - Framework web
- **Spring Data JPA** - Persistencia
- **H2 Database** - Base de datos en memoria (desarrollo)
- **Lombok** - Reduccion de boilerplate
- **API OpenAI (GPT-4o)** - Inteligencia artificial para salud y entrenamiento

### Frontend
- **React 19** - Biblioteca UI
- **Vite 6** - Build tool y dev server
- **Fetch API** - Comunicacion con backend

## Estructura del Proyecto

```
SaludEntrenador/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/salud/entrenador/
│       ├── SaludEntrenadorApplication.java
│       ├── config/
│       │   ├── AppConfig.java          # RestTemplate bean
│       │   └── CorsConfig.java         # CORS para frontend
│       ├── model/
│       │   ├── Usuario.java            # Perfil del usuario
│       │   ├── EntradaSalud.java       # Registros de salud
│       │   ├── Entrenamiento.java      # Workouts completados
│       │   └── CategoriaSalud.java     # Enum de categorias
│       ├── repository/
│       │   ├── UsuarioRepository.java
│       │   ├── EntradaSaludRepository.java
│       │   └── EntrenamientoRepository.java
│       ├── service/
│       │   ├── ClaudeService.java      # Integracion API OpenAI
│       │   ├── UsuarioService.java     # Logica de perfiles
│       │   ├── SaludService.java       # Chat salud + historial
│       │   └── EntrenadorService.java  # Chat entrenador + rutinas
│       └── controller/
│           ├── UsuarioController.java  # /api/usuarios
│           ├── SaludController.java    # /api/salud
│           └── EntrenadorController.java # /api/entrenador
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.jsx                     # App principal con tabs
│       ├── services/api.js             # Funciones fetch al backend
│       └── components/
│           ├── Layout.jsx              # Header + navegacion
│           ├── Profile.jsx             # Formulario de perfil
│           ├── SaludChat.jsx           # Chat de salud con IA
│           ├── SaludHistorial.jsx      # Timeline de registros
│           ├── EntrenadorChat.jsx      # Chat de entrenamiento
│           ├── RoutineCard.jsx         # Card de rutina generada
│           ├── ActiveWorkout.jsx       # Tracker de ejercicios
│           ├── EntrenadorHistorial.jsx # Historial de workouts
│           ├── ChatBubble.jsx          # Burbuja de chat
│           ├── ChatInput.jsx           # Input de mensaje
│           ├── LoadingDots.jsx         # Animacion de carga
│           └── Badge.jsx              # Badge de categoria
└── README.md
```

## Endpoints REST

### Usuarios
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/usuarios` | Crear usuario |
| GET | `/api/usuarios/{id}` | Obtener usuario |
| PUT | `/api/usuarios/{id}` | Actualizar perfil |
| GET | `/api/usuarios` | Listar todos |

### Salud
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/salud/{id}/chat` | Enviar mensaje al asistente de salud |
| GET | `/api/salud/{id}/historial` | Timeline de registros (filtro por categoria) |
| GET | `/api/salud/{id}/resumen` | Resumen de salud para el entrenador |

### Entrenador
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/entrenador/{id}/chat` | Enviar mensaje al entrenador IA |
| POST | `/api/entrenador/{id}/workout` | Guardar entrenamiento completado |
| GET | `/api/entrenador/{id}/historial` | Historial de workouts |

## Como Correr

### Variables de Entorno

```bash
export OPENAI_API_KEY=tu_api_key_aqui
```

### Backend

```bash
cd backend
mvn spring-boot:run
```

El backend arranca en `http://localhost:8080`.
Consola H2 disponible en `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:saludentrenador`, user: `sa`, sin password).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend arranca en `http://localhost:5173`.

## Integracion con ERP de Gimnasio

Este backend esta disenado para integrarse eventualmente con un ERP de gimnasio en Java:

- **API REST estandar**: Todos los endpoints siguen convenciones REST y pueden ser consumidos por cualquier sistema Java
- **Spring Data JPA**: Facilita el cambio de H2 a MySQL/PostgreSQL para produccion
- **Modelos extensibles**: Las entidades JPA se pueden enriquecer con campos adicionales del ERP
- **Servicio de perfiles**: `UsuarioService.generarResumenPerfil()` puede alimentar reportes del ERP
- **Base de datos configurable**: Cambiar a MySQL solo requiere actualizar `application.yml` y agregar el driver

Para produccion, actualizar `application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/saludentrenador
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  jpa:
    database-platform: org.hibernate.dialect.MySQLDialect
    hibernate:
      ddl-auto: update
```
