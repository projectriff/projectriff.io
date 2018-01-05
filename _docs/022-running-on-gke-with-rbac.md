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
The following steps will allow you to follow the instructions for [getting started on GKE](../getting-started-on-gke/)
with the addition of [Kubernetes role-based access control](https://kubernetes.io/docs/admin/authorization/rbac/). Only the steps which are new or different are included below. 

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

Issue the following command, replacing `*****` with the admin password.:
```
kubectl --username=admin --password=H4ioiWRqoIdn30nM create clusterrolebinding cluster-admin-binding --clusterrole=cluster-admin --user=jleschner@pivotal.io
```

### start the helm server (tiller) with RBAC
Using helm with RBAC requires that the helm server run with cluster-admin privileges. The following commands come from the Helm getting started doc in the [riff repo](https://github.com/projectriff/riff/blob/master/Getting-Started.adoc#install-helm) on GitHub.

```
kubectl -n kube-system create serviceaccount tiller
kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller
helm init --service-account=tiller
```

### install riff with RBAC
After adding the riff Helm chart repo and setting up tiller with RBAC, you should be able to isssue the following command.

``` 
helm install riffrepo/riff --name demo --set create.rbac=true
```

At this point everything else should work the same as [getting started on GKE](../getting-started-on-gke/) without RBAC.