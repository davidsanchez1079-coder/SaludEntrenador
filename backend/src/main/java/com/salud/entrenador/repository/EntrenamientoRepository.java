package com.salud.entrenador.repository;

import com.salud.entrenador.model.Entrenamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EntrenamientoRepository extends JpaRepository<Entrenamiento, Long> {

    List<Entrenamiento> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    List<Entrenamiento> findTop5ByUsuarioIdOrderByFechaDesc(Long usuarioId);
}
