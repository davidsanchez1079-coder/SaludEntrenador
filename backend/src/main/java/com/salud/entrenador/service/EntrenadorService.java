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
            Eres un entrenador personal experto. El usuario tiene dos objetivos:
            - OBJETIVO GENERAL: %s
            - OBJETIVO ESPECIFICO: %s

            El objetivo especifico es LA PRIORIDAD. Si el usuario quiere crecer gluteo, CADA rutina debe tener enfasis en gluteo: mas ejercicios de gluteo, mas volumen, ejercicios complementarios que apoyen el desarrollo de gluteo. Los demas grupos musculares se trabajan como mantenimiento.

            %s

            %s

            %s

            Adapta todo segun el historial real del usuario, su progresion de cargas, y sus datos de salud. Si el usuario reporta dolor o malestar, adapta inmediatamente sin perder de vista el objetivo. Siempre en espanol, directo y motivacional.

            Cuando el usuario pida una rutina, responde SIEMPRE en formato JSON:
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
                    "peso_sugerido_kg": 20,
                    "descanso_seg": 60,
                    "notas": "Nota opcional",
                    "musculo_principal": "gluteo"
                  }
                ]
              },
              "consejo": "Consejo nutricional o de entrenamiento relevante"
            }

            Genera pesos especificos basados en la progresion real del usuario.
            Si el objetivo es hipertrofia: rangos de 8-12 reps con cargas progresivas.
            Si es bajar grasa: circuitos con menos descanso.
            Si es fuerza: rangos de 3-6 reps con cargas altas.
            El musculo prioritario (objetivo especifico) debe tener MAS ejercicios, MAS volumen y MAS frecuencia.
            Si no es una solicitud de rutina, omite el campo "rutina".
            """;

    private static final String FEEDBACK_SERIE_PROMPT = """
            Eres un entrenador personal experto dando feedback EN TIEMPO REAL durante un entrenamiento.
            El usuario tiene dos objetivos:
            - OBJETIVO GENERAL: %s
            - OBJETIVO ESPECIFICO: %s

            Para el feedback por serie: si el ejercicio es del musculo prioritario (objetivo especifico), se mas exigente con tecnica e intensidad. Si es complementario, se mas flexible.

            SERIE COMPLETADA:
            - Ejercicio: %s
            - Musculo principal: %s
            - Serie #%d de %d
            - Peso usado: %s kg
            - Repeticiones hechas: %s
            - Intensidad reportada (RPE): %s%%
            - Como se sintio: %s

            GUIA DE INTENSIDAD RPE:
            - Menor a 70%%: El usuario siente que fue facil, probablemente puede subir peso o reps.
            - 70-80%%: Moderado a pesado, buen rango de trabajo para hipertrofia.
            - 80-90%%: Pesado, cerca del limite. Bueno para fuerza.
            - 90-100%%: Al limite o al fallo. Debe mantener o bajar en la siguiente serie.

            Plan original del ejercicio: %s reps, %s kg sugeridos

            Series anteriores HOY de este ejercicio:
            %s

            Historial de este ejercicio en sesiones anteriores:
            %s

            Responde UNICAMENTE en JSON:
            {
              "feedback": "texto corto motivacional (1-2 frases, directo)",
              "ajuste_siguiente_serie": {"peso_sugerido": "kg numerico", "reps_sugeridas": "rango ej: 10-12"},
              "alerta": "great|ok|warning"
            }
            """;

    private static final String RESUMEN_SESION_PROMPT = """
            Eres un entrenador personal experto. El usuario tiene dos objetivos:
            - OBJETIVO GENERAL: %s
            - OBJETIVO ESPECIFICO: %s

            %s

            Acaba de terminar este entrenamiento:
            - Rutina: %s
            - Log completo de ejercicios con pesos, reps, fallo y sensaciones:
            %s

            Evalua la sesion:
            1. Esta sesion lo acerco a su objetivo especifico (%s)?
            2. Se le dio suficiente volumen al musculo prioritario?
            3. Que hizo bien?
            4. Que puede mejorar?
            5. Recomendaciones concretas para la proxima sesion (pesos, ejercicios, volumen)

            Responde en JSON:
            {
              "resumen": "evaluacion completa en texto (3-5 parrafos, directo y motivacional)",
              "calificacion": "excelente|buena|regular|necesita_mejorar",
              "proximo_enfoque": "que debe priorizar la proxima sesion"
            }
            """;

    /**
     * Procesa un mensaje del usuario relacionado a entrenamiento.
     */
    public Map<String, Object> procesarMensaje(Long usuarioId, String mensaje) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));

        String perfilResumen = usuarioService.generarResumenPerfil(usuarioId);
        String saludResumen = saludService.generarResumenSalud(usuarioId);
        String entrenamientoResumen = generarResumenEntrenamientosCompleto(usuarioId);

        String systemPrompt = String.format(SYSTEM_PROMPT_TEMPLATE,
                usuario.getObjetivoGeneral() != null ? usuario.getObjetivoGeneral() : "No definido",
                usuario.getObjetivoEspecifico() != null ? usuario.getObjetivoEspecifico() : "No definido",
                perfilResumen, saludResumen, entrenamientoResumen);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", mensaje));

        String respuestaIA = claudeService.chat(systemPrompt, messages);


        String respuestaTexto = respuestaIA;
        Object rutina = null;
        String consejo = null;

        try {
            JsonNode json = objectMapper.readTree(respuestaIA);
            if (json.has("respuesta")) respuestaTexto = json.get("respuesta").asText();
            if (json.has("rutina") && !json.get("rutina").isNull()) rutina = objectMapper.convertValue(json.get("rutina"), Map.class);
            if (json.has("consejo")) consejo = json.get("consejo").asText();
        } catch (Exception e) {
            log.warn("Respuesta del entrenador no es JSON valido, usando texto plano: {}", e.getMessage());
            respuestaTexto = respuestaIA;
        }

        Map<String, Object> resultado = new java.util.HashMap<>();
        resultado.put("respuesta", respuestaTexto);
        resultado.put("rutina", rutina);
        resultado.put("consejo", consejo);
        return resultado;
    }

    /**
     * Feedback en tiempo real por serie completada.
     */
    public Map<String, Object> feedbackSerie(Long usuarioId, Map<String, Object> datos) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));

        String ejercicio = (String) datos.getOrDefault("ejercicio", "");
        String musculoPrincipal = (String) datos.getOrDefault("musculo_principal", "general");
        int serieActual = ((Number) datos.getOrDefault("serie_actual", 1)).intValue();
        int seriesTotales = ((Number) datos.getOrDefault("series_totales", 3)).intValue();
        String peso = String.valueOf(datos.getOrDefault("peso", "0"));
        String reps = String.valueOf(datos.getOrDefault("reps", "0"));
        int intensidad = ((Number) datos.getOrDefault("intensidad", 70)).intValue();
        String comoSeSintio = (String) datos.getOrDefault("como_se_sintio", "");
        String repsPlan = String.valueOf(datos.getOrDefault("reps_plan", "10-12"));
        String pesoSugerido = String.valueOf(datos.getOrDefault("peso_plan", "0"));
        String seriesHoy = (String) datos.getOrDefault("series_anteriores_hoy", "Ninguna");

        // Buscar historial de este ejercicio en sesiones anteriores
        List<Entrenamiento> historial = entrenamientoRepository.findHistorialEjercicio(usuarioId, ejercicio);
        StringBuilder historialTexto = new StringBuilder();
        if (historial.isEmpty()) {
            historialTexto.append("Sin historial previo de este ejercicio.");
        } else {
            for (Entrenamiento e : historial) {
                historialTexto.append(String.format("- [%s] %s\n",
                        e.getFecha() != null ? e.getFecha().toLocalDate() : "sin fecha",
                        e.getEjerciciosLog()));
            }
        }

        String prompt = String.format(FEEDBACK_SERIE_PROMPT,
                usuario.getObjetivoGeneral() != null ? usuario.getObjetivoGeneral() : "No definido",
                usuario.getObjetivoEspecifico() != null ? usuario.getObjetivoEspecifico() : "No definido",
                ejercicio, musculoPrincipal, serieActual, seriesTotales,
                peso, reps, String.valueOf(intensidad), comoSeSintio.isBlank() ? "No especifico" : comoSeSintio,
                repsPlan, pesoSugerido, seriesHoy, historialTexto.toString());

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", "Dame feedback de esta serie."));

        String respuestaIA = claudeService.chat(prompt, messages);


        Map<String, Object> resultado = new java.util.HashMap<>();
        resultado.put("feedback", respuestaIA);
        resultado.put("alerta", "ok");
        resultado.put("ajuste_siguiente_serie", Map.of("peso_sugerido", peso, "reps_sugeridas", repsPlan));

        try {
            JsonNode json = objectMapper.readTree(respuestaIA);
            if (json.has("feedback")) resultado.put("feedback", json.get("feedback").asText());
            if (json.has("alerta")) resultado.put("alerta", json.get("alerta").asText());
            if (json.has("ajuste_siguiente_serie")) resultado.put("ajuste_siguiente_serie", objectMapper.convertValue(json.get("ajuste_siguiente_serie"), Map.class));
        } catch (Exception e) {
            log.warn("Feedback no es JSON valido, usando texto plano: {}", e.getMessage());
            resultado.put("feedback", respuestaIA);
            resultado.put("alerta", "ok");
        }

        return resultado;
    }

    /**
     * Genera resumen post-entrenamiento evaluando la sesion vs el objetivo.
     */
    public Map<String, Object> resumenSesion(Long usuarioId, Map<String, Object> datos) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));

        String nombreRutina = (String) datos.getOrDefault("nombreRutina", "Rutina");
        String ejerciciosLog = (String) datos.getOrDefault("ejerciciosLog", "{}");
        String perfilResumen = usuarioService.generarResumenPerfil(usuarioId);

        String prompt = String.format(RESUMEN_SESION_PROMPT,
                usuario.getObjetivoGeneral() != null ? usuario.getObjetivoGeneral() : "No definido",
                usuario.getObjetivoEspecifico() != null ? usuario.getObjetivoEspecifico() : "No definido",
                perfilResumen, nombreRutina, ejerciciosLog,
                usuario.getObjetivoEspecifico() != null ? usuario.getObjetivoEspecifico() : "No definido");

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", "Evalua mi sesion de entrenamiento."));

        String respuestaIA = claudeService.chat(prompt, messages);


        Map<String, Object> resultado = new java.util.HashMap<>();
        resultado.put("resumen", respuestaIA);
        resultado.put("calificacion", "buena");
        resultado.put("proximo_enfoque", "");

        try {
            JsonNode json = objectMapper.readTree(respuestaIA);
            if (json.has("resumen")) resultado.put("resumen", json.get("resumen").asText());
            if (json.has("calificacion")) resultado.put("calificacion", json.get("calificacion").asText());
            if (json.has("proximo_enfoque")) resultado.put("proximo_enfoque", json.get("proximo_enfoque").asText());
        } catch (Exception e) {
            log.warn("Resumen sesion no es JSON valido, usando texto plano: {}", e.getMessage());
            resultado.put("resumen", respuestaIA);
            resultado.put("calificacion", "buena");
        }

        return resultado;
    }

    /**
     * Guarda un entrenamiento completado con resumen de sesion opcional.
     */
    public Entrenamiento guardarEntrenamiento(Long usuarioId, Entrenamiento entrenamiento) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));
        entrenamiento.setUsuario(usuario);
        if (entrenamiento.getCompletado() == null) entrenamiento.setCompletado(true);
        return entrenamientoRepository.save(entrenamiento);
    }

    public List<Entrenamiento> obtenerHistorial(Long usuarioId) {
        return entrenamientoRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
    }

    /**
     * Genera resumen completo con pesos y detalles para el system prompt.
     */
    private String generarResumenEntrenamientosCompleto(Long usuarioId) {
        List<Entrenamiento> recientes = entrenamientoRepository.findTop5ByUsuarioIdOrderByFechaDesc(usuarioId);

        if (recientes.isEmpty()) {
            return "HISTORIAL DE ENTRENAMIENTOS: Sin entrenamientos registrados.";
        }

        StringBuilder sb = new StringBuilder("HISTORIAL COMPLETO DE ENTRENAMIENTOS RECIENTES (con pesos, reps, fallo y sensaciones):\n");
        for (Entrenamiento e : recientes) {
            sb.append(String.format("\n--- [%s] %s (Completado: %s) ---\n",
                    e.getFecha() != null ? e.getFecha().toLocalDate() : "sin fecha",
                    e.getNombreRutina(),
                    Boolean.TRUE.equals(e.getCompletado()) ? "Si" : "No"));
            if (e.getEjerciciosLog() != null) {
                sb.append(e.getEjerciciosLog()).append("\n");
            }
            if (e.getResumenSesion() != null) {
                sb.append("Resumen IA de la sesion: ").append(e.getResumenSesion()).append("\n");
            }
        }
        return sb.toString();
    }
}
