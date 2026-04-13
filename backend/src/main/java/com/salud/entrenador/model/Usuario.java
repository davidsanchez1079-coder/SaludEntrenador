package com.salud.entrenador.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private Integer edad;

    private String sexo;

    private Double pesoInicial;

    private Double estatura;

    private String objetivoGeneral;

    @Column(columnDefinition = "TEXT")
    private String objetivoEspecifico;

    private String telefono;

    private String correo;

    @Column(columnDefinition = "TEXT")
    private String condiciones;

    @Column(columnDefinition = "TEXT")
    private String alergias;

    @Column(updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }
}
