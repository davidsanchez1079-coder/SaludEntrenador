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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EntrenadorService {

    private final UsuarioRepository usuarioRepository;
    private final EntrenamientoRepository entrenamientoRepository;
    private final UsuarioService usuarioService;
    private final SaludService saludService;
    private final ClaudeService claudeService;
    private final ObjectMapper objectMapper;

    private static final String CHAT_PROMPT = """
            Eres un entrenador personal de elite con 15 anios de experiencia. Conoces a tu cliente, su cuerpo, sus limites y su objetivo.

            REGLAS CLAVE:
            1. SIEMPRE sugiere PESOS INICIALES CONCRETOS para cada ejercicio basados en:
               - Peso corporal del usuario (regla general: press banca ~40-50%% del peso corporal para principiante, 60-70%% intermedio, 80%%+ avanzado)
               - Historial previo (si ya hizo ese ejercicio antes, usa el ultimo peso registrado como referencia)
               - Objetivo (hipertrofia: peso moderado 8-12 reps, fuerza: peso alto 3-6 reps, resistencia: peso bajo 15-20 reps)
               - Si NO hay historial, estima un peso conservador pero realista basado en peso corporal y sexo
            2. La primera serie SIEMPRE es de aproximacion/calentamiento con peso mas bajo
            3. Las series intermedias son de TRABAJO con el peso objetivo
            4. La ultima serie puede ser al tope si el cliente esta listo
            5. Nunca pongas 0 kg. Siempre pon un peso concreto aunque sea estimado.

            Si el usuario pide una rutina, responde SIEMPRE en JSON valido:
            {
              "respuesta": "Aqui tienes tu plan. Los pesos estan basados en tu peso corporal y nivel.",
              "rutina": {
                "nombre": "Plan de entrenamiento",
                "dias": [
                  {
                    "nombre": "Dia 1",
                    "grupo": "Pecho y tricep",
                    "ejercicios": [
                      {
                        "nombre": "Press de banca",
                        "series": "4",
                        "repeticiones": "8-10",
                        "peso_sugerido_kg": "40",
                        "descanso_seg": "90",
                        "nota_coach": "Serie 1 con 30kg para calentar. Series 2-4 con 40kg buscando 8-10 reps."
                      }
                    ]
                  }
                ]
              },
              "consejo": "Consejo breve"
            }

            IMPORTANTE: El campo peso_sugerido_kg DEBE tener un numero real basado en el perfil.

            Si NO pide rutina, responde en JSON: {"respuesta": "tu respuesta", "consejo": "opcional"}
            Nunca respondas markdown ni bloques de codigo. Solo JSON.

            HISTORIAL DE ENTRENAMIENTOS ANTERIORES (usa estos pesos como referencia para progresion):
            %s

            CONTEXTO DEL USUARIO:
            %s
            """;

    private static final String FEEDBACK_SERIE_PROMPT = """
            Eres un ENTRENADOR PERSONAL DE ELITE guiando a tu cliente SERIE POR SERIE en tiempo real.
            Hablas directo, motivacional, como si estuvieras al lado del cliente en el gym.

            PERFIL DEL USUARIO:
            %s

            EJERCICIO ACTUAL: %s
            Musculo principal: %s
            Serie %d de %d

            RESULTADO DE ESTA SERIE:
            - Peso: %s kg
            - Repeticiones: %s
            - Intensidad RPE: %s%%
            - Como se sintio: %s

            PLAN ORIGINAL: %s reps con %s kg

            SERIES ANTERIORES DE ESTE EJERCICIO HOY:
            %s

            HISTORIAL DE ESTE EJERCICIO EN SESIONES ANTERIORES:
            %s

            INSTRUCCIONES PARA TU RESPUESTA:

            1. ANALISIS DE RENDIMIENTO (se MUY especifico):
               - Compara reps logradas vs reps objetivo. Si logro MENOS DEL 70%% de las reps objetivo, el peso es DEMASIADO ALTO.
               - Ejemplo: si el objetivo es 8-10 reps y logro 4, eso es 50%% = PESO MUY ALTO, BAJAR INMEDIATAMENTE.
               - Si logro 8 de 8-10, esta perfecto.
               - Si logro 12+ de 8-10, el peso es MUY BAJO, subir.
               - Analiza la TENDENCIA: si en las series anteriores de hoy tambien fallo, BAJAR MAS.

            2. COACHING DE TECNICA (especifico al ejercicio):
               - Cual es la sensacion muscular correcta y DONDE debe sentir el trabajo
               - Un punto clave de postura para ESTE ejercicio en particular
               - Velocidad: fase concentrica vs excentrica
               - El error MAS comun que la gente comete en este ejercicio

            3. CLASIFICACION DE SIGUIENTE SERIE:
               - "aproximacion" = serie de calentamiento, ir subiendo peso gradualmente
               - "trabajo" = peso ideal encontrado, completar rango de reps con buena tecnica
               - "tope" = ir al maximo esfuerzo (solo si las series previas fueron exitosas)
               - "descarga" = BAJAR peso significativamente, enfocarse en contraccion y bombeo

            4. AJUSTE DE PESO - REGLAS ESTRICTAS (para el OBJETIVO: %s):
               OBJETIVO HIPERTROFIA (ganar musculo): rango ideal 8-12 reps
               - Logro MENOS de 6 reps: BAJAR 15-20%% del peso. El musculo no esta recibiendo suficiente tiempo bajo tension.
               - Logro 6-7 reps: BAJAR 5-10%%. Cerca pero necesita mas reps para hipertrofia.
               - Logro 8-12 reps: PERFECTO. Mantener o subir 2.5-5%% si RPE < 75%%.
               - Logro 12+ reps: SUBIR 5-10%%. Peso insuficiente para estimulo de crecimiento.

               OBJETIVO FUERZA: rango ideal 3-6 reps
               - Logro menos de 3 reps: BAJAR 10%%.
               - Logro 3-6 reps: PERFECTO. Mantener.
               - Logro 6+ reps: SUBIR 5-10%%.

               OBJETIVO RESISTENCIA: rango ideal 15-20 reps
               - Logro menos de 12 reps: BAJAR 15-20%%.
               - Logro 15-20 reps: PERFECTO.
               - Logro 20+ reps: SUBIR peso.

               SI FALLO 2 SERIES SEGUIDAS CON POCAS REPS: bajar significativamente y hacer serie de "descarga".
               NUNCA sugieras mantener el mismo peso si no logro ni el 70%% de las reps objetivo.

               REGLA DE REDONDEO OBLIGATORIA:
               Los pesos en el gym van en incrementos de 2.5 kg o 5 kg (mancuernas: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24 kg etc. Barras: 20, 25, 30, 35, 40, 45, 50 kg etc.)
               SIEMPRE redondea el peso sugerido al incremento de 2.5 kg mas cercano.
               Nunca sugieras pesos como 22.3 kg o 37.8 kg. Solo numeros redondeados: 20, 22.5, 25, 27.5, 30, etc.

            5. MOTIVACION: Frase directa de entrenador real. Que se sienta el apoyo pero tambien la exigencia.

            Responde UNICAMENTE en JSON valido:
            {
              "feedback": "Evaluacion de la serie + tip de postura/tecnica (2-3 frases max, directo)",
              "tipo_siguiente_serie": "aproximacion|trabajo|tope|descarga",
              "coaching_tip": "Tip especifico de postura o sensacion para la siguiente serie",
              "ajuste_siguiente_serie": {
                "peso_sugerido": "numero en kg",
                "reps_sugeridas": "rango ej: 8-10"
              },
              "motivacion": "Frase corta motivacional",
              "alerta": "great|ok|warning"
            }
            """;

    private static final String RESUMEN_SESION_PROMPT = """
            Eres un entrenador personal de elite evaluando la sesion de tu cliente.

            PERFIL: %s

            RUTINA: %s
            LOG COMPLETO:
            %s

            Evalua como entrenador experto:
            1. Calidad general de la sesion (volumen, intensidad, progresion)
            2. Que hizo bien (se especifico con ejercicios)
            3. Que puede mejorar (tecnica, peso, rango de reps)
            4. Recomendaciones concretas para la proxima sesion
            5. Si avanzo hacia su objetivo

            Responde en JSON:
            {
              "resumen": "Evaluacion completa (3-4 parrafos, directo y motivacional)",
              "calificacion": "excelente|buena|regular|necesita_mejorar",
              "proximo_enfoque": "Que priorizar la proxima sesion"
            }
            """;

    public Map<String, Object> procesarMensaje(Long usuarioId, String mensaje) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));

        String perfil = usuarioService.generarResumenPerfil(usuarioId);
        String resumenSalud = saludService.generarResumenSalud(usuarioId);
        String historialEntrenamientos = generarHistorialCompleto(usuarioId);
        String contexto = perfil + "\n\n" + resumenSalud;

        String prompt = String.format(CHAT_PROMPT, historialEntrenamientos, contexto);
        String respuesta = claudeService.chat(prompt, List.of(Map.of("role", "user", "content", mensaje)));

        Map<String, Object> out = new LinkedHashMap<>();
        try {
            JsonNode json = objectMapper.readTree(respuesta);
            log.info("Entrenador JSON parseado. Campos presentes: {}", json.fieldNames().hasNext() ? json.fieldNames().next() : "vacio");
            out.put("respuesta", json.hasNonNull("respuesta") ? json.get("respuesta").asText() : "Aqui tienes tu plan de entrenamiento.");

            JsonNode rutinaNode = null;
            for (String campo : new String[]{"rutina", "plan_entrenamiento", "plan", "workout"}) {
                if (json.has(campo) && !json.get(campo).isNull()) {
                    rutinaNode = json.get(campo);
                    break;
                }
            }
            if (rutinaNode != null) {
                out.put("rutina", objectMapper.readValue(rutinaNode.toString(), Object.class));
                log.info("Rutina encontrada con {} caracteres", rutinaNode.toString().length());
            }

            if (json.hasNonNull("consejo")) {
                out.put("consejo", json.get("consejo").asText());
            }
        } catch (Exception e) {
            log.warn("Respuesta del entrenador no vino en JSON valido: {}", e.getMessage());
            log.warn("Respuesta cruda (primeros 300): {}", respuesta != null ? respuesta.substring(0, Math.min(300, respuesta.length())) : "null");
            out.put("respuesta", respuesta == null || respuesta.isBlank() ? "Aqui tienes tu plan de entrenamiento." : respuesta);
        }
        return out;
    }

    public Map<String, Object> feedbackSerie(Long usuarioId, Map<String, Object> body) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));

        String ejercicio = body.getOrDefault("ejercicio", "").toString();
        String musculoPrincipal = body.getOrDefault("musculo_principal", "general").toString();
        int serieActual = toInt(body.get("serie_actual"), 1);
        int seriesTotales = toInt(body.get("series_totales"), 3);
        String peso = body.getOrDefault("peso", "0").toString();
        String reps = body.getOrDefault("reps", "0").toString();
        int intensidad = toInt(body.get("intensidad"), 70);
        String comoSeSintio = body.getOrDefault("como_se_sintio", "").toString();
        String repsPlan = body.getOrDefault("reps_plan", "10-12").toString();
        String pesoPlan = body.getOrDefault("peso_plan", "0").toString();
        String seriesHoy = body.getOrDefault("series_anteriores_hoy", "Primera serie").toString();

        // Buscar historial de este ejercicio en sesiones anteriores
        List<Entrenamiento> historial = entrenamientoRepository.findHistorialEjercicio(usuarioId, ejercicio);
        StringBuilder historialTexto = new StringBuilder();
        if (historial.isEmpty()) {
            historialTexto.append("Sin historial previo. Es la primera vez que hace este ejercicio.");
        } else {
            for (Entrenamiento e : historial) {
                historialTexto.append(String.format("- [%s] %s\n",
                        e.getFecha() != null ? e.getFecha().toLocalDate() : "sin fecha",
                        e.getEjerciciosLog() != null ? e.getEjerciciosLog().substring(0, Math.min(200, e.getEjerciciosLog().length())) : ""));
            }
        }

        String perfil = usuarioService.generarResumenPerfil(usuarioId);
        String objetivo = (usuario.getObjetivoGeneral() != null ? usuario.getObjetivoGeneral() : "Ganar musculo") +
                (usuario.getObjetivoEspecifico() != null ? " - " + usuario.getObjetivoEspecifico() : "");

        String prompt = String.format(FEEDBACK_SERIE_PROMPT,
                perfil, ejercicio, musculoPrincipal, serieActual, seriesTotales,
                peso, reps, String.valueOf(intensidad), comoSeSintio.isBlank() ? "No especifico" : comoSeSintio,
                repsPlan, pesoPlan, seriesHoy, historialTexto.toString(), objetivo);

        String respuestaIA = claudeService.chat(prompt, List.of(Map.of("role", "user", "content", "Dame feedback de esta serie.")));

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("feedback", respuestaIA);
        resultado.put("alerta", "ok");
        resultado.put("tipo_siguiente_serie", "trabajo");
        resultado.put("coaching_tip", "");
        resultado.put("motivacion", "");
        resultado.put("ajuste_siguiente_serie", Map.of("peso_sugerido", peso, "reps_sugeridas", repsPlan));

        try {
            JsonNode json = objectMapper.readTree(respuestaIA);
            if (json.has("feedback")) resultado.put("feedback", json.get("feedback").asText());
            if (json.has("alerta")) resultado.put("alerta", json.get("alerta").asText());
            if (json.has("tipo_siguiente_serie")) resultado.put("tipo_siguiente_serie", json.get("tipo_siguiente_serie").asText());
            if (json.has("coaching_tip")) resultado.put("coaching_tip", json.get("coaching_tip").asText());
            if (json.has("motivacion")) resultado.put("motivacion", json.get("motivacion").asText());
            if (json.has("ajuste_siguiente_serie")) resultado.put("ajuste_siguiente_serie", objectMapper.convertValue(json.get("ajuste_siguiente_serie"), Map.class));
        } catch (Exception e) {
            log.warn("Feedback no es JSON valido, usando texto plano: {}", e.getMessage());
            resultado.put("feedback", respuestaIA);
        }

        return resultado;
    }

    public Map<String, Object> resumenSesion(Long usuarioId, Map<String, Object> body) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));

        String nombreRutina = body.getOrDefault("nombreRutina", "Sesion").toString();
        String ejerciciosLog = body.getOrDefault("ejerciciosLog", "").toString();
        String perfil = usuarioService.generarResumenPerfil(usuarioId);

        String prompt = String.format(RESUMEN_SESION_PROMPT, perfil, nombreRutina, ejerciciosLog);
        String respuestaIA = claudeService.chat(prompt, List.of(Map.of("role", "user", "content", "Evalua mi sesion.")));

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("resumen", respuestaIA);
        resultado.put("calificacion", "buena");
        resultado.put("proximo_enfoque", "");

        try {
            JsonNode json = objectMapper.readTree(respuestaIA);
            if (json.has("resumen")) resultado.put("resumen", json.get("resumen").asText());
            if (json.has("calificacion")) resultado.put("calificacion", json.get("calificacion").asText());
            if (json.has("proximo_enfoque")) resultado.put("proximo_enfoque", json.get("proximo_enfoque").asText());
        } catch (Exception e) {
            log.warn("Resumen sesion no es JSON valido: {}", e.getMessage());
            resultado.put("resumen", respuestaIA);
        }

        return resultado;
    }

    public Entrenamiento guardarEntrenamiento(Long usuarioId, Entrenamiento entrenamiento) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));
        entrenamiento.setUsuario(usuario);
        return entrenamientoRepository.save(entrenamiento);
    }

    public List<Entrenamiento> obtenerHistorial(Long usuarioId) {
        return entrenamientoRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
    }

    private String generarHistorialCompleto(Long usuarioId) {
        List<Entrenamiento> recientes = entrenamientoRepository.findTop5ByUsuarioIdOrderByFechaDesc(usuarioId);
        if (recientes.isEmpty()) {
            return "Sin entrenamientos previos. Es su primer entrenamiento. Estimar pesos conservadores basados en peso corporal.";
        }
        StringBuilder sb = new StringBuilder();
        for (Entrenamiento e : recientes) {
            sb.append(String.format("[%s] %s: %s\n",
                    e.getFecha() != null ? e.getFecha().toLocalDate() : "sin fecha",
                    e.getNombreRutina(),
                    e.getEjerciciosLog() != null ? e.getEjerciciosLog().substring(0, Math.min(500, e.getEjerciciosLog().length())) : "sin detalle"));
        }
        return sb.toString();
    }

    private int toInt(Object val, int defaultVal) {
        if (val == null) return defaultVal;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return defaultVal; }
    }
}
