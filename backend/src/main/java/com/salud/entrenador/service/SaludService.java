package com.salud.entrenador.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.salud.entrenador.model.CategoriaSalud;
import com.salud.entrenador.model.EntradaSalud;
import com.salud.entrenador.model.Usuario;
import com.salud.entrenador.repository.EntradaSaludRepository;
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
public class SaludService {

    private final ClaudeService claudeService;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final EntradaSaludRepository entradaSaludRepository;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            Eres un asistente de salud personal. Tu rol es ayudar a registrar y dar seguimiento
            a la informacion de salud del usuario. NO eres medico ni das diagnosticos, pero ayudas
            a organizar la informacion de salud.

            %s

            Cuando el usuario te comparta informacion de salud, responde SIEMPRE en formato JSON:
            {
              "respuesta": "Tu respuesta conversacional aqui",
              "categoria": "MEDICAMENTO|SINTOMA|MEDIDA|LABORATORIO|BIENESTAR|NUTRICION",
              "datos_extraidos": {
                "tipo": "descripcion del dato",
                "valor": "valor si aplica",
                "unidad": "unidad si aplica"
              }
            }

            Categorias:
            - MEDICAMENTO: medicinas, suplementos, dosis
            - SINTOMA: dolores, malestares, sintomas fisicos
            - MEDIDA: peso, presion arterial, glucosa, medidas corporales
            - LABORATORIO: resultados de analisis, estudios medicos
            - BIENESTAR: estado de animo, suenio, energia, estres
            - NUTRICION: alimentacion, dietas, calorias, hidratacion
            """;

    /**
     * Procesa un mensaje del usuario relacionado a salud.
     */
    public EntradaSalud procesarMensaje(Long usuarioId, String mensaje) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));

        String perfilResumen = usuarioService.generarResumenPerfil(usuarioId);
        String systemPrompt = String.format(SYSTEM_PROMPT_TEMPLATE, perfilResumen);

        // Construir historial de conversacion (ultimos 10 mensajes)
        List<EntradaSalud> historial = entradaSaludRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
        List<Map<String, String>> messages = construirHistorial(historial, mensaje);

        // Llamar a Claude
        String respuestaIA = claudeService.chat(systemPrompt, messages);
        respuestaIA = respuestaIA.replaceAll("```json", "").replaceAll("```", "").trim();

        // Parsear respuesta
        CategoriaSalud categoria = CategoriaSalud.BIENESTAR;
        String datosExtraidos = "{}";
        String respuestaTexto = respuestaIA;

        try {
            JsonNode json = objectMapper.readTree(respuestaIA);
            if (json.has("respuesta")) {
                respuestaTexto = json.get("respuesta").asText();
            }
            if (json.has("categoria")) {
                String cat = json.get("categoria").asText().toUpperCase();
                try {
                    categoria = CategoriaSalud.valueOf(cat);
                } catch (IllegalArgumentException ignored) {
                }
            }
            if (json.has("datos_extraidos")) {
                datosExtraidos = objectMapper.writeValueAsString(json.get("datos_extraidos"));
            }
        } catch (Exception e) {
            log.warn("Respuesta de Claude no es JSON valido, guardando como texto: {}", e.getMessage());
            respuestaTexto = respuestaIA;
        }

        // Guardar entrada
        EntradaSalud entrada = EntradaSalud.builder()
                .usuario(usuario)
                .textoOriginal(mensaje)
                .categoria(categoria)
                .datosExtraidos(datosExtraidos)
                .respuestaIA(respuestaTexto)
                .build();

        return entradaSaludRepository.save(entrada);
    }

    /**
     * Obtiene el historial de salud de un usuario ordenado por fecha descendente.
     */
    public List<EntradaSalud> obtenerHistorial(Long usuarioId) {
        return entradaSaludRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
    }

    /**
     * Obtiene historial filtrado por categoria.
     */
    public List<EntradaSalud> obtenerHistorialPorCategoria(Long usuarioId, CategoriaSalud categoria) {
        return entradaSaludRepository.findByUsuarioIdAndCategoria(usuarioId, categoria);
    }

    /**
     * Genera un resumen de salud del usuario para el entrenador.
     */
    public String generarResumenSalud(Long usuarioId) {
        List<EntradaSalud> entradas = entradaSaludRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);

        if (entradas.isEmpty()) {
            return "Sin registros de salud.";
        }

        StringBuilder sb = new StringBuilder("RESUMEN DE SALUD RECIENTE:\n");
        int count = 0;
        for (EntradaSalud e : entradas) {
            if (count >= 10) break;
            sb.append(String.format("- [%s] %s: %s\n",
                    e.getFecha() != null ? e.getFecha().toLocalDate() : "sin fecha",
                    e.getCategoria(),
                    e.getTextoOriginal()));
            count++;
        }
        return sb.toString();
    }

    private List<Map<String, String>> construirHistorial(List<EntradaSalud> historial, String mensajeActual) {
        List<Map<String, String>> messages = new ArrayList<>();

        // Agregar los ultimos 10 mensajes del historial (en orden cronologico)
        int start = Math.max(0, historial.size() - 10);
        List<EntradaSalud> recientes = new ArrayList<>(historial.subList(start, historial.size()));
        java.util.Collections.reverse(recientes);

        for (EntradaSalud entrada : recientes) {
            messages.add(Map.of("role", "user", "content", entrada.getTextoOriginal()));
            if (entrada.getRespuestaIA() != null) {
                messages.add(Map.of("role", "assistant", "content", entrada.getRespuestaIA()));
            }
        }

        // Agregar mensaje actual
        messages.add(Map.of("role", "user", "content", mensajeActual));
        return messages;
    }
}
