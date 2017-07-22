# Probot: OWNERS

> a GitHub Integration built with [Probot](https://github.com/probot/probot) that @mentions maintainers in Pull Requests based on contents of the [OWNERS](https://github.com/bkeepers/owners) file. It will also @mention maintainers from a WATCHERS file, based on labels added.

## Usage

1. **[Install the integration](https://github.com/integration/owners)**.
2. Create a [`OWNERS`](https://github.com/bkeepers/OWNERS) file in your repository.
3. Wait for new Pull Requests to be opened.
4. Optionally, add a `WATCHERS` file in your repository, which imitates the structure of an OWNERS file but with labels instead of files, example:

```
# tags @hiimbex when a pull_request is labeled frontend, duplicate or bug
@hiimbex frontend duplicate bug 

#tags @bkeppers when a pull_request is labeled help-wanted or api
@bkeepers help-wanted api
```

You will only ever be mentioned once in a pull request thread by a bot.

See [docs/deploy.md](docs/deploy.md) if you would like to run your own instance of this plugin.
