package com.example.apilot.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

public class HttpModels {

    @Data
    @Builder
    public static class NameValue {
        private String name;
        private String value;
    }

    @Data
    @Builder
    public static class MultipartPart {
        private String name;
        private String filename;
        private String contentType;
        private String contentBase64;
        private String value;
    }

    public enum BodyMode { none, json, form, multipart, raw }

    @Data
    @Builder
    public static class BodySpec {
        private BodyMode mode;
        private Object json;
        private List<NameValue> form;
        private List<MultipartPart> multipart;
        private String raw;
        private String rawContentType;
    }

    @Data
    @Builder
    public static class AuthSpec {
        private String type; // none|basic|bearer
        private String username;
        private String password;
        private String token;
    }

    @Data
    @Builder
    public static class HttpRequestSpec {
        @NotBlank
        private String url;
        @NotBlank
        private String method;
        private List<NameValue> headers;
        private List<NameValue> queryParams;
        private BodySpec body;
        private AuthSpec auth;
        
//        // primitive → Wrapper 로 바꾸기
//        private Boolean followRedirects;
//        private Boolean validateSsl;
//        private Long timeoutMs;
        @Builder.Default
        private boolean followRedirects = true;
        @Builder.Default
        private boolean validateSsl = true;
        @Builder.Default
        private long timeoutMs = 60000;
    }

    @Data
    @Builder
    public static class HttpResponseSpec {
        private int status;
        private String statusText;
        private List<NameValue> headers;
        private String body;
        private boolean bodyIsBinary;
        private long durationMs;
        private long sizeBytes;
        private String finalUrl;
        private Map<String, String> cookies;
    }
}
