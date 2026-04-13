package com.salud.entrenador.controller;

import com.salud.entrenador.model.CategoriaSalud;
import com.salud.entrenador.model.EntradaSalud;
import com.salud.entrenador.service.SaludService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/salud")
@RequiredArgsConstructor
public class SaludController {

    private final SaludService saludService;

    /**
     * POST /api/salud/{usuarioId}/chat
     * Envia un mensaje de salud y recibe respuesta de IA.
     */
    @PostMapping("/{usuarioId}/chat")
    public ResponseEntity<EntradaSalud> chat(
            @PathVariable Long usuarioId,
            @RequestBody Map<String, String> body) {
        String mensaje = body.get("mensaje");
        if (mensaje == null || mensaje.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        EntradaSalud entrada = saludService.procesarMensaje(usuarioId, mensaje);
        return ResponseEntity.ok(entrada);
    }

    /**
     * GET /api/salud/{usuarioId}/historial
     * Obtiene la timeline de salud del usuario.
     */
    @GetMapping("/{usuarioId}/historial")
    public ResponseEntity<List<EntradaSalud>> historial(
            @PathVariable Long usuarioId,
            @RequestParam(required = false) String categoria) {
        if (categoria != null && !categoria.isBlank()) {
            try {
                CategoriaSalud cat = CategoriaSalud.valueOf(categoria.toUpperCase());
                return ResponseEntity.ok(saludService.obtenerHistorialPorCategoria(usuarioId, cat));
            } catch (IllegalArgumentException ignored) {
            }
        }
        return ResponseEntity.ok(saludService.obtenerHistorial(usuarioId));
    }

    /**
     * GET /api/salud/{usuarioId}/resumen
     * Resumen de salud para el entrenador.
     */
    @GetMapping("/{usuarioId}/resumen")
    public ResponseEntity<Map<String, String>> resumen(@PathVariable Long usuarioId) {
        String resumen = saludService.generarResumenSalud(usuarioId);
        return ResponseEntity.ok(Map.of("resumen", resumen));
    }
}
