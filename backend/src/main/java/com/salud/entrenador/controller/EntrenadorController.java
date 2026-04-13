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

    @PostMapping("/{usuarioId}/chat")
    public ResponseEntity<Map<String, Object>> chat(
            @PathVariable Long usuarioId,
            @RequestBody Map<String, String> body) {
        String mensaje = body.get("mensaje");
        if (mensaje == null || mensaje.isBlank()) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(entrenadorService.procesarMensaje(usuarioId, mensaje));
    }

    @PostMapping("/{usuarioId}/feedback-serie")
    public ResponseEntity<Map<String, Object>> feedbackSerie(
            @PathVariable Long usuarioId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(entrenadorService.feedbackSerie(usuarioId, body));
    }

    @PostMapping("/{usuarioId}/resumen-sesion")
    public ResponseEntity<Map<String, Object>> resumenSesion(
            @PathVariable Long usuarioId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(entrenadorService.resumenSesion(usuarioId, body));
    }

    @PostMapping("/{usuarioId}/workout")
    public ResponseEntity<Entrenamiento> guardarWorkout(
            @PathVariable Long usuarioId,
            @RequestBody Entrenamiento entrenamiento) {
        return ResponseEntity.status(HttpStatus.CREATED).body(entrenadorService.guardarEntrenamiento(usuarioId, entrenamiento));
    }

    @GetMapping("/{usuarioId}/historial")
    public ResponseEntity<List<Entrenamiento>> historial(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(entrenadorService.obtenerHistorial(usuarioId));
    }
}
