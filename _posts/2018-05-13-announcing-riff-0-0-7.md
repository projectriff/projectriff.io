---
layout: single
title: "Announcing riff v0.0.7"
header:
  overlay_image: /images/scott-boston-garden.jpg
excerpt:
  With Go and Python streaming invokers, and bounded gRPC calls
permalink: /blog/announcing-riff-0-0-7/
---

The 0.0.7 release of riff is now available. Thank you all who worked on this effort.

## go streaming

The [Go function invoker](https://github.com/ericbottard/go-function-invoker) now supports streaming functions.
These accept an input channel and return an output channel and an optional error channel.

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

Request/reply functions work just like before.

```go
func Foo(input X) (Y, error) {
}
```

## python streaming

The [Python 3 function invoker](https://github.com/projectriff/python3-function-invoker) now supports streaming functions.

For function modules with `interaction_model='stream'`, the invoker will pass a generator yielding each message payload.
The response should be a generator yielding the response payload.

```python
interaction_model = "stream"

def bidirectional(stream):
    return (item.upper() for item in stream)
```

For another example, see this windowing [sample](https://github.com/projectriff/python3-function-invoker/blob/master/samples/windows/windows.py).


## bounded gRPC calls 

The riff sidecar has been modified to support bounded gRPC calls. Starting with the 0.0.7 release, the CLI will generate function yaml with a default window size of 1.
```yaml
spec:
  protocol: grpc
  windowing:
    size: 1
```   
The `windowing.size` key can be used to control the window size.

Alternatively you can use `windowing.time` to configure a time in seconds. e.g.
```yaml
spec:
  protocol: grpc
  windowing:
    time: 10s
```

Windowing can be disabled entirely for streaming functions which expect unbounded streams by removing the  `windowing` key from the yaml. For now, this is also the recommended approach to handle sliding windows.