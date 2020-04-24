---
id: knative
title: Knative Runtime
sidebar_label: Knative
---

The knative runtime uses the [Knative](https://knative.dev) project to deploy HTTP triggered workloads that are scaled from zero-to-N.

## Install

The knative runtime is not required to be installed with riff. The [riff getting started guide](../getting-started.md) does have instructions for installing the knative runtime for each environment.

If the cluster supports LoadBalancer services, it is recommended to [setup a custom domain](https://knative.dev/docs/serving/using-a-custom-domain/).

## Deployers

### create a deployer

Assuming a function named `square` is available, create a knative deployer referencing the square function.

```terminal
riff knative deployer create square --function-ref square --ingress-policy External --tail
```

```
Created deployer "square"
Deployer "square" is ready
```

Deployers can also be created referencing applications and containers; new images are automatically detected and rolled out. Alternatively, a deployer created from an image needs to be manually updated to consume a new image.

After the deployer is created, get the service by listing deployers.

```sh
riff knative deployer list
```

```
NAME     TYPE       REF      URL                                 STATUS   AGE
square   function   square   http://square.default.example.com   Ready    57s
```

### call the workload

How to invoke the function depends on the type of cluster and how it was configured. After getting the host set it as `HOST` and then pick the `INGRESS` definition that is appropriate for the cluster.

```sh
# from URL shown with `riff knative deployer list`
HOST=square.default.example.com

# for clusters with a custom domain
INGRESS=$HOST

# for clusters with LoadBalancer services (like GKE)
INGRESS=$(kubectl get svc -n contour-external envoy -ojsonpath='{.status.loadBalancer.ingress[0].ip}')

# for Minikube
INGRESS=$(minikube ip):$(kubectl get svc -n contour-external envoy -ojsonpath='{.spec.ports[?(@.port==80)].nodePort}')

# for Docker Desktop
INGRESS=localhost:$(kubectl get svc -n contour-external envoy -ojsonpath='{.spec.ports[?(@.port==80)].nodePort}')

# for kind
INGRESS=localhost
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

### cleanup

Delete the deployer when done with the function. While Knative will automatically scale the workload to zero after a period of inactivity, it's still a good idea to cleanup resources when no longer needed.

```sh
riff knative deployer delete square
```

```
Deleted deployer "square"
```

## Adapters

Adapters bridge a riff build into an existing Knative Service or Configuration. This is handy when it is desirable to manage additional configuration that is not exposed by the Deployer resource, like routing to a specific revision.

The adapter updates the target resource with the most recent image as new images become available. Knative Serving creates new Revisions for each new image and routes traffic to that revision based the existing routing rules. The adapter will not modify the routing rules preserving any pinned revisions.
