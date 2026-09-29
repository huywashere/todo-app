package com.todoapp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "s3")
public class S3ObjectStorage implements ObjectStorage {
    private final S3Client s3;
    @Value("${app.storage.s3.bucket}") private String bucket;

    @Override public void put(String key, byte[] bytes, String contentType) {
        s3.putObject(PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(), RequestBody.fromBytes(bytes));
    }
    @Override public StoredObject get(String key) {
        var response = s3.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(key).build());
        return new StoredObject(response.asByteArray(), response.response().contentType());
    }
    @Override public void delete(String key) {
        s3.deleteObject(builder -> builder.bucket(bucket).key(key));
    }
}
