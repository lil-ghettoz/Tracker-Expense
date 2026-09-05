# GreenLedger Expense Tracker

Static Netlify-ready version of GreenLedger. No Flask or Python backend is required.

## Features
- Add, edit, delete, and clear transactions
- Income and expense tracking
- Balance, income, expense, and transaction totals
- Spending breakdown
- Category overview
- Responsive interface
- Data saved in browser localStorage

## Deploy to Netlify
Upload the entire `greenledger` folder or drag it into Netlify Drop. The root file must be `index.html`.

## Important data note
This static version stores transactions in the browser's `localStorage`. Data is tied to the browser/device and is not a shared online database. Clearing browser site data can remove saved transactions.
