---
layout: single
title: "Announcing riff v0.0.6"
header:
  overlay_image: /images/boathouse.jpg
excerpt:
  Installable invokers, resource yaml API version change!
permalink: /blog/announcing-riff-0-0-6/
---

The 0.0.6 release of riff is now available. A big thank you, once again, to everyone
who contributed on this effort.

## riff installation

We recommend [installing](/docs/) riff v0.0.6 on a fresh Kubernetes cluster. The latest Helm chart has an option to deploy riff together with Kafka. If you played with previous riff releases, remember to install the [latest riff CLI](https://github.com/projectriff/riff/releases) as well.

## api Version change
If you have existing functions and topics, and prefer not to regenerate the yaml for these using the latest CLI, you will need to set the `apiVersion` in the yaml to `projectriff.io/v1alpha1`. E.g.

```yaml
---
apiVersion: projectriff.io/v1alpha1
kind: Function
metadata:
  name: square
spec:
  container:
    image: projectriff/square:0.0.2
  input: numbers
  protocol: grpc
```

Dockerfiles should not require any changes for this release.


## installable invokers
Starting in v0.0.6, riff [invokers](/invokers/) are installable Kubernetes resources. The yaml file for an invoker can come from a file on disk or from a URL. This allows users to add new invokers without changes to the CLI. The riff CLI has been extended with `riff invokers` sub-commands. 

```
$ riff invokers --help
Manage invokers in the cluster

Usage:
  riff invokers [command]

Available Commands:
  apply       Install or update an invoker in the cluster
  delete      Remove an invoker from the cluster
  list        List invokers in the cluster

Flags:
  -h, --help   help for invokers

Global Flags:
      --config string   config file (default is $HOME/.riff.yaml)

Use "riff invokers [command] --help" for more information about a command.
```

To install the latest available invokers, run the following CLI commands or refer to the [invoker docs](/invokers/).

```bash
riff invokers apply -f https://github.com/projectriff/command-function-invoker/raw/v0.0.6/command-invoker.yaml
riff invokers apply -f https://github.com/projectriff/go-function-invoker/raw/v0.0.6/go-invoker.yaml
riff invokers apply -f https://github.com/projectriff/java-function-invoker/raw/v0.0.6/java-invoker.yaml
riff invokers apply -f https://github.com/projectriff/node-function-invoker/raw/v0.0.6/node-invoker.yaml
riff invokers apply -f https://github.com/projectriff/python2-function-invoker/raw/v0.0.6/python2-invoker.yaml
riff invokers apply -f https://github.com/projectriff/python3-function-invoker/raw/v0.0.6/python3-invoker.yaml
```

This invoker separation is also the first step toward future enhancements such as invoker-specific configuration, validation, and, dynamic loading of functions into pre-warmed invoker containers. 


## node function invoker access to header and payload with Message type

## improved error handling on the http-gateway
We’ve updated the http-gateway to validate the existence of riff topics before sending messages (as distinct from Kafka topics). You will now see 404s if you try to send a message or request which refers to an unknown topic:

```
$ riff publish --input nosuchrifftopic --data "404 From Message"
Posting to http://192.168.39.148:32508/messages/nosuchrifftopic
could not find Riff topic 'nosuchrifftopic'

riff publish --input nosuchrifftopic --data "404 From Request" --reply
Posting to http://192.168.39.148:32508/requests/nosuchrifftopic
could not find Riff topic 'nosuchrifftopic'
```

## foundations for a new autoscaler

Prior to v0.0.6, the function-controller scaled up the number of replicas of a function pod in response to changes in producer and consumer offsets in the input topic. The 0.0.6 autoscaler reproduces this behaviour but, instead of using offsets, uses the queue length together with production and consumption metrics from the topic. This is a step towards enabling riff to support message brokers other than Kafka. We also factored out the autoscaler subcomponent in the code, and introduced a workload simulator to measure the autoscaler behaviour as a baseline for future improvements.

The simulations below show three busy periods separated by periods of inactivity:
1. writes increase and then decrease in a step function
2. writes vary like a sine wave
3. writes ramp up and down linearly.

The graphs show writes in black, queue length in light blue, and the number of replicas in red. Although the number of replicas would normally be limited by the number of partitions or by user configuration, the simulator does not apply a limit so that the autoscaler behaviour is easy to see.

The first graph shows what the behaviour would be if replicas started up instantaneously. The queue length stays under control and the number of instances is fairly small at all times. However, there is high frequency “noise” in the number of replicas, so the smoothing needs improving.

![graph with instant startup](/images/graph1.png)

The second graph shows a more realistic scenario in which each replica takes a while to start up. When there is a sudden increase in workload, the queue length builds dramatically while replicas are starting, and the autoscaler over-reacts - another area for improvement.

![graph with slower startup](/images/graph2.png)
 