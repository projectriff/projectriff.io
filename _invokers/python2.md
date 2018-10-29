---
name: python2
title: "Python 2 Invoker"
author: projectriff
href: https://github.com/projectriff/python2-function-invoker
deprecated:
  replacedBy: python3
---

*by [{{page.author}}]({{ page.href }})*

The Python 2 function invoker, as the name implies, supports functions written in Python 2.  The invoker supports function arguments of type `str` or `dict`, determined by the message's `Content-Type` header.
For messages containing `Content-Type:application/json`, the bytes payload is converted to a dict. Reflection is used to convert the return value. Currently only UTF-8 encoding is supported.

Supported Python Version: 2.7.x
