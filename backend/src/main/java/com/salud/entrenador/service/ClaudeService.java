package com.salud.entrenador.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ClaudeService {

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    @Value("${openai.max-tokens}")
    private int maxTokens;

    public ClaudeService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Envia un mensaje a la API de OpenAI y retorna la respuesta como texto.
     *
     * @param systemPrompt El prompt de sistema que define el comportamiento del asistente
     * @param messages Lista de mensajes en formato [{role: "user"/"assistant", content: "..."}]
     * @return La respuesta de texto del modelo
     */
    public String chat(String systemPrompt, List<Map<String, String>> messages) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("API key de OpenAI no configurada. Retornando respuesta simulada.");
            return "{\"respuesta\": \"API key no configurada. Configure la variable OPENAI_API_KEY.\", \"categoria\": \"BIENESTAR\", \"datos_extraidos\": {}}";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            // OpenAI espera el system prompt como primer mensaje con role "system"
            List<Map<String, String>> allMessages = new ArrayList<>();
            allMessages.add(Map.of("role", "system", "content", systemPrompt));
            allMessages.addAll(messages);

            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "max_tokens", maxTokens,
                    "messages", allMessages
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    OPENAI_API_URL,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            return extractTextFromResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error al llamar a la API de OpenAI: {}", e.getMessage());
            return "{\"respuesta\": \"Error al comunicarse con el asistente de IA: " +
                    e.getMessage().replace("\"", "'") +
                    "\", \"categoria\": \"BIENESTAR\", \"datos_extraidos\": {}}";
        }
    }

    /**
     * Extrae el texto de la respuesta de OpenAI.
     * Estructura: { choices: [{ message: { content: "..." } }] }
     */
    private String extractTextFromResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.get("choices");

            if (choices != null && choices.isArray() && !choices.isEmpty()) {
                JsonNode message = choices.get(0).get("message");
                if (message != null && message.has("content")) {
                    return message.get("content").asText();
                }
            }

            log.warn("Respuesta de OpenAI sin contenido de texto: {}", responseBody);
            return "{\"respuesta\": \"Respuesta vacia del asistente.\", \"categoria\": \"BIENESTAR\", \"datos_extraidos\": {}}";

        } catch (Exception e) {
            log.error("Error al parsear respuesta de OpenAI: {}", e.getMessage());
            return responseBody;
        }
    }
}
