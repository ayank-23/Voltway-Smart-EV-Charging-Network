# Voltway — Smart EV Charging Network

This folder contains the React/Vite dashboard, Express API, and SQL scripts supplied for the Smart EV Charging Network project. Backend JavaScript has been expanded into readable, multi-line code.

## Your local SQL Server settings

The included `server/.env` is configured for the connection details you showed in SSMS:

- Server: `AYANS-LAPTOP\SQLEXPRESS`
- Database: `SmartEVChargingNetwork`
- Authentication: Windows Authentication through `msnodesqlv8`

The app uses the Windows account that runs Node.js. Make sure that account has permission to access the database. If your SQL Server driver or instance configuration differs, the health endpoint will show the connection error.

## Start the application on Windows

1. Install Node.js 20 or newer.
2. Open this folder in VS Code.
3. In the project-root terminal run `npm install`. This installs Prettier too.
4. Run `npm run format` once if you want every frontend source file formatted in VS Code.
5. Run `npm install` again only if npm asks for it.
6. Run `npm run install:all`.
7. Run `npm run dev`.
8. Open `http://localhost:5173`.
9. Check `http://localhost:4000/api/health`. For live integration it should return `"message":"SQL Server connected"` and `"demoMode":false`.

If installation of `msnodesqlv8` fails, check that your Node.js version is supported and install the required Microsoft C++ build tools only if npm reports that they are needed.

## SQL scripts

The `database` folder contains the supplied table, sample-data, procedure, trigger, and view scripts. Use SSMS to inspect them and run them in dependency order. Do not repeatedly run the sample-data or demo scripts against data you need to preserve.

## Demonstration workflow

1. Dashboard: show station and charger state.
2. Reservations: create a reservation and verify the reservation row and charger status in SSMS.
3. Charging & billing: start a session, end it with energy consumption, and verify the calculated bill/payment and released charger.
4. Queue and audit: show waiting requests and audit records.

## Important

The UI supports a local browser-demo fallback. Only describe data as live SQL Server data after `/api/health` confirms the database connection and you have verified that an action updates the SQL tables. The full connection has not been tested on your computer from this generated archive.

## Feature update (station map, AC/DC selection, payments, queue allocation, dark mode)

The latest client adds a schematic station map, a persistent light/dark theme toggle, explicit AC/DC connector selection during reservation, payment actions after charging, and local-demo FIFO queue auto-assignment. The backend adds `POST /api/payments/pay` to record a simulated payment in SQL Server and refresh the UI from the database after each action.

**One-time SQL setup:** before using the AC/DC selection and queue auto-assignment with SQL Server, open `database/SmartEV_Feature_Update.sql` in SQL Server Management Studio, select the `SmartEVChargingNetwork` database, and execute the script. It updates `sp_CreateReservation` to honor the selected charger type and updates `sp_EndCharging` to create a pending payment and automatically reserve the freed connector for the oldest waiting driver at the same station. Back up your database before applying changes.

The station map is intentionally schematic, with approximate marker positions for the demo; it is not a GPS-accurate navigation map. Payments are simulated app transactions and do not charge a real bank account. Charger start/stop is software simulation unless connected to real EVSE hardware.
