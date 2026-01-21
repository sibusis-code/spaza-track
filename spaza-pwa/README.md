# Spaza Track (Offline-first PWA)

A minimal, offline-first sales and stock tracker for spaza shops.

## MVP Features
- Add products (name, cost, sell, quantity)
- Record sales (tap product, choose quantity)
- Auto stock deduction
- Show today’s profit
- PIN lock (local only)
- Works offline (IndexedDB + service worker)- **Database testing & cross-app data flow**

## Database Testing & Data Flow

The app now includes comprehensive database utilities for testing across apps and monitoring data flow:

### Quick Start Testing
1. Open `db-test.html` in your browser for the database testing interface
2. Click "Seed Sample Data" to populate with 10 sample products
3. View stats, export data, and test cross-app synchronization

### Database Features

#### Export/Import
- **Export**: Download entire database as JSON file
- **Import**: Upload JSON to restore or merge data
- **Merge Mode**: Import without clearing existing data

#### Sample Data Seeding
Pre-populated with realistic South African spaza shop products:
- Coca Cola, Bread, Milk, Sugar, etc.
- Realistic pricing in Rands
- Various stock levels including low-stock items

#### Cross-App Testing
Test data synchronization:
1. Export database from one instance
2. Open app in different browser/tab/device  
3. Import the data
4. Make changes in either location
5. Export and re-import to sync

#### Database Statistics
Real-time monitoring:
- Total products & stock levels
- Stock value calculation
- Sales count & revenue
- Profit tracking
- Low stock alerts
- Sales by date breakdown

### API Functions

New functions available in `db.js`:

```javascript
import { 
  exportDatabase,    // Export full DB to JSON
  importDatabase,    // Import from JSON
  clearDatabase,     // Clear all data
  getDatabaseStats,  // Get comprehensive stats
  seedDatabase,      // Add sample data
  listAllSales,      // Get all sales (not just one date)
  logDatabaseChange  // Log changes for debugging
} from './db.js';
```

### Testing Workflow

1. **Initial Setup**
   ```
   Open db-test.html → Seed Sample Data
   ```

2. **View Data Flow**
   ```
   Refresh Stats → Show Data Flow
   ```

3. **Cross-Instance Testing**
   ```
   Export DB → Open new tab → Import → Compare
   ```

4. **Data Inspection**
   ```
   View Products → View Sales → Full Export
   ```
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
