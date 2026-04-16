package com.salud.entrenador.service;

import com.salud.entrenador.model.Entrenamiento;
import com.salud.entrenador.model.Usuario;
import com.salud.entrenador.repository.EntrenamientoRepository;
import com.salud.entrenador.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EntrenadorService {

    private final UsuarioRepository usuarioRepository;
    private final EntrenamientoRepository entrenamientoRepository;
    private final UsuarioService usuarioService;
    private final SaludService saludService;
    private final ClaudeService claudeService;

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
                
                CONTEXTO DEL USUARIO:
                %s
                """.formatted(contexto);

        String respuesta = claudeService.chat(prompt, List.of(Map.of("role", "user", "content", mensaje)));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("respuesta", respuesta);
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
