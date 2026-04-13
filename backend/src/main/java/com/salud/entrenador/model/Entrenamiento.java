package com.salud.entrenador.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "entrenamientos")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Entrenamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    private LocalDateTime fecha;

    private String nombreRutina;

    @Column(columnDefinition = "TEXT")
    private String ejerciciosLog;

    private Boolean completado;

    @Column(columnDefinition = "TEXT")
    private String resumenSesion;

    @PrePersist
    protected void onCreate() {
        if (this.fecha == null) {
            this.fecha = LocalDateTime.now();
        }
    }
}
