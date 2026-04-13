package com.salud.entrenador.repository;

import com.salud.entrenador.model.Entrenamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EntrenamientoRepository extends JpaRepository<Entrenamiento, Long> {

    List<Entrenamiento> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    List<Entrenamiento> findTop5ByUsuarioIdOrderByFechaDesc(Long usuarioId);

    /**
     * Busca los ultimos 4 entrenamientos donde el log contiene el nombre del ejercicio.
     */
    @Query("SELECT e FROM Entrenamiento e WHERE e.usuario.id = :usuarioId AND e.ejerciciosLog LIKE %:ejercicio% ORDER BY e.fecha DESC LIMIT 4")
    List<Entrenamiento> findHistorialEjercicio(@Param("usuarioId") Long usuarioId, @Param("ejercicio") String ejercicio);
}
