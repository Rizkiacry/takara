# Takaradex a3 display

A Tampermonkey userscript that makes cards on [Takara Cards](https://takara-cards.me)
**look** like a3 in your own browser.

It is **display only**: it edits the page in your browser and never sends anything to
the server. Real levels are unchanged and a reload without the script shows them again.

## Install

1. Install Tampermonkey.
2. Dashboard -> Utilities -> Import, choose `takaradex-a3-display.user.js`
   (or create a new script and paste the file contents).
3. Reload the site.

## Use

- `Alt+Shift+A` switches between the a3 display and the real levels.
  Check real levels before bidding or accepting a trade.
- Put card names in `EXCLUDE` at the top of the script to keep their real level.
