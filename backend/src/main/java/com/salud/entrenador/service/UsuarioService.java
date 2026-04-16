package com.salud.entrenador.service;

import com.salud.entrenador.model.Usuario;
import com.salud.entrenador.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public Usuario obtenerPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + id));
    }

    public Usuario obtenerPorCorreo(String correo) {
        String correoNormalizado = normalizarCorreo(correo);
        if (correoNormalizado == null) {
            throw new RuntimeException("Correo invalido");
        }
        return usuarioRepository.findByCorreo(correoNormalizado)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con correo: " + correoNormalizado));
    }

    @Transactional
    public Usuario crearUsuario(Usuario usuario) {
        if (usuario == null) {
            throw new RuntimeException("Datos de usuario requeridos");
        }

        String nombre = limpiar(usuario.getNombre());
        if (nombre == null) {
            nombre = "Mi Perfil";
        }
        usuario.setNombre(nombre);

        String correo = normalizarCorreo(usuario.getCorreo());
        if (correo != null) {
            usuarioRepository.findByCorreo(correo).ifPresent(existing -> {
                throw new IllegalStateException("Ya existe un usuario con ese correo");
            });
            usuario.setCorreo(correo);
        }

        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario actualizarUsuario(Long id, Usuario cambios) {
        Usuario actual = obtenerPorId(id);

        if (cambios.getNombre() != null && !cambios.getNombre().isBlank()) {
            actual.setNombre(cambios.getNombre().trim());
        }
        if (cambios.getEdad() != null) actual.setEdad(cambios.getEdad());
        if (cambios.getSexo() != null) actual.setSexo(limpiar(cambios.getSexo()));
        if (cambios.getPesoInicial() != null) actual.setPesoInicial(cambios.getPesoInicial());
        if (cambios.getEstatura() != null) actual.setEstatura(cambios.getEstatura());
        if (cambios.getObjetivoGeneral() != null) actual.setObjetivoGeneral(limpiar(cambios.getObjetivoGeneral()));
        if (cambios.getObjetivoEspecifico() != null) actual.setObjetivoEspecifico(limpiar(cambios.getObjetivoEspecifico()));
        if (cambios.getTelefono() != null) actual.setTelefono(limpiar(cambios.getTelefono()));
        if (cambios.getCondiciones() != null) actual.setCondiciones(limpiar(cambios.getCondiciones()));
        if (cambios.getAlergias() != null) actual.setAlergias(limpiar(cambios.getAlergias()));

        if (cambios.getCorreo() != null) {
            String correoNormalizado = normalizarCorreo(cambios.getCorreo());
            if (correoNormalizado == null) {
                actual.setCorreo(null);
            } else {
                usuarioRepository.findByCorreo(correoNormalizado)
                        .filter(other -> !other.getId().equals(actual.getId()))
                        .ifPresent(other -> {
                            throw new IllegalStateException("Ese correo ya pertenece a otro usuario");
                        });
                actual.setCorreo(correoNormalizado);
            }
        }

        return usuarioRepository.save(actual);
    }

    public String generarResumenPerfil(Long usuarioId) {
        Usuario usuario = obtenerPorId(usuarioId);

        StringBuilder sb = new StringBuilder();
        sb.append("Perfil del usuario:\n");
        sb.append("- Nombre: ").append(valor(usuario.getNombre(), "No definido")).append("\n");
        sb.append("- Edad: ").append(valor(usuario.getEdad(), "No definida")).append("\n");
        sb.append("- Sexo: ").append(valor(usuario.getSexo(), "No definido")).append("\n");
        sb.append("- Peso inicial: ").append(valor(usuario.getPesoInicial(), "No definido")).append("\n");
        sb.append("- Estatura: ").append(valor(usuario.getEstatura(), "No definida")).append("\n");
        sb.append("- Objetivo general: ").append(valor(usuario.getObjetivoGeneral(), "No definido")).append("\n");
        sb.append("- Objetivo especifico: ").append(valor(usuario.getObjetivoEspecifico(), "No definido")).append("\n");
        sb.append("- Condiciones: ").append(valor(usuario.getCondiciones(), "Ninguna registrada")).append("\n");
        sb.append("- Alergias: ").append(valor(usuario.getAlergias(), "Ninguna registrada")).append("\n");
        sb.append("- Correo confirmado: ").append(valor(usuario.getCorreo(), "No registrado")).append("\n");
        return sb.toString();
    }

    public Map<String, Object> resumenLigero(Long usuarioId) {
        Usuario usuario = obtenerPorId(usuarioId);
        return Map.of(
                "id", usuario.getId(),
                "nombre", usuario.getNombre() == null ? "Mi Perfil" : usuario.getNombre(),
                "correo", usuario.getCorreo()
        );
    }

    private String normalizarCorreo(String correo) {
        if (correo == null) return null;
        String v = correo.trim().toLowerCase();
        return v.isBlank() ? null : v;
    }

    private String limpiar(String valor) {
        if (valor == null) return null;
        String v = valor.trim();
        return v.isBlank() ? null : v;
    }

    private String valor(Object valor, String fallback) {
        return valor == null || valor.toString().isBlank() ? fallback : valor.toString();
    }
}
