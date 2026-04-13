package com.salud.entrenador.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ClaudeService {

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${anthropic.api-key}")
    private String apiKey;

    @Value("${anthropic.model}")
    private String model;

    @Value("${anthropic.max-tokens}")
    private int maxTokens;

    public ClaudeService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Envia un mensaje a la API de Claude y retorna la respuesta como texto.
     *
     * @param systemPrompt El prompt de sistema que define el comportamiento del asistente
     * @param messages Lista de mensajes en formato [{role: "user"/"assistant", content: "..."}]
     * @return La respuesta de texto de Claude
     */
    public String chat(String systemPrompt, List<Map<String, String>> messages) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("API key de Anthropic no configurada. Retornando respuesta simulada.");
            return "{\"respuesta\": \"API key no configurada. Configure la variable ANTHROPIC_API_KEY.\", \"categoria\": \"BIENESTAR\", \"datos_extraidos\": {}}";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", apiKey);
            headers.set("anthropic-version", "2023-06-01");

            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "max_tokens", maxTokens,
                    "system", systemPrompt,
                    "messages", messages
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    ANTHROPIC_API_URL,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            return extractTextFromResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error al llamar a la API de Claude: {}", e.getMessage());
            return "{\"respuesta\": \"Error al comunicarse con el asistente de IA: " +
                    e.getMessage().replace("\"", "'") +
                    "\", \"categoria\": \"BIENESTAR\", \"datos_extraidos\": {}}";
        }
    }

    /**
     * Extrae el texto del content de la respuesta de Claude.
     * La estructura de respuesta es: { content: [{ type: "text", text: "..." }] }
     */
    private String extractTextFromResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode contentArray = root.get("content");

            if (contentArray != null && contentArray.isArray()) {
                for (JsonNode block : contentArray) {
                    if ("text".equals(block.get("type").asText())) {
                        return block.get("text").asText();
                    }
                }
            }

            log.warn("Respuesta de Claude sin contenido de texto: {}", responseBody);
            return "{\"respuesta\": \"Respuesta vacia del asistente.\", \"categoria\": \"BIENESTAR\", \"datos_extraidos\": {}}";

        } catch (Exception e) {
            log.error("Error al parsear respuesta de Claude: {}", e.getMessage());
            return responseBody;
        }
    }
}
