package com.example.apilot.controller;

import com.example.apilot.model.HttpModels.HttpRequestSpec;
import com.example.apilot.model.HttpModels.HttpResponseSpec;
import com.example.apilot.service.HttpClientService;

import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api")
public class HttpProxyController {

    private final HttpClientService httpClientService;

    public HttpProxyController(HttpClientService httpClientService) {
        this.httpClientService = httpClientService;
    }

    @PostMapping(value = "/send", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<HttpResponseSpec> send(@RequestBody @Valid HttpRequestSpec req) {
        return httpClientService.send(req);
    }

    @GetMapping("/ping")
    public Mono<String> ping() { return Mono.just("pong"); }
}
