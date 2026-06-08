# LogisticDemo

An educational logistics web application that simulates a platform where **clients** create cargo shipment requests and **drivers** accept and manage them.

## How to run

No build step needed. Just open `index.html` in your browser — or serve the folder with any static server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## How it works

1. **Register** as a client or driver.
2. **Client** logs in → creates a shipment request (route, weight, volume, description) → receives a tracking number.
3. **Driver** logs in → sets vehicle capacity → accepts requests that fit their limits → updates shipment status (In transit / Delivered).
4. **Anyone** can track a shipment by entering its tracking number (format: `LT-YYYY-NNNNN`).
5. The **calculator** computes cargo volume and volumetric weight from dimensions.

## Tech stack

- Vanilla HTML, CSS, JavaScript — no frameworks, no build tools.
- All data is stored in `localStorage` (this is a demo; no backend).
- Passwords are hashed with the browser's built-in `crypto.subtle` (SHA-256) before storing.

## File overview

| File | Purpose |
|---|---|
| `index.html` | Landing page |
| `register.html` | Registration (client or driver) |
| `login.html` | Login |
| `client.html` | Client dashboard — create & view requests |
| `driver.html` | Driver dashboard — capacity, accept shipments, update status |
| `tracking.html` | Public shipment tracking by number |
| `calculator.html` | Volume & volumetric weight calculator |
| `script.js` | All application logic |
| `style.css` | All styles |

## Notes

- Since data lives in `localStorage`, it is shared across all tabs in the same browser but is **not** shared between users or devices.
- This project is for learning purposes only and is not intended for production use.
