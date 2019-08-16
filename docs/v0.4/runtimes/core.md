---
id: core
title: Core Runtime
sidebar_label: Core
---

The core runtime uses stock Kubernetes resources to deploy a workload. A Deployment along with a Service are created to forward traffic to the workload.

Ingress and autoscalers are not provided.

## Install

The core runtime is installed with riff by default. No further action is required.

## Create a deployer

Assuming a function named `square` is available, create a core deployer referencing the square function.

```sh
riff core deployer create square --function-ref square --tail
```

```
Created deployer "square"
default/square-deployer-6f6cb6d6f5-dhknt[handler]: /usr/local/bin/jq
default/square-deployer-6f6cb6d6f5-dhknt[handler]: Node started in 130ms
default/square-deployer-6f6cb6d6f5-dhknt[handler]: Server starting with request-reply interaction model and payload argument type
default/square-deployer-6f6cb6d6f5-dhknt[handler]: HTTP loaded in 86ms
default/square-deployer-6f6cb6d6f5-dhknt[handler]: HTTP running on localhost:8080
default/square-deployer-6f6cb6d6f5-dhknt[handler]: Function invoker started in 223ms
```

Deployers can also be created referencing applications and containers; new images are automatically detected and rolled out. Alternatively, a deployer created from an image needs to be manually updated to consume a new image.

After the deployer is created, get the service by listing deployers.

```sh
riff core deployer list
```

```
NAME     TYPE       REF      SERVICE           STATUS   AGE
square   function   square   square-deployer   Ready    10s
```

## Invoke a deployer

Since the core runtime does not provide Ingress, a connection to the cluster must be established before the function can be invoked. For production workloads, installing and configuring ingress is recommended but is outside the scope of this doc. For development, use `kubectl port-forward` to map a local port to the deployer.

### Setup port forwarding

From the deployer listing (`riff core deployer list`), get the service name for the function, in this case `square-deployer`. In a new terminal, run:

```sh
kubectl port-forward service/square-deployer 8080:80
```

```
Forwarding from 127.0.0.1:8080 -> 8080
Forwarding from [::1]:8080 -> 8080
```

The port forward command establishes a connection to the deployer's service on local port 8080 and runs until terminated. If port 8080 is not available, pick any open port.

> NOTE: the port forwarding needs to be reestablished when a new instance of the function is rolled out.

### Call the function

```sh
curl localhost:8080 -v -w '\n' -H 'Content-Type: application/json' -d 7
```

```
* Rebuilt URL to: localhost:8080/
*   Trying ::1...
* TCP_NODELAY set
* Connected to localhost (::1) port 8080 (#0)
> POST / HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/7.54.0
> Accept: */*
> Content-Type: application/json
> Content-Length: 1
> 
* upload completely sent off: 1 out of 1 bytes
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Content-Type: text/plain; charset=utf-8
< Date: Fri, 16 Aug 2019 17:01:09 GMT
< Connection: keep-alive
< Content-Length: 2
< 
* Connection #0 to host localhost left intact
49
```

When done invoking the deployer, terminate the port-forward tunnel.

## Cleanup

Delete the deployer when done with the function. Since the core runtime does not scale-to-zero, the workload will continue running until deleted.

```sh
riff core deployer delete square
```

```
Deleted deployer "square"
```
