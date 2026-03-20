package com.example.frauddetectionsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FraudDetectionSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(FraudDetectionSystemApplication.class, args);
    }

}
