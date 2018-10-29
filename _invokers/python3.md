---
name: python3
title: "Python 3 Invoker"
author: projectriff
href: https://github.com/projectriff/python3-function-invoker
deprecated: true
---

*by [{{page.author}}]({{ page.href }})*

The Python 3 function invoker, as the name implies, supports functions written in Python 3.  The invoker supports function arguments of type `str` or `dict`, determined by the message's `Content-Type` header.
For messages containing `Content-Type:application/json`, the bytes payload is converted to a dict. Reflection is used to convert the return value. Currently only UTF-8 encoding is supported.

Supported Python Version: 3.6.x
