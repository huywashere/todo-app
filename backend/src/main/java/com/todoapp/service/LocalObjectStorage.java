package com.todoapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalObjectStorage implements ObjectStorage {
    private final Path root;

    public LocalObjectStorage(@Value("${app.storage.local-path:./data/attachments}") String root) {
        this.root = Path.of(root).toAbsolutePath().normalize();
    }

    @Override
    public void put(String key, byte[] bytes, String contentType) {
        try {
            Path target = resolve(key);
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
            Files.writeString(Path.of(target + ".content-type"), contentType == null ? "application/octet-stream" : contentType);
        } catch (IOException exception) {
            throw new IllegalStateException("Không thể lưu tệp đính kèm", exception);
        }
    }

    @Override
    public StoredObject get(String key) {
        try {
            Path target = resolve(key);
            String type = Files.exists(Path.of(target + ".content-type"))
                    ? Files.readString(Path.of(target + ".content-type")) : "application/octet-stream";
            return new StoredObject(Files.readAllBytes(target), type);
        } catch (IOException exception) {
            throw new com.todoapp.exception.ResourceNotFoundException("Không tìm thấy tệp đính kèm");
        }
    }

    @Override
    public void delete(String key) {
        try {
            Path target = resolve(key);
            Files.deleteIfExists(target);
            Files.deleteIfExists(Path.of(target + ".content-type"));
        } catch (IOException exception) {
            throw new IllegalStateException("Không thể xóa tệp đính kèm", exception);
        }
    }

    private Path resolve(String key) {
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) throw new IllegalArgumentException("Storage key không hợp lệ");
        return target;
    }
}
