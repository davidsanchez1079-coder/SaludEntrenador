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

    public Map<String, Object> procesarMensaje(Long usuarioId, String mensaje) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));

        String perfil = usuarioService.generarResumenPerfil(usuarioId);
        String resumenSalud = saludService.generarResumenSalud(usuarioId);
        String contexto = perfil + "\n\n" + resumenSalud;

        String prompt = """
                Eres un entrenador personal inteligente. Tu trabajo es responder con base en el perfil y estado vigente de salud del usuario.
                Prioriza siempre el dato mas reciente cuando haya cambios de dosis, sintomas, peso o entrenamiento.
                Si el resumen de salud indica una dosis vigente de Mounjaro, usa esa como la correcta y no menciones dosis viejas como actuales.
                Responde claro, breve y practico. Si el usuario pregunta por su estado actual, resume lo vigente.

                Si el usuario pide una rutina, plan o entrenamiento, responde SIEMPRE en JSON valido con esta forma:
                {
                  "respuesta": "Aqui tienes tu plan de entrenamiento.",
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
                            "descanso_seg": "90"
                          }
                        ]
                      }
                    ]
                  },
                  "consejo": "Consejo breve opcional"
                }

                Si NO pide rutina, responde solo en JSON valido con:
                {
                  "respuesta": "tu respuesta aqui",
                  "consejo": "opcional"
                }

                Nunca respondas markdown ni bloques de codigo. Nunca devuelvas texto fuera del JSON.

                CONTEXTO DEL USUARIO:
                %s
                """.formatted(contexto);

        String respuesta = claudeService.chat(prompt, List.of(Map.of("role", "user", "content", mensaje)));

        Map<String, Object> out = new LinkedHashMap<>();
        try {
            JsonNode json = objectMapper.readTree(respuesta);
            log.info("Entrenador JSON parseado. Campos presentes: {}", json.fieldNames().hasNext() ? json.fieldNames().next() : "vacio");
            out.put("respuesta", json.hasNonNull("respuesta") ? json.get("respuesta").asText() : "Aqui tienes tu plan de entrenamiento.");

            // Buscar rutina en multiples campos posibles
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
        String ejercicio = body.getOrDefault("ejercicio", "ejercicio").toString();
        String peso = body.getOrDefault("peso", "").toString();
        String reps = body.getOrDefault("repeticiones", "").toString();

        return Map.of(
                "respuesta", "Buen registro. Sigue cuidando tecnica, respiracion y control en " + ejercicio + "." +
                        (peso.isBlank() ? "" : " Peso: " + peso + ".") +
                        (reps.isBlank() ? "" : " Repeticiones: " + reps + ".")
        );
    }

    public Map<String, Object> resumenSesion(Long usuarioId, Map<String, Object> body) {
        String nombreRutina = body.getOrDefault("nombreRutina", "Sesion").toString();
        String ejerciciosLog = body.getOrDefault("ejerciciosLog", "").toString();
        return Map.of(
                "resumen", "Sesion registrada: " + nombreRutina + ". " +
                        (ejerciciosLog.isBlank() ? "Buen trabajo." : "Resumen breve generado con base en tus ejercicios registrados.")
        );
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
}
