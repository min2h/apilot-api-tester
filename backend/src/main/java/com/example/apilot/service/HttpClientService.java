package com.example.apilot.service;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import com.example.apilot.model.HttpModels.AuthSpec;
import com.example.apilot.model.HttpModels.BodyMode;
import com.example.apilot.model.HttpModels.BodySpec;
import com.example.apilot.model.HttpModels.HttpRequestSpec;
import com.example.apilot.model.HttpModels.HttpResponseSpec;
import com.example.apilot.model.HttpModels.MultipartPart;
import com.example.apilot.model.HttpModels.NameValue;

import reactor.core.publisher.Mono;

@Service
public class HttpClientService {

    private final WebClient secureWebClient;
    private final WebClient insecureWebClient;

    public HttpClientService(@Qualifier("secureWebClient") WebClient secureWebClient,
                             @Qualifier("insecureWebClient") WebClient insecureWebClient) {
        this.secureWebClient = secureWebClient;
        this.insecureWebClient = insecureWebClient;
    }

    public Mono<HttpResponseSpec> send(HttpRequestSpec req) {
        long start = System.nanoTime();

        URI uri = buildUri(req.getUrl(), req.getQueryParams());
        boolean validateSsl = req.isValidateSsl();
        WebClient wc = validateSsl ? secureWebClient : insecureWebClient;

        // 요청 스펙 공통 셋업
        WebClient.RequestBodySpec rb = wc
                .mutate()
                .codecs(c -> c.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build()
                .method(HttpMethod.valueOf(req.getMethod().toUpperCase()))
                .uri(uri)
                .headers(h -> applyHeadersAndAuth(h, req))
                .accept(MediaType.ALL)
                .acceptCharset(StandardCharsets.UTF_8);

        WebClient.ResponseSpec rs;

        // 바디가 필요한 메서드만 전송
        if (requiresBody(req.getMethod())) {
            BodySpec body = req.getBody();
            if (body == null || body.getMode() == null || body.getMode() == BodyMode.none) {
                rs = rb.retrieve();
            } else {
                switch (body.getMode()) {
                    case json -> {
                        Object payload = body.getJson() == null ? Collections.emptyMap() : body.getJson();
                        rs = rb.contentType(MediaType.APPLICATION_JSON).bodyValue(payload).retrieve();
                    }
                    case form -> {
                        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
                        if (body.getForm() != null) {
                            for (NameValue nv : body.getForm()) {
                                if (nv.getName() != null) map.add(nv.getName(), nv.getValue());
                            }
                        }
                        rs = rb.contentType(MediaType.APPLICATION_FORM_URLENCODED)
                                .body(BodyInserters.fromFormData(map))
                                .retrieve();

                    }
                    case multipart -> {
                        MultiValueMap<String, HttpEntity<?>> mp = buildMultipart(body.getMultipart());
                        rs = rb.body(BodyInserters.fromMultipartData(mp)).retrieve();
                    }
                    case raw -> {
                        String raw = body.getRaw() == null ? "" : body.getRaw();
                        String ct = Optional.ofNullable(body.getRawContentType()).orElse("text/plain");
                        rs = rb.contentType(MediaType.parseMediaType(ct)).bodyValue(raw).retrieve();
                    }
                    default -> rs = rb.retrieve();
                }
            }
        } else {
            rs = rb.retrieve();
        }

        long timeout = (req.getTimeoutMs() <= 0 ? 60000 : req.getTimeoutMs()); // 기본 60초

        return rs.toEntity(byte[].class)
                .timeout(Duration.ofMillis(timeout))
                .map(entity -> {
                    long durationMs = (System.nanoTime() - start) / 1_000_000;
                    byte[] bytes = Optional.ofNullable(entity.getBody()).orElse(new byte[0]);

                    MediaType mt = entity.getHeaders().getContentType();
                    boolean textLike = isTextLike(mt);
                    boolean binary = !textLike;

                    String payload = binary
                            ? Base64.getEncoder().encodeToString(bytes)
                            : new String(bytes, StandardCharsets.UTF_8);

                    List<NameValue> headers = new ArrayList<>();
                    entity.getHeaders().forEach((k, v) ->
                            headers.add(NameValue.builder().name(k).value(String.join(", ", v)).build()));

                    return HttpResponseSpec.builder()
                            .status(entity.getStatusCode().value())
                            .statusText(entity.getStatusCode().toString())
                            .headers(headers)
                            .body(payload)
                            .bodyIsBinary(binary)
                            .durationMs(durationMs)
                            .sizeBytes(bytes.length)
                            .finalUrl("")
                            .cookies(Collections.emptyMap())
                            .build();
                });
    }

    private static boolean requiresBody(String method) {
        return switch (method.toUpperCase()) {
            case "POST", "PUT", "PATCH" -> true;
            default -> false;
        };
    }

    private static URI buildUri(String baseUrl, List<NameValue> query) {
        UriComponentsBuilder b = UriComponentsBuilder.fromUriString(baseUrl);
        if (query != null) {
            for (NameValue nv : query) {
                if (nv.getName() != null) b.queryParam(nv.getName(), nv.getValue());
            }
        }
        return b.build(true).toUri();
    }

    private static void applyHeadersAndAuth(HttpHeaders headers, HttpRequestSpec req) {
        if (req.getHeaders() != null) {
            for (NameValue nv : req.getHeaders()) {
                if (nv.getName() != null) headers.add(nv.getName(), nv.getValue());
            }
        }
        // 기본 헤더 보강 (없을 때만)
        if (!headers.containsKey(HttpHeaders.ACCEPT)) {
            headers.set(HttpHeaders.ACCEPT, "*/*");
        }
        if (!headers.containsKey(HttpHeaders.USER_AGENT)) {
            headers.set(HttpHeaders.USER_AGENT, "PostmanLite/1.0");
        }

        AuthSpec auth = req.getAuth();
        if (auth != null && auth.getType() != null) {
            switch (auth.getType()) {
                case "basic" -> {
                    String raw = (auth.getUsername() == null ? "" : auth.getUsername()) + ":" +
                                 (auth.getPassword() == null ? "" : auth.getPassword());
                    String val = Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
                    headers.set(HttpHeaders.AUTHORIZATION, "Basic " + val);
                }
                case "bearer" -> headers.set(HttpHeaders.AUTHORIZATION,
                        "Bearer " + (auth.getToken() == null ? "" : auth.getToken()));
                default -> {}
            }
        }
    }

    private static MultiValueMap<String, HttpEntity<?>> buildMultipart(List<MultipartPart> parts) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        if (parts == null) return builder.build();

        for (MultipartPart p : parts) {
            String name = p.getName();
            if (name == null) continue;

            if (p.getContentBase64() != null && !p.getContentBase64().isEmpty()) {
                byte[] bytes = Base64.getDecoder().decode(p.getContentBase64());
                String filename = Optional.ofNullable(p.getFilename()).orElse("file");
                MediaType ct = MediaType.parseMediaType(
                        Optional.ofNullable(p.getContentType()).orElse(MediaType.APPLICATION_OCTET_STREAM_VALUE));

                ByteArrayResource resource = new ByteArrayResource(bytes) {
                    @Override public String getFilename() { return filename; }
                };
                builder.part(name, resource).contentType(ct);
            } else {
                builder.part(name, Optional.ofNullable(p.getValue()).orElse(""));
            }
        }
        return builder.build();
    }

    private static boolean isTextLike(MediaType mt) {
        if (mt == null) return false;
        String t = mt.toString().toLowerCase(Locale.ROOT);
        return t.startsWith("text/")
                || t.contains("json")
                || t.contains("xml")
                || t.contains("javascript")
                || t.contains("html");
    }
}
