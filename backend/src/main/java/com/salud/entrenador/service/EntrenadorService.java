package com.salud.entrenador.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.salud.entrenador.model.Entrenamiento;
import com.salud.entrenador.model.Usuario;
import com.salud.entrenador.repository.EntrenamientoRepository;
import com.salud.entrenador.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EntrenadorService {

    private final ClaudeService claudeService;
    private final UsuarioService usuarioService;
    private final SaludService saludService;
    private final UsuarioRepository usuarioRepository;
    private final EntrenamientoRepository entrenamientoRepository;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            Eres un entrenador personal experto y nutriologo certificado. Tu rol es crear
            planes de entrenamiento personalizados basados en el perfil, objetivo y estado
            de salud del usuario.

            %s

            %s

            %s

            Cuando el usuario pida una rutina o consejo de entrenamiento, responde SIEMPRE en formato JSON:
            {
              "respuesta": "Tu respuesta conversacional aqui",
              "rutina": {
                "nombre": "Nombre de la rutina",
                "duracion_minutos": 45,
                "ejercicios": [
                  {
                    "nombre": "Nombre del ejercicio",
                    "series": 3,
                    "repeticiones": "10-12",
                    "descanso_seg": 60,
                    "notas": "Nota opcional"
                  }
                ]
              },
              "consejo": "Consejo nutricional o de entrenamiento relevante"
            }

            Si el mensaje NO es una solicitud de rutina, puedes omitir el campo "rutina" y solo
            incluir "respuesta" y opcionalmente "consejo".

            Considera siempre las condiciones medicas y alergias del usuario.
            Adapta la intensidad al objetivo del usuario.
            """;

    /**
     * Procesa un mensaje del usuario relacionado a entrenamiento.
     */
    public Map<String, Object> procesarMensaje(Long usuarioId, String mensaje) {
        usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));

        String perfilResumen = usuarioService.generarResumenPerfil(usuarioId);
        String saludResumen = saludService.generarResumenSalud(usuarioId);
        String entrenamientoResumen = generarResumenEntrenamientos(usuarioId);

        String systemPrompt = String.format(SYSTEM_PROMPT_TEMPLATE,
                perfilResumen, saludResumen, entrenamientoResumen);

        // Construir mensajes
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", mensaje));

        // Llamar a Claude
        String respuestaIA = claudeService.chat(systemPrompt, messages);

        // Parsear respuesta
        String respuestaTexto = respuestaIA;
        Object rutina = null;
        String consejo = null;

        try {
            JsonNode json = objectMapper.readTree(respuestaIA);
            if (json.has("respuesta")) {
                respuestaTexto = json.get("respuesta").asText();
            }
            if (json.has("rutina") && !json.get("rutina").isNull()) {
                rutina = objectMapper.convertValue(json.get("rutina"), Map.class);
            }
            if (json.has("consejo")) {
                consejo = json.get("consejo").asText();
            }
        } catch (Exception e) {
            log.warn("Respuesta del entrenador no es JSON valido: {}", e.getMessage());
        }

        Map<String, Object> resultado = new java.util.HashMap<>();
        resultado.put("respuesta", respuestaTexto);
        resultado.put("rutina", rutina);
        resultado.put("consejo", consejo);
        return resultado;
    }

    /**
     * Guarda un entrenamiento completado.
     */
    public Entrenamiento guardarEntrenamiento(Long usuarioId, Entrenamiento entrenamiento) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));
        entrenamiento.setUsuario(usuario);
        if (entrenamiento.getCompletado() == null) {
            entrenamiento.setCompletado(true);
        }
        return entrenamientoRepository.save(entrenamiento);
    }

    /**
     * Obtiene el historial de entrenamientos de un usuario.
     */
    public List<Entrenamiento> obtenerHistorial(Long usuarioId) {
        return entrenamientoRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
    }

    /**
     * Genera un resumen de los ultimos entrenamientos para el system prompt.
     */
    private String generarResumenEntrenamientos(Long usuarioId) {
        List<Entrenamiento> recientes = entrenamientoRepository
                .findTop5ByUsuarioIdOrderByFechaDesc(usuarioId);

        if (recientes.isEmpty()) {
            return "HISTORIAL DE ENTRENAMIENTOS: Sin entrenamientos registrados.";
        }

        StringBuilder sb = new StringBuilder("HISTORIAL DE ENTRENAMIENTOS RECIENTES:\n");
        for (Entrenamiento e : recientes) {
            sb.append(String.format("- [%s] %s - Completado: %s\n",
                    e.getFecha() != null ? e.getFecha().toLocalDate() : "sin fecha",
                    e.getNombreRutina(),
                    Boolean.TRUE.equals(e.getCompletado()) ? "Si" : "No"));
        }
        return sb.toString();
    }
}
