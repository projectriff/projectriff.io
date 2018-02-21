---
title: "Running riff on GKE with RBAC"
permalink: /docs/running-on-gke-with-rbac/
excerpt: "How to run **riff** with Role-Based Access Control"
header:
  overlay_image: /images/gke.png
  overlay_filter: 0.4
  overlay_color: "#555"
---


## Getting started on GKE with RBAC
The steps below extend the instructions for [getting started on GKE](../getting-started-on-gke/)
with the addition of [Kubernetes role-based access control](https://kubernetes.io/docs/admin/authorization/rbac/). Only the steps which are new or different for RBAC are included. 

### TL;DR
1. create a GKE cluster with Kubernetes v1.8+ (defaults to RBAC)
2. grant yourself cluster-admin permissions
3. start the helm server (tiller) with RBAC
4. install riff with RBAC

### create a GKE cluster with Kubernetes v1.8+
When you select a Cluster Version of 1.8+ in the console, "Legacy Authorization" will be automatically disabled, turning on RBAC.

![Disable legacy authorization to turn on RBAC](/images/rbac-on.png)

### grant yourself cluster-admin permissions
After configuring your gcloud credentials and pointing kubectl to target the GKE cluster, you will need to grant yourself
a `cluster-admin` role. Doing this, requires an admin password which you can find when you click on `Show Credentials` 
in the details page of your cluster.

![Show credentials in console](/images/show-credentials.png)

Issue the following command, replacing `*****` with the admin password.
```
kubectl --username=admin --password=***** create clusterrolebinding cluster-admin-binding --clusterrole=cluster-admin --user=$(gcloud config get-value account)
```

### start the helm server (tiller) with RBAC
Using helm with RBAC requires that the helm server run with cluster-admin privileges using a service account in the `kube-system` namespace. 

The following commands come from the Helm getting started doc in the [riff repo](https://github.com/projectriff/riff/blob/master/Getting-Started.adoc#install-helm) on GitHub.

```
kubectl -n kube-system create serviceaccount tiller
kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller
helm init --service-account=tiller
```

### install riff with RBAC
After adding the riff Helm chart repo and setting up tiller with RBAC, you should be able to isssue the following commands to install kafka and riff 0.0.4.

``` 
kubectl create namespace riff-system
helm install --name transport --namespace riff-system riffrepo/kafka
helm install riffrepo/riff --version 0.0.4 --name demo
```

To deploy other versions of riff, use helm search to list the available version numbers and also set `create.rbac=true`. 

```
helm search riff -l 
helm install riffrepo/riff  --version <x.x.x> --name demo --set create.rbac=true
```

At this point everything else should work the same as [getting started on GKE](../getting-started-on-gke/) without RBAC.

### to access the Kubernetes dashboard
Recent releases of the Kubernetes dashboard require a bearer token in order to login. The easiest way to do this, is to lookup the token associated with the `tiller` account created above and paste it into the login form.

```
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep tiller | awk '{print $1}')
```

For more details see the dashboard [wiki](https://github.com/kubernetes/dashboard/wiki/Access-control#introduction) and [issue #2474](https://github.com/kubernetes/dashboard/issues/2474).
