package com.todoapp.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TaskFlow & TickTick Pro Backend API")
                        .version("1.0.0")
                        .description("REST API chuẩn kiến trúc hiện đại bằng Java Spring Boot 3.4 cho ứng dụng quản lý công việc và dự án cá nhân.")
                        .contact(new Contact().name("Development Team").email("support@todoapp.com"))
                        .license(new License().name("Apache 2.0").url("https://spring.io")));
    }
}
