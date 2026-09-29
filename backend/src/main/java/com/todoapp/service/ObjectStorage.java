package com.todoapp.service;

public interface ObjectStorage {
    void put(String key, byte[] bytes, String contentType);
    StoredObject get(String key);
    void delete(String key);

    record StoredObject(byte[] bytes, String contentType) {}
}
