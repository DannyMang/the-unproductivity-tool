# Beer Automation Backend

Backend automation server for BeerButton - one-click beer ordering using Puppeteer and DoorDash.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Update the `DOORDASH_DEFAULT_ADDRESS` with your address
   - Set `BROWSER_HEADLESS=false` to see the browser automation in action

3. **Login to DoorDash:**
   - Open Chrome and go to https://www.doordash.com
   - Login to your account
   - Keep this browser session active (Puppeteer will reuse it)

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Order Beer
```
POST /api/order-beer
Content-Type: application/json

{
  "deliveryAddress": "123 Main St, Berkeley, CA",
  "scheduleTime": "now",
  "beerPreference": "IPA",
  "quantity": 6
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "1729875600000",
  "cancelWindowSeconds": 10,
  "message": "Order initiated. Cancel within 10 seconds."
}
```

### Cancel Order
```
POST /api/cancel-order
Content-Type: application/json

{
  "orderId": "1729875600000"
}
```

### Check Order Status
```
GET /api/order-status/:orderId
```

## How It Works

1. **Order Initiated**: When you call `/api/order-beer`, the server launches a Chrome browser using Puppeteer
2. **Browser Automation**:
   - Navigates to DoorDash
   - Checks if you're logged in
   - Sets your delivery address
   - Searches for liquor stores
   - Selects the first available store
   - Adds items to cart
3. **Cancellation Window**: You have 10 seconds to cancel the order
4. **Checkout**: If not cancelled, the automation proceeds to checkout

## Important Notes

### Demo Mode
The automation **stops before actually placing the order** to avoid real charges. It will:
- Add items to cart
- Navigate to checkout
- Show you the checkout page
- NOT click the final "Place Order" button

To enable real ordering (at your own risk):
- Edit `backend/automation/doordash.js`
- Uncomment the final "Place Order" button click logic
- Ensure you're comfortable with automated purchases

### DoorDash Login
- You must be logged into DoorDash in your default Chrome profile
- The automation will check for login status and error if not logged in
- Keep your DoorDash session active

### Browser Visibility
- Set `BROWSER_HEADLESS=false` in `.env` to watch the automation
- Set `BROWSER_HEADLESS=true` for production (runs invisibly)

## Troubleshooting

### "Not logged into DoorDash" error
- Login to DoorDash in your regular Chrome browser
- Make sure the session stays active

### "No liquor stores found" error
- Your address may not have DoorDash liquor delivery
- Try a different address
- Check DoorDash manually to verify liquor delivery is available

### Browser automation fails
- DoorDash's UI may have changed
- Check the console logs for specific errors
- The selectors in `doordash.js` may need updating

### Order doesn't complete
- Check the 10-second cancellation window hasn't been triggered
- Verify items were added to cart in the browser window
- Check console logs for detailed error messages

## Configuration

Edit `backend/.env`:
```bash
PORT=3000                                    # Server port
DOORDASH_DEFAULT_ADDRESS="Your address"     # Default delivery address
BROWSER_HEADLESS=false                       # Show browser (false) or hide (true)
CANCEL_WINDOW_SECONDS=10                     # Cancellation window duration
```

## Security & Privacy

- This runs entirely on your local machine
- No data is sent to external servers (except DoorDash)
- Your DoorDash credentials are never exposed
- Uses your existing logged-in DoorDash session

## Future Enhancements

- [ ] Support for Uber Eats, Instacart, etc.
- [ ] Favorite orders / presets
- [ ] Schedule orders in advance
- [ ] Multiple item selection
- [ ] Real-time status updates via WebSockets
- [ ] Mobile app integration
