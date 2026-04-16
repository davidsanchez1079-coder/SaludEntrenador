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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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

    public EntradaSalud procesarMensaje(Long usuarioId, String mensaje) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + usuarioId));

        String perfilResumen = usuarioService.generarResumenPerfil(usuarioId);
        String resumenSaludVivo = generarResumenSalud(usuarioId);
        String systemPrompt = String.format(SYSTEM_PROMPT_TEMPLATE, perfilResumen + "\n\n" + resumenSaludVivo);

        List<EntradaSalud> historial = entradaSaludRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
        List<Map<String, String>> messages = construirHistorial(historial, mensaje);

        String respuestaIA = claudeService.chat(systemPrompt, messages);

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

        EntradaSalud entrada = EntradaSalud.builder()
                .usuario(usuario)
                .textoOriginal(mensaje)
                .categoria(categoria)
                .datosExtraidos(datosExtraidos)
                .respuestaIA(respuestaTexto)
                .build();

        return entradaSaludRepository.save(entrada);
    }

    public List<EntradaSalud> obtenerHistorial(Long usuarioId) {
        return entradaSaludRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);
    }

    public List<EntradaSalud> obtenerHistorialPorCategoria(Long usuarioId, CategoriaSalud categoria) {
        return entradaSaludRepository.findByUsuarioIdAndCategoria(usuarioId, categoria);
    }

    public String generarResumenSalud(Long usuarioId) {
        List<EntradaSalud> entradas = entradaSaludRepository.findByUsuarioIdOrderByFechaDesc(usuarioId);

        if (entradas.isEmpty()) {
            return "Sin registros de salud.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("RESUMEN VIVO DE SALUD:\n");

        Map<String, String> vigentes = extraerDatosVigentes(entradas);
        if (!vigentes.isEmpty()) {
            sb.append("\nDATOS VIGENTES:\n");
            vigentes.forEach((k, v) -> sb.append("- ").append(k).append(": ").append(v).append("\n"));
        }

        sb.append("\nULTIMOS EVENTOS IMPORTANTES:\n");
        int count = 0;
        for (EntradaSalud e : entradas) {
            if (count >= 8) break;
            sb.append(String.format("- [%s] %s: %s\n",
                    e.getFecha() != null ? e.getFecha().toLocalDate() : "sin fecha",
                    e.getCategoria(),
                    resumirTexto(e.getTextoOriginal())));
            count++;
        }
        return sb.toString();
    }

    private Map<String, String> extraerDatosVigentes(List<EntradaSalud> entradas) {
        Map<String, String> vigentes = new LinkedHashMap<>();

        for (EntradaSalud e : entradas) {
            String texto = ((e.getTextoOriginal() == null ? "" : e.getTextoOriginal()) + " " +
                    (e.getRespuestaIA() == null ? "" : e.getRespuestaIA())).toLowerCase();

            if (!vigentes.containsKey("Mounjaro actual") && texto.contains("mounjaro") && texto.contains("5 mg")) {
                vigentes.put("Mounjaro actual", "5 mg por semana");
            } else if (!vigentes.containsKey("Mounjaro actual") && texto.contains("mounjaro") && texto.contains("10 mg")) {
                vigentes.put("Mounjaro actual", "10 mg por semana");
            }

            if (!vigentes.containsKey("Tratamiento actual") && texto.contains("tirzepatida")) {
                vigentes.put("Tratamiento actual", "Tirzepatida (Mounjaro)");
            }

            if (!vigentes.containsKey("Sintomas digestivos") && (texto.contains("diarrea") || texto.contains("inflamacion abdominal") || texto.contains("molestia digestiva"))) {
                vigentes.put("Sintomas digestivos", "Inflamacion abdominal / diarrea / molestia digestiva");
            }

            if (!vigentes.containsKey("Frecuencia de entrenamiento") && (texto.contains("4-5 dias") || texto.contains("4 a 5 dias") || texto.contains("4 o 5 dias"))) {
                vigentes.put("Frecuencia de entrenamiento", "4 a 5 dias por semana");
            }

            if (!vigentes.containsKey("Fecha base de laboratorios") && e.getCategoria() == CategoriaSalud.LABORATORIO) {
                LocalDate fecha = e.getFecha() != null ? e.getFecha().toLocalDate() : null;
                if (fecha != null) {
                    vigentes.put("Fecha base de laboratorios", fecha.toString());
                }
            }
        }

        return vigentes;
    }

    private String resumirTexto(String texto) {
        if (texto == null || texto.isBlank()) return "Sin detalle";
        String limpio = texto.replaceAll("\n+", " ").trim();
        return limpio.length() > 140 ? limpio.substring(0, 140) + "..." : limpio;
    }

    private List<Map<String, String>> construirHistorial(List<EntradaSalud> historial, String mensajeActual) {
        List<Map<String, String>> messages = new ArrayList<>();

        int start = Math.max(0, historial.size() - 10);
        List<EntradaSalud> recientes = new ArrayList<>(historial.subList(start, historial.size()));
        java.util.Collections.reverse(recientes);

        for (EntradaSalud entrada : recientes) {
            messages.add(Map.of("role", "user", "content", entrada.getTextoOriginal()));
            if (entrada.getRespuestaIA() != null) {
                messages.add(Map.of("role", "assistant", "content", entrada.getRespuestaIA()));
            }
        }

        messages.add(Map.of("role", "user", "content", mensajeActual));
        return messages;
    }
}
