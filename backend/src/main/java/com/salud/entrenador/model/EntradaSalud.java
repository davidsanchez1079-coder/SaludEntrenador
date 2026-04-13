package com.salud.entrenador.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "entradas_salud")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EntradaSalud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    private LocalDateTime fecha;

    @Enumerated(EnumType.STRING)
    private CategoriaSalud categoria;

    @Column(length = 2000)
    private String textoOriginal;

    @Column(columnDefinition = "TEXT")
    private String datosExtraidos;

    @Column(columnDefinition = "TEXT")
    private String respuestaIA;

    @PrePersist
    protected void onCreate() {
        if (this.fecha == null) {
            this.fecha = LocalDateTime.now();
        }
    }
}
