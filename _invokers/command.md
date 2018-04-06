---
name: command
title: "Command Invoker"
author: projectriff
href: https://github.com/projectriff/command-function-invoker
development:
  href: https://github.com/projectriff/command-function-invoker/raw/master/command-invoker.yaml
releases:
- version: v0.0.6
  href: https://github.com/projectriff/command-function-invoker/raw/v0.0.6/command-invoker.yaml
  date: 2018-04-06
---

*by [{{page.author}}]({{ page.href }})*

The command function invoker provides a Docker base layer for a function consisting of a single command.

It accepts gRPC requests, invokes the command for each request in the input stream,
and sends the command's output to the stream of gRPC responses.
