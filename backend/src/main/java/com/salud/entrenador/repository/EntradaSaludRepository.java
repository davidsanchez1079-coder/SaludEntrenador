package com.salud.entrenador.repository;

import com.salud.entrenador.model.CategoriaSalud;
import com.salud.entrenador.model.EntradaSalud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EntradaSaludRepository extends JpaRepository<EntradaSalud, Long> {

    List<EntradaSalud> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    List<EntradaSalud> findByUsuarioIdAndCategoria(Long usuarioId, CategoriaSalud categoria);
}
