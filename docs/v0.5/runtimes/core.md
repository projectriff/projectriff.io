---
id: core
title: Core Runtime
sidebar_label: Core
---

The core runtime uses stock Kubernetes resources to deploy a workload. A Deployment along with a Service are created to forward traffic to the workload.

Ingress and autoscalers are not provided.

## Install

The Core runtime is not installed with riff by default. See the [getting started guide](../getting-started.md) for how to install the prerequisits and riff Build in your Kubernetes environment.

You can then install the Core runtime using the following:

```sh
kapp deploy -n apps -a riff-core-runtime -f https://storage.googleapis.com/projectriff/charts/uncharted/0.5.0-snapshot/riff-core-runtime.yaml
```

## Create a deployer

We need a function to use for the deployer. We create a function named `square` that can be used for our deployer.

```sh
riff function create square \
  --git-repo https://github.com/projectriff-samples/node-square \
  --artifact square.js \
  --tail
```

We can now create a core deployer referencing the square function.

```sh
riff core deployer create square --function-ref square --tail
```

```
Created deployer "square"
Deployer "square" is ready
```

Deployers can also be created referencing applications and containers; new images are automatically detected and rolled out. Alternatively, a deployer created from an image needs to be manually updated to consume a new image.

After the deployer is created, you can list the deployers.

```sh
riff core deployer list
```

```
NAME     TYPE       REF      URL                                       STATUS   AGE
square   function   square   http://square.default.svc.cluster.local   Ready    75s
```

## Invoke a deployer

Since the core runtime does not provide Ingress, a connection to the cluster must be established before the function can be invoked. For production workloads, installing and configuring ingress is recommended but is outside the scope of this doc. For development, use `kubectl port-forward` to map a local port to the deployer.

### setup port forwarding

In a new terminal, run:

```sh
kubectl port-forward service/square 8080:80
```

```
Forwarding from 127.0.0.1:8080 -> 8080
Forwarding from [::1]:8080 -> 8080
```

The port forward command establishes a connection to the deployer's service on local port 8080 and runs until terminated. If port 8080 is not available, pick any open port.

> NOTE: the port forwarding needs to be reestablished when a new instance of the function is rolled out.

### call the workload

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
< Date: Wed, 15 Jan 2020 22:19:48 GMT
< Content-Length: 2
< Content-Type: text/plain; charset=utf-8
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

Delete the function when you no longer need it.

```sh
riff function delete square
```

```
Deleted function "square"
```
