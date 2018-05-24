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
- version: v0.0.3
  href: https://github.com/projectriff/go-function-invoker/raw/v0.0.3/go-invoker.yaml
  date: '2018-05-24'
---

*by [{{page.author}}]({{ page.href }})*

The go function invoker provides a Docker base layer for a function built as a [Go plugin](https://golang.org/pkg/plugin/).
It accepts gRPC requests, invokes the command for each request in the input stream,
and sends the command's output to the stream of gRPC responses.

## Writing go functions
The go function invoker supports both "streaming" and "direct" (traditional request/reply style) functions.
Internally, the latter are converted to the streaming model, so let's start with streaming functions:

### Writing a streaming function
If the exposed function accepts a receiving channel as its sole parameter
and returns a receiving channel as its first return value, then the function
is considered to be "streaming":

```go
func Foo(input <-chan X) <-chan Y {
}
```

where `X` and `Y` can be anything that can be (un)marshalled via content negotiation.


Additionally, the function can return a second, receiving channel of type `error` to signal errors.
The function invocation will abort if any error is received (meaning only the first error is
ever going to be considered):

```go
func Foo(input <-chan X) (output <-chan Y, errs <-chan error) {
}
```
This is more or less the canonical form of functions described in [Pipelines and cancellation](https://blog.golang.org/pipelines).
Note that the "cancellation" part doesn't apply here (and hence functions don't get passed a closeable channel
to exit early) because there is only ever one function in riff. Cancellation
is signaled by closure of the _input_ channel.

The general contract of supported functions is the following:
* the function **must** have the signature(s) described above
* the function **must** return "immediately". Actual processing of data is
to be handled in a new goroutine
* the function is responsible for **creating** the result _output_ (as well as
the optional `error` channel)
* the function is responsible for **closing** the result and error channel(s)
* closure of the _input_ channel signals the end of input data.
* the goroutine should return after having written to the error channel

Given all of the above, the typical form of a streaming function is going to be this:
```go
func Foo(input <-chan X) (<-chan Y, <-chan error) {
  out := make(chan Y)
  errs := make(chan error)

  go func() {
    defer close(out)
    defer close(errs)
    for in := range input {
      ...
    }
  }()

  return out, errs
}
```

### Writing a "regular" function
If the exposed function doesn't accept/return channels, then it is considered
a "regular" request reply and will be wrapped inside an at-most-one streaming
function.

The typical form of a "regular" function is going to be
```go
func Foo(input X) Y {
}
```

where `X` and `Y` can be anything that can be (un)marshalled via content negotiation.

An optional second return value of type `error` is supported:
```go
func Foo(input X) (Y, error) {
}
```

In addition to those two common forms, the function can also elect to not
require input ("supplier" style), or to not return a value ("consumer" style).
Combined with the optional `error` second/last return value, this is eight possible
supported forms (not all of them make sense for real-world applications.)
