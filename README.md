## projectriff.io
This site is using Jekyll and Github Pages for hosting, and CloudFlare for HTTPS.

To make changes, please submit a pull request. Merged changes will automatically trigger a rebuild of the site.

- Docs live under `_docs`.
- Blog posts live under `_posts`.
- Invokers live under `_invokers`.
- Other pages like the home page live under `_pages`

### to build and preview the site locally

- make sure you have ruby v2.3 or better and bundler
```sh
ruby --version
```

- on MacOS you can get [rbenv](http://rbenv.org/) to manage your ruby versions.
```sh
brew install rbenv
eval "$(rbenv init -)"  # put this line in your .bash_profile
rbenv install 2.5.3
rbenv global 2.5.3
gem install bundler
rbenv rehash
```

- after cloning this repo, cd to this directory and run:
```sh
bundle install
bundle exec jekyll serve
```
