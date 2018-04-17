---
name: go
title: "Go Invoker"
author: projectriff
href: https://github.com/projectriff/go-function-invoker
development:
  href: https://github.com/projectriff/go-function-invoker/raw/master/go-invoker.yaml
releases:
- version: v0.0.2
  href: https://github.com/projectriff/go-function-invoker/raw/v0.0.2/go-invoker.yaml
  date: '2018-04-06'
---

*by [{{page.author}}]({{ page.href }})*

The go function invoker provides a Docker base layer for a function built as a [Go plugin](https://golang.org/pkg/plugin/).
It accepts gRPC requests, invokes the command for each request in the input stream,
and sends the command's output to the stream of gRPC responses.
