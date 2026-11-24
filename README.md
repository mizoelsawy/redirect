# app-link.js

Open the app if it's installed, otherwise send people to the right store.

`app-link.js` is a single dependency-free script for "Download the app" links. It detects iOS, Android or desktop, tries to open your app, and falls back to the App Store or Google Play when the app isn't there. It works anywhere you can add a `<script>` tag: plain HTML, WordPress, Webflow, React.

This repo also contains `index.html`, a ready-made landing page built on the script, served with GitHub Pages at <https://mizoelsawy.github.io/redirect/>. Add `?auto=0` to view the page without being redirected.

## Usage

```html
<a href="#" data-app-link>Download the app</a>
<script src="app-link.js"></script>
```

Every element with `data-app-link` is wired up on load. You can also trigger it yourself:

```js
AppLink.open();
```

## Configuration

Edit the `CONFIG` block at the top of `app-link.js`:

| Option | What it does |
| --- | --- |
| `androidPackage` | Android package name, from your Play Store URL. |
| `androidStore` | Google Play fallback URL. |
| `iosStore` | App Store fallback URL. |
| `universalLink` | A Universal Link / App Link on your domain (needs `apple-app-site-association` and `assetlinks.json`). Used first when set. |
| `scheme` | Your app's custom URL scheme, without `://`. Leave empty if the app has none. |
| `path` | Optional screen to open inside the app, such as `offers/12`. |
| `desktop` | `"stay"` leaves desktop visitors on the page, or set a URL to send them there. |
| `timeout` | Milliseconds to wait for the app to take over before going to the store (default `1500`). |

## How it decides

`AppLink.resolve()` picks one strategy per visit, and `AppLink.open()` follows it:

| Strategy | When | What happens |
| --- | --- | --- |
| `in-app-browser` | Opened inside Instagram, Facebook, TikTok, LinkedIn and similar apps | Goes straight to the store, because these browsers block deep links. |
| `universal-link` | `universalLink` is set | Opens the link; the OS opens the app or loads the web page. |
| `intent` | Android | Uses an `intent://` URL with the store as `browser_fallback_url`, plus a timed store fallback for browsers that ignore `intent://`. |
| `scheme-then-store` | iOS with a `scheme` set | Tries the custom scheme, then opens the store if the page is still visible after `timeout`. |
| `store-only` | iOS with no scheme | Opens the App Store. |
| `desktop-stay` / `desktop-redirect` | Desktop | Stays on the page, or goes to the `desktop` URL. |

The fallback timer is cancelled only when the page is hidden or unloaded, which is the reliable sign that the app opened. It deliberately ignores `blur`, because iOS fires it for the "Open in the app?" prompt itself.

## API

| Call | Returns |
| --- | --- |
| `AppLink.open()` | Runs the redirect and returns the chosen target. |
| `AppLink.resolve(platform?, userAgent?)` | The target (`platform`, `strategy`, `url`, `store`) without navigating. Useful for testing and debugging. |
| `AppLink.wire(element)` | Attaches the click handler to an element added after page load. |
| `AppLink.detect()` | `"ios"`, `"android"` or `"desktop"`. |
| `AppLink.isInAppBrowser(userAgent?)` | `true` inside social-app browsers. |
| `AppLink.config` | The live `CONFIG` object. |

## License

[MIT](LICENSE)
