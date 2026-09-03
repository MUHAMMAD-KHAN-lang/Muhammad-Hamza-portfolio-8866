# Documents

Place the CV PDF in this folder using **exactly** this filename:

```
Muhammad_Hamza_CV.pdf
```

Every "Download CV" button on the site points at
`assets/documents/Muhammad_Hamza_CV.pdf`, which is defined once in
`js/config.js` as `cvPath`.

## Updating the CV

Replace the file with a new version of the same name and push. Nothing else
needs to change — no HTML edit, no configuration change.

Until the file exists, the Download CV buttons stay visible but explain that the
PDF has not been uploaded yet, rather than producing a broken download.

## Using a different filename

Change `cvPath` in `js/config.js`. That is the only place the path appears.
