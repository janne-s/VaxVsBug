# VaxVsBug

VaxVsBug is a static educational web app that compares:

- vaccination effects
- infection effects
- the effect of community vaccine rate on disease risk

It is designed to be fast, lightweight, and easy to inspect or extend.

## Screenshot

![VaxVsBug screenshot](docs/VaxVsBug_screenshot.png)

## What It Does

- compares vaccination and infection outcomes side by side
- visualizes risk with two 100-cell grids
- lets the user adjust community vaccine rate
- simulates one vaccination outcome and one infection outcome with `Try your luck`
- supports multiple diseases from a JSON dataset
- supports English and Finnish localization

## Tech Stack

- plain `HTML`
- plain `CSS`
- plain `JavaScript`
- no framework
- no build step
- no backend

## App Structure

```txt
App/
  index.html
  style.css
  app.js
  data.json
  js/
  locales/
  img/
  docs/
```

## Main Files

- [`index.html`](index.html) - app shell and static panel content
- [`style.css`](style.css) - layout, visual system, animation, responsive behavior
- [`app.js`](app.js) - app bootstrap and module wiring
- [`data.json`](data.json) - disease, vaccine, source, and probability data
- [`js/`](js) - app modules
- [`locales/`](locales) - language files
- [`docs/Environmental-Hostility.md`](docs/Environmental-Hostility.md) - calibration notes for `environmental_hostility`

## Running Locally

Because the app uses `fetch()` for JSON and locale files, run it from a local web server rather than opening the HTML file directly.

Examples:

```bash
cd App
python3 -m http.server 8000
```

Then open:

```txt
http://localhost:8000/
```

## URL Parameters

- `?lang=en`
- `?lang=fi`
- `?disease=measles`

Example:

```txt
http://localhost:8000/?lang=fi&disease=polio
```

## Data Notes

The app uses a comparative scenario model.

In particular:

- `environmental_hostility` is an app-level spread-pressure value
- it is not a direct official metric
- disease outcomes are simplified into a UI-friendly educational model

The methodology behind `environmental_hostility` is documented in:

- [`docs/Environmental-Hostility.md`](docs/Environmental-Hostility.md)

## Localization

Current languages:

- English
- Finnish

The app is structured so more languages can be added through the locale files in [`locales/`](locales).

## Contributing

Helpful contribution areas:

- language additions and copy review
- disease-by-disease data audit
- source verification
- UI polish and accessibility improvements

## License

Add your preferred license here.
