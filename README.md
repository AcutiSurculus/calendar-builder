# Calendar Layout Builder

Open `index.html` in a browser (double-click works, no server or build step).

```
index.html            page markup, loads everything below
assets/
  dmc-logo-light.png  black-text company logo for light mode
  dmc-logo.png        alternate company logo for dark mode
css/
  base.css            colors, page layout, side panel, form controls
  workspace.css       paper preview, margin guides, resize handle
  calendar.css        the calendar block that gets exported
js/  (loaded in this order)
  config.js           month/day names, defaults
  state.js            shared state `S`, `$()` helper
  workspace.js        paper size math, zoom, placing the block
  calendar.js         builds title, weekday bar, date grid
  interaction.js      drag, arrow keys, resize from any corner, holiday click
  controls.js         side panel inputs, template image, and buttons
  export.js           PNG export at exact paper size and dpi, including all-month ZIPs
  main.js             render() and first paint
```

Where to change things:
- New paper size: `dims()` in `js/workspace.js`, plus an `<option>` in `index.html`.
- New font: add it to the Google Fonts link and the font `<select>` in `index.html`.
- New setting: add a default in `js/config.js`, an input with the same id in `index.html`, then use `S.yourKey` in `js/calendar.js` or `js/workspace.js`. Inputs are wired automatically by id.
- Paper dimensions, positioning, calendar width, date-box height, gaps, corner radius, and border width are stored in millimeters. Right-click an individual measurement to choose its display/input unit (mm, cm, inches, feet, or CSS pixels at 96 px per inch); changing one measurement's unit does not affect the others. Right-click the paper preview to change the displayed paper dimensions' unit.
- Numeric fields are the default for slider-adjustable settings, including width, date-box height, gaps, margins, and font sizes. Use Show optional sliders to reveal sliders alongside the fields. Use Load installed fonts to request the browser's local-font access where supported.
- The page theme follows the company logo's red, blue, and yellow colors; calendar defaults use black dates and red titles, weekday bars, holidays, and borders.
- Open the Quick Guide with the How to use button for a popup tutorial covering the workspace, controls, keyboard shortcuts, and export options.
- Weekday labels have their own font-size and bar corner-radius controls, independent of the month/year title and date-box shape.
- Calendar corner handles resize proportionally by default; hold Shift to resize width and height independently or Alt to scale from the center. Midpoint handles on each edge resize only that axis while anchoring the opposite edge. Ctrl/Cmd+Z undoes and Ctrl/Cmd+Y redoes layout changes.
- Use the Light mode / Dark mode button to switch the interface theme; the choice is saved in browser storage, with a matching logo for each mode.
- On a fresh visit, the calendar is centered on the paper. Layout settings, holidays, measurement units, export options, and any uploaded template image are automatically saved in this browser on this device.
- The supplied DMC logo is used as the website favicon.
- Export can download the selected month as a PNG or all 12 months as a ZIP; the export title checkbox controls whether each image includes its month and year.
- Upload an image in the Template image section to preview it across the full paper behind the calendar; uploaded images are included in PNG and ZIP exports. Use Remove template image to clear it.
- Needs internet for html2canvas (cdnjs) and Google Fonts.
