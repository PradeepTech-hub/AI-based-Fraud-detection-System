package com.example.frauddetectionsystem.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CaseResolutionRequest {
    @Size(max = 1000, message = "Analyst notes must be up to 1000 characters")
    private String analystNotes;
}

