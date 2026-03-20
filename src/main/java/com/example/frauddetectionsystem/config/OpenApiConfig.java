package com.example.frauddetectionsystem.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI fraudGuardOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("FraudGuard API")
                        .description("Bank-grade fraud detection APIs for transactions, analytics, and investigations")
                        .version("v1")
                        .contact(new Contact().name("FraudGuard Team").email("admin@gmail.com")));
    }
}

