# Spaza Track (Offline-first PWA)

A minimal, offline-first sales and stock tracker for spaza shops.

## MVP Features
- Add products (name, cost, sell, quantity)
- Record sales (tap product, choose quantity)
- Auto stock deduction
- Show today’s profit
- PIN lock (local only)
- Works offline (IndexedDB + service worker)

## Run Locally (Windows)

Using Python (recommended):

```powershell
# In the project folder
cd "c:\Users\DataAnalyst\Documents\Spaza Track\spaza-pwa"
python -m http.server 8080
```

Then open http://localhost:8080 in your browser (Chrome/Edge on Android supported).

If Python is not available, use VS Code Live Server or any static HTTP server.

## Notes
- All data is stored on-device using IndexedDB. No cloud required.
- Daily profit = sum((selling_cost - cost_price) * quantity_sold) for today.
- Low stock alert shows items with quantity <= 3.
- SMS/WhatsApp summaries and syncing can be added later.

## Next Steps
- Add export/share of daily summary
- Optional: Sync to a simple FastAPI backend when online
- SMS via Twilio or Africa's Talking
