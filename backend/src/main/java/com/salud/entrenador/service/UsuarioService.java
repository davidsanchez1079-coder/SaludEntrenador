package com.salud.entrenador.service;

import com.salud.entrenador.model.Usuario;
import com.salud.entrenador.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public Usuario crear(Usuario usuario) {
        return usuarioRepository.save(usuario);
    }

    public Usuario obtenerPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));
    }

    public Usuario actualizar(Long id, Usuario datosActualizados) {
        Usuario usuario = obtenerPorId(id);
        if (datosActualizados.getNombre() != null) usuario.setNombre(datosActualizados.getNombre());
        if (datosActualizados.getEdad() != null) usuario.setEdad(datosActualizados.getEdad());
        if (datosActualizados.getSexo() != null) usuario.setSexo(datosActualizados.getSexo());
        if (datosActualizados.getPesoInicial() != null) usuario.setPesoInicial(datosActualizados.getPesoInicial());
        if (datosActualizados.getEstatura() != null) usuario.setEstatura(datosActualizados.getEstatura());
        if (datosActualizados.getObjetivo() != null) usuario.setObjetivo(datosActualizados.getObjetivo());
        if (datosActualizados.getTelefono() != null) usuario.setTelefono(datosActualizados.getTelefono());
        if (datosActualizados.getCorreo() != null) usuario.setCorreo(datosActualizados.getCorreo());
        if (datosActualizados.getCondiciones() != null) usuario.setCondiciones(datosActualizados.getCondiciones());
        if (datosActualizados.getAlergias() != null) usuario.setAlergias(datosActualizados.getAlergias());
        return usuarioRepository.save(usuario);
    }

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    /**
     * Genera un resumen en texto del perfil del usuario para pasarle a Claude como contexto.
     */
    public String generarResumenPerfil(Long usuarioId) {
        Usuario u = obtenerPorId(usuarioId);
        StringBuilder sb = new StringBuilder();
        sb.append("PERFIL DEL USUARIO:\n");
        sb.append("- Nombre: ").append(u.getNombre()).append("\n");
        if (u.getEdad() != null) sb.append("- Edad: ").append(u.getEdad()).append(" anios\n");
        if (u.getSexo() != null) sb.append("- Sexo: ").append(u.getSexo()).append("\n");
        if (u.getPesoInicial() != null) sb.append("- Peso inicial: ").append(u.getPesoInicial()).append(" kg\n");
        if (u.getEstatura() != null) sb.append("- Estatura: ").append(u.getEstatura()).append(" cm\n");
        if (u.getObjetivo() != null) sb.append("- Objetivo: ").append(u.getObjetivo()).append("\n");
        if (u.getCondiciones() != null && !u.getCondiciones().isBlank())
            sb.append("- Condiciones medicas: ").append(u.getCondiciones()).append("\n");
        if (u.getAlergias() != null && !u.getAlergias().isBlank())
            sb.append("- Alergias: ").append(u.getAlergias()).append("\n");
        return sb.toString();
    }
}
