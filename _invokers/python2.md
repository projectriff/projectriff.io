---
name: python2
title: "Python2 Function Invoker"
author: projectriff
href: https://github.com/projectriff/python2-function-invoker
development:
  href: https://github.com/projectriff/python2-function-invoker/raw/master/python2-invoker.yaml
releases: [
  # - version: v0.0.6
  #   href: https://github.com/projectriff/python2-function-invoker/raw/v0.0.6/python2-invoker.yaml
  #   date: 2000-01-01
]
---

The Python 2 function invoker, as the name implies, supports functions written in Python 2.  The invoker supports function arguments of type `str` or `dict`, determined by the message's `Content-Type` header.
For messages containing `Content-Type:application/json`, the bytes payload is converted to a dict. Reflection is used to convert the return value. Currently only UTF-8 encoding is supported.

Supported Python Version: 2.7.x

## Install as a riff invoker

```bash
riff invokers apply -f https://github.com/projectriff/python2-function-invoker/raw/master/python2-invoker.yaml
```

