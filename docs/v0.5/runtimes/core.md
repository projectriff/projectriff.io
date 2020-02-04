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
kapp deploy -n apps -a riff-core-runtime -f https://storage.googleapis.com/projectriff/release/0.5.0-snapshot/riff-core-runtime.yaml
```

## Deployers

### create a deployer

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

### call the workload

How to invoke the function depends on the type of cluster and how it was configured. After getting the host set it as `HOST` and then pick the `INGRESS` definition that is appropriate for the cluster.

```sh
# from URL shown with `riff knative deployer list`
HOST=square.default.example.com

# for clusters with a custom domain
INGRESS=$HOST

# for clusters with LoadBalancer services (like GKE)
INGRESS=$(kubectl get svc -n projectcontour envoy-external -ojsonpath='{.status.loadBalancer.ingress[0].ip}')

# for clusters with NodePort services (like Minikube and Docker Desktop)
INGRESS=$(kubectl get nodes -ojsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}'):$(kubectl get svc -n projectcontour envoy-external -ojsonpath='{.spec.ports[?(@.port==80)].nodePort}')
```

The value of `INGRESS` will be constant for the life of the cluster. Change the `HOST` value to match the deployer being targeted.

#### make the request

```sh
curl $INGRESS -v -w '\n' -H "Host: $HOST" \
  -H 'Content-Type: application/json' \
  -d 7
```

```
* Rebuilt URL to: 192.168.64.3:32697/
*   Trying 192.168.64.3...
* TCP_NODELAY set
* Connected to 192.168.64.3 (192.168.64.3) port 32697 (#0)
> POST / HTTP/1.1
> Host: square.default.example.com
> User-Agent: curl/7.54.0
> Accept: */*
> Content-Type: application/json
> Content-Length: 1
> 
* upload completely sent off: 1 out of 1 bytes
< HTTP/1.1 200 OK
< content-length: 2
< content-type: text/plain; charset=utf-8
< date: Tue, 04 Feb 2020 17:53:48 GMT
< x-envoy-upstream-service-time: 2957
< server: envoy
< 
* Connection #0 to host 192.168.64.3 left intact
49
```

When done invoking the deployer, terminate the port-forward tunnel.

### cleanup

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
