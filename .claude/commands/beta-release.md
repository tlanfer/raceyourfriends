Create a new beta release.

## Context

Current git status:

```!bash
git status --short
```

Latest beta tag:

```!bash
git tag --list 'v*-beta*' --sort=-v:refname | head -1
```

## Steps

1. If there are uncommitted changes, stop and ask the user whether to commit them first.
2. Determine the next beta number by incrementing the latest beta tag (e.g. `v1.0.0-beta.4` -> `v1.0.0-beta.5`). If there are no beta tags yet, ask the user what version to use.
3. Confirm the tag name with the user before proceeding.
4. Push any unpushed commits to `origin/main`: `git push`
5. Create and push the tag: `git tag <tag> && git push origin <tag>`
6. Report that the tag has been pushed and explain what happens next:
   - The **iOS TestFlight** workflow triggers automatically on `v*-beta*` tags. Internal testers get access once processing completes (~5-30 min).
   - The **Android** workflow currently requires manual dispatch from the Actions tab.
   - The **Docker server** image is built on every push to main (not tied to tags).
