# Pocket Datasource for Grafana

[![CircleCI](https://circleci.com/gh/davkal/pocket-datasource/tree/master.svg?style=svg)](https://circleci.com/gh/davkal/pocket-datasource/tree/master)

Show graphs about your [Pocket](https://getpocket.com/) usage.

![Screenshot](src/img/pocket-screenshot.png?raw=true)

## Queries

- Cumulative item counts (unread and archived)
- Daily adds
- Daily reads

## Authentication with Pocket

This datasource plugin uses [Pocket's OAuth API](https://getpocket.com/developer/docs/authentication) to authenticate you. The plugin will never see your Pocket password. Instead it receives an access token after successfully authenticating. This access token is then used to retrieve your list of Pocket items.

## Implementation

This plugin does not require a timeseries database.
Instead it retrieves all articles once and caches them for an hour.
All interactions like query type or changing time range are performed on the cached result.
This is to ensure a quick interaction while respecting [Pocket's API rate limits](https://getpocket.com/developer/docs/rate-limits).

## Contributing

Feel free to open issues first.
PRs are welcome.
Try to come up with more stats that can be calculated from the retrieved list.

## Releasing

This plugin uses [release-it](https://github.com/webpro/release-it) to release to GitHub.

```
env GITHUB_TOKEN=your_token yarn release-it patch
```
