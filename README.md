## Remnawave Backend

Backend for Remnawave Panel.

Learn more about Remnawave Panel [here](https://docs.rw/).

## Opt-in XHTTP subscriptions for Stash

Stash documents VLESS/XHTTP support starting with iOS/tvOS 3.6 and macOS 4.3.
For a STASH template assigned only to compatible clients, opt in with:

```yaml
remnawave:
  allowStashXhttp: true
```

The default remains `false`, preserving subscriptions for older clients. This is
an administrator-controlled capability setting, not automatic User-Agent version
detection. Subscription exclusions and account access are unchanged. Stash now
passes eligible hidden hosts to the generator, like Mihomo, so the existing
`includeHiddenHosts` setting can be honored; hidden hosts remain excluded by default.
Only expose protocol-specific groups when eligible hosts exist; an empty Stash
group can fall back to DIRECT. Internal template controls are removed from output.
XHTTP TLS server names use Stash's `sni`, including separate download settings.
An explicit `sni` from Host Mapper takes precedence over `servername`.

Generator regression tests: `node --test test/stash-xhttp.test.cjs`.

# Contributors

We ❤️‍🔥 contributors! If you'd like to contribute, please check out our [Contributing Guidelines](CONTRIBUTING.md) and feel free to submit a pull request or open an issue.

Check [open issues](https://github.com/remnawave/panel/issues) to help the progress of this project.

<p align="center">
Thanks to the all contributors who have helped improve Remnawave:
</p>
<p align="center">
<a href="https://github.com/remnawave/backend/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=remnawave/backend" />
</a>
</p>
