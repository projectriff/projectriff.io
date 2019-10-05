---
id: knative
title: Knative Runtime
sidebar_label: Knative
---

The knative runtime uses the [Knative](https://knative.dev) project to deploy HTTP triggered workloads that are scaled from zero-to-N.

## Install

The knative runtime is not installed with riff by default. See the platform [getting started guide](../getting-started.md) for how to install the knative runtime.

> NOTE: It is currently impossible to install both the knative and the streaming runtimes.

If the cluster supports LoadBalancer services, it is recommended to [setup a custom domain](https://knative.dev/docs/serving/using-a-custom-domain/).

## Deployers

### create a deployer

Assuming a function named `square` is available, create a knative deployer referencing the square function.

```terminal
riff knative deployer create square --function-ref square --tail
```

```
Created deployer "square"
default/square-726cg-deployment-5f66bbf458-tzpmg[user-container]: /usr/local/bin/jq
default/square-726cg-deployment-5f66bbf458-tzpmg[user-container]: Node started in 151ms
default/square-726cg-deployment-5f66bbf458-tzpmg[user-container]: Server starting with request-reply interaction model and payload argument type
default/square-726cg-deployment-5f66bbf458-tzpmg[user-container]: HTTP loaded in 89ms
default/square-726cg-deployment-5f66bbf458-tzpmg[user-container]: HTTP running on localhost:8080
default/square-726cg-deployment-5f66bbf458-tzpmg[user-container]: Function invoker started in 248ms
```

Deployers can also be created referencing applications and containers; new images are automatically detected and rolled out. Alternatively, a deployer created from an image needs to be manually updated to consume a new image.

After the deployer is created, get the service by listing deployers.

```sh
riff knative deployer list
```

```
NAME     TYPE       REF      HOST                         STATUS   AGE
square   function   square   square.default.example.com   Ready    11s
```

### call the workload

How to invoke the function depends on the type of cluster and how it was configured. After getting the host set it as `HOST` and then pick the `INGRESS` definition that is appropriate for the cluster.

```sh
# from `riff knative deployer list`
HOST=square.default.example.com

# for clusters with a custom domain
INGRESS=$HOST

# for clusters with LoadBalancer services (like GKE)
INGRESS=$(kubectl get svc -n istio-system istio-ingressgateway -ojsonpath='{.status.loadBalancer.ingress[0].ip}')

# for clusters with NodePort services (like Minikube and Docker Desktop)
INGRESS=$(kubectl get nodes -ojsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}'):$(kubectl get svc -n istio-system istio-ingressgateway -ojsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
```

The value of `INGRESS` will be constant for the life of the cluster. Change the `HOST` value to match the deployer being targeted.

#### make the request

```sh
curl $INGRESS -v -w '\n' -H "Host: $HOST" \
  -H 'Content-Type: application/json' \
  -d 7
```

```
* Rebuilt URL to: 35.184.153.67/
*   Trying 35.184.153.67...
* TCP_NODELAY set
* Connected to 35.184.153.67 (35.184.153.67) port 80 (#0)
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
< date: Mon, 19 Aug 2019 19:03:26 GMT
< x-powered-by: Express
< x-envoy-upstream-service-time: 7968
< server: istio-envoy
< 
* Connection #0 to host 35.184.153.67 left intact
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
