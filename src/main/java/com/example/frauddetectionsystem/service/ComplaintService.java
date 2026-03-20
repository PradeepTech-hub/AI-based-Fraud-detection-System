package com.example.frauddetectionsystem.service;

import com.example.frauddetectionsystem.dto.ComplaintRequest;
import com.example.frauddetectionsystem.dto.ComplaintResponse;
import com.example.frauddetectionsystem.model.Complaint;
import com.example.frauddetectionsystem.model.ComplaintStatus;
import com.example.frauddetectionsystem.repository.ComplaintRepository;
import com.example.frauddetectionsystem.repository.TransactionRepository;
import com.example.frauddetectionsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public ComplaintResponse submitComplaint(Long userId, ComplaintRequest request) {
        userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (!transactionRepository.existsById(request.getTransactionId())) {
            throw new IllegalArgumentException("Transaction not found: " + request.getTransactionId());
        }

        Complaint complaint = Complaint.builder()
                .userId(userId)
                .transactionId(request.getTransactionId())
                .description(request.getDescription().trim())
                .status(ComplaintStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();

        return map(complaintRepository.save(complaint));
    }

    public List<ComplaintResponse> getComplaintsForUser(Long userId) {
        return complaintRepository.findByUserId(userId).stream().map(this::map).collect(Collectors.toList());
    }

    public List<ComplaintResponse> getAllComplaints() {
        return complaintRepository.findAll().stream().map(this::map).collect(Collectors.toList());
    }

    @Transactional
    public ComplaintResponse resolveComplaint(Long complaintId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found: " + complaintId));

        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolvedAt(LocalDateTime.now());
        return map(complaintRepository.save(complaint));
    }

    private ComplaintResponse map(Complaint c) {
        return ComplaintResponse.builder()
                .id(c.getId())
                .userId(c.getUserId())
                .transactionId(c.getTransactionId())
                .description(c.getDescription())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .resolvedAt(c.getResolvedAt())
                .build();
    }
}
