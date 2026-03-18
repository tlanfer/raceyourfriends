Create a new release candidate (RC) release.

## Context

Current git status:

```!bash
git status --short
```

Latest RC tag:

```!bash
git tag --list 'v*-rc*' --sort=-v:refname | head -1
```

## Steps

1. If there are uncommitted changes, stop and ask the user whether to commit them first.
2. Determine the next RC number by incrementing the latest RC tag (e.g. `v1.0.0-rc.2` -> `v1.0.0-rc.3`). If there are no rc tags yet, ask the user what version to use.
3. Confirm the tag name with the user before proceeding.
4. Push any unpushed commits to `origin/main`: `git push`
5. Create and push the tag: `git tag <tag> && git push origin <tag>`
6. Report that the tag has been pushed and explain what happens next:
   - The **iOS TestFlight** workflow triggers automatically on `v*-rc*` tags. RC builds require **manual submission for External Beta Review** in App Store Connect:
     1. Go to App Store Connect -> TestFlight
     2. Wait for the build to finish processing (~5-30 min)
     3. Select the build under the external testing group
     4. Click "Submit for Review"
   - The **Android** workflow currently requires manual dispatch from the Actions tab.
   - The **Docker server** image is built on every push to main (not tied to tags).
