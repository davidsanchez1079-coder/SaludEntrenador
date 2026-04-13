package com.salud.entrenador.controller;

import com.salud.entrenador.model.Entrenamiento;
import com.salud.entrenador.service.EntrenadorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entrenador")
@RequiredArgsConstructor
public class EntrenadorController {

    private final EntrenadorService entrenadorService;

    /**
     * POST /api/entrenador/{usuarioId}/chat
     * Envia un mensaje al entrenador IA. Puede devolver rutina.
     */
    @PostMapping("/{usuarioId}/chat")
    public ResponseEntity<Map<String, Object>> chat(
            @PathVariable Long usuarioId,
            @RequestBody Map<String, String> body) {
        String mensaje = body.get("mensaje");
        if (mensaje == null || mensaje.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Map<String, Object> resultado = entrenadorService.procesarMensaje(usuarioId, mensaje);
        return ResponseEntity.ok(resultado);
    }

    /**
     * POST /api/entrenador/{usuarioId}/workout
     * Guarda un entrenamiento completado.
     */
    @PostMapping("/{usuarioId}/workout")
    public ResponseEntity<Entrenamiento> guardarWorkout(
            @PathVariable Long usuarioId,
            @RequestBody Entrenamiento entrenamiento) {
        Entrenamiento guardado = entrenadorService.guardarEntrenamiento(usuarioId, entrenamiento);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    /**
     * GET /api/entrenador/{usuarioId}/historial
     * Historial de entrenamientos del usuario.
     */
    @GetMapping("/{usuarioId}/historial")
    public ResponseEntity<List<Entrenamiento>> historial(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(entrenadorService.obtenerHistorial(usuarioId));
    }
}
