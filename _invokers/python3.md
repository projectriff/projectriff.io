---
name: python3
title: "Python3 Invoker"
author: projectriff
href: https://github.com/projectriff/python3-function-invoker
development:
  href: https://github.com/projectriff/python3-function-invoker/raw/master/python3-invoker.yaml
# releases:
# - version: v0.0.6
#   href: https://github.com/projectriff/python3-function-invoker/raw/v0.0.6/python3-invoker.yaml
#   date: 2000-01-01
---

*by [{{page.author}}]({{ page.href }})*

The Python 3 function invoker, as the name implies, supports functions written in Python 3.  The invoker supports function arguments of type `str` or `dict`, determined by the message's `Content-Type` header.
For messages containing `Content-Type:application/json`, the bytes payload is converted to a dict. Reflection is used to convert the return value. Currently only UTF-8 encoding is supported.

Supported Python Version: 3.6.x
