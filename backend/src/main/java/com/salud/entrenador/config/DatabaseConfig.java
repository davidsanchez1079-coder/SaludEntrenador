package com.salud.entrenador.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

/**
 * Configuracion del DataSource para produccion (Railway).
 *
 * Railway expone DATABASE_URL en formato: postgresql://user:pass@host:port/db
 * pero Spring/JDBC necesita el prefijo "jdbc:" -> jdbc:postgresql://...
 *
 * Esta clase lee la variable, agrega el prefijo si falta, y configura
 * el DataSource explicitamente para evitar errores de resolucion de variables.
 */
@Configuration
@Profile("prod")
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${PGUSER:postgres}")
    private String dbUser;

    @Value("${PGPASSWORD:postgres}")
    private String dbPassword;

    @Bean
    public DataSource dataSource() {
        String url = databaseUrl != null ? databaseUrl.trim() : "";
        if (url.isEmpty()) {
            throw new IllegalStateException("DATABASE_URL no esta configurada en el entorno");
        }
        // Agregar prefijo jdbc: si no lo tiene
        if (!url.startsWith("jdbc:")) {
            url = "jdbc:" + url;
        }

        HikariDataSource ds = new HikariDataSource();
        ds.setDriverClassName("org.postgresql.Driver");
        ds.setJdbcUrl(url);
        ds.setUsername(dbUser);
        ds.setPassword(dbPassword);
        return ds;
    }
}
