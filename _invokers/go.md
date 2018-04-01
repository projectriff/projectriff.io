---
name: go
title: "Go Function Invoker"
author: projectriff
href: https://github.com/projectriff/go-function-invoker
development:
  href: https://github.com/projectriff/go-function-invoker/raw/master/go-invoker.yaml
releases: [
  # - version: v0.0.6
  #   href: https://github.com/projectriff/go-function-invoker/raw/v0.0.2/go-invoker.yaml
  #   date: 2000-01-01
]
---

The go function invoker provides a Docker base layer for a function built as a [Go plugin](https://golang.org/pkg/plugin/).
It accepts gRPC requests, invokes the command for each request in the input stream,
and sends the command's output to the stream of gRPC responses.

## Install as a riff invoker

```bash
riff invokers apply -f https://github.com/projectriff/go-function-invoker/raw/master/go-invoker.yaml
```

## riff Commands

- [riff init go](#riff-init-go)
- [riff create go](#riff-create-go)

<!-- riff-init -->

### riff init go

Initialize a go function

#### Synopsis

Generate the function based on a shared '.so' library file specified as the filename
and exported symbol name specified as the handler.

For example, type:

    riff init go -i words -l go -n rot13 --handler=Encode

to generate the resource definitions using sensible defaults.


```
riff init go [flags]
```

#### Options

```
      --handler string           the name of the function handler (name of Exported go function) (default "{{ .TitleCase .FunctionName }}")
  -h, --help                     help for go
      --invoker-version string   the version of invoker to use when building containers (default "0.0.2-snapshot")
```

#### Options inherited from parent commands

```
  -a, --artifact string      path to the function artifact, source code or jar file
      --config string        config file (default is $HOME/.riff.yaml)
      --dry-run              print generated function artifacts content to stdout only
  -f, --filepath string      path or directory used for the function resources (defaults to the current directory)
      --force                overwrite existing functions artifacts
  -i, --input string         the name of the input topic (defaults to function name)
  -n, --name string          the name of the function (defaults to the name of the current directory)
  -o, --output string        the name of the output topic (optional)
  -u, --useraccount string   the Docker user account to be used for the image repository (default "current OS user")
  -v, --version string       the version of the function image (default "0.0.1")
```

#### SEE ALSO

* [riff init](https://github.com/projectriff/riff/blob/master/riff-cli/docs/riff_init.md)	 - Initialize a function


<!-- /riff-init -->

<!-- riff-create -->

### riff create go

Create a go function

#### Synopsis

Create the function based on a shared '.so' library file specified as the filename
and exported symbol name specified as the handler.

For example, type:

    riff create go -i words -l go -n rot13 --handler=Encode

to create the resource definitions, and apply the resources, using sensible defaults.


```
riff create go [flags]
```

#### Options

```
      --handler string           the name of the function handler (name of Exported go function) (default "{{ .TitleCase .FunctionName }}")
  -h, --help                     help for go
      --invoker-version string   the version of invoker to use when building containers (default "0.0.2-snapshot")
      --namespace string         the namespace used for the deployed resources (defaults to kubectl's default)
      --push                     push the image to Docker registry
```

#### Options inherited from parent commands

```
  -a, --artifact string      path to the function artifact, source code or jar file
      --config string        config file (default is $HOME/.riff.yaml)
      --dry-run              print generated function artifacts content to stdout only
  -f, --filepath string      path or directory used for the function resources (defaults to the current directory)
      --force                overwrite existing functions artifacts
  -i, --input string         the name of the input topic (defaults to function name)
  -n, --name string          the name of the function (defaults to the name of the current directory)
  -o, --output string        the name of the output topic (optional)
  -u, --useraccount string   the Docker user account to be used for the image repository (default "current OS user")
  -v, --version string       the version of the function image (default "0.0.1")
```

#### SEE ALSO

* [riff create](https://github.com/projectriff/riff/blob/master/riff-cli/docs/riff_create.md)	 - Create a function (equivalent to init, build, apply)


<!-- /riff-create -->
