import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql/msnodesqlv8.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const app = express();
const PORT = Number(process.env.PORT || 4000);
const DEMO_MODE = (process.env.DEMO_MODE || 'false').toLowerCase() === 'true';
app.use(cors());
app.use(express.json());
let poolPromise;
/** Connect to SQL Server using the current Windows account. */
function pool() {
  if (!poolPromise) {
    const config = {
      connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${process.env.DB_SERVER || 'AYANS-LAPTOP\\SQLEXPRESS'};Database=${process.env.DB_NAME || 'SmartEVChargingNetwork'};Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;`,
      pool: {
        max: 8,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
    poolPromise = new sql.ConnectionPool(config).connect().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }
  return poolPromise;
}
async function rows(query, inputs = {}) {
  const connection = await pool();
  const request = connection.request();
  for (const [key, value] of Object.entries(inputs)) {
    request.input(key, value);
  }
  const result = await request.query(query);
  return result.recordset;
}
const fail = (res, error, status = 400) => res.status(status).json({
  error: error?.originalError?.info?.message || error?.message || 'Request failed',
});
app.get('/api/health', async (_req, res) => {
  if (DEMO_MODE) {
    return res.json({ ok: true, demoMode: true, message: 'API ready in demo mode' });
  }
  try {
    await pool();
    return res.json({ ok: true, demoMode: false, message: 'SQL Server connected' });
  }
  catch (error) {
    return res.status(503).json({
      ok: false,
      demoMode: false,
      message: 'SQL Server connection failed',
      detail: error.message,
    });
  }
});
app.get('/api/bootstrap', async (_req, res) => {
  if (DEMO_MODE) {
    return res.status(409).json({ error: 'SQL mode is disabled' });
  }
  try {
    const [users, vehicles, stations, chargers, reservations, sessions, payments, queue, audit, pricing] = await Promise.all([
    rows('SELECT user_id, full_name, email, phone FROM Users ORDER BY user_id'),
    rows('SELECT vehicle_id, user_id, vehicle_number, vehicle_model, battery_capacity FROM Vehicles ORDER BY vehicle_id'),

    rows('SELECT station_id, station_name, location, total_chargers FROM Stations ORDER BY station_id'),
    rows('SELECT charger_id, station_id, charger_type, power_rating, status FROM Chargers ORDER BY charger_id'),

    rows('SELECT reservation_id, user_id, vehicle_id, charger_id, reservation_time, start_time, end_time, status FROM Reservations ORDER BY reservation_id DESC'),

    rows('SELECT session_id, reservation_id, start_time, end_time, energy_consumed, total_amount, status FROM ChargingSessions ORDER BY session_id DESC'),

    rows('SELECT payment_id, session_id, amount, payment_method, payment_status, payment_time FROM Payments ORDER BY payment_id DESC'),

    rows('SELECT queue_id, user_id, station_id, vehicle_id, request_time, queue_status FROM ChargingQueue ORDER BY request_time'),

    rows('SELECT TOP 100 log_id, entity_name, entity_id, action, action_time, description FROM AuditLog ORDER BY log_id DESC'),

    rows('SELECT pricing_id, station_id, charger_type, peak_rate, off_peak_rate FROM Pricing ORDER BY pricing_id'),

    ]);
    return res.json({
      demoMode: false,
      data: { users, vehicles, stations, chargers, reservations, sessions, payments, queue, audit, pricing },

    });
  }
  catch (error) {
    return fail(res, error, 500);
  }
});
app.get('/api/chargers', async (_req, res) => {
  try {
    const items = DEMO_MODE
    ? []
    : await rows('SELECT * FROM vw_AvailableChargers ORDER BY station_id, charger_id');
    return res.json({ demoMode: DEMO_MODE, items });
  }
  catch (error) {
    return fail(res, error, 500);
  }
});
app.get('/api/reservations', async (_req, res) => {
  try {
    const items = DEMO_MODE
    ? []
    : await rows('SELECT * FROM vw_ReservationHistory ORDER BY reservation_id DESC');
    return res.json({ demoMode: DEMO_MODE, items });
  }
  catch (error) {
    return fail(res, error, 500);
  }
});
app.get('/api/reports/charging', async (_req, res) => {
  try {
    const items = DEMO_MODE
    ? []
    : await rows('SELECT * FROM vw_ChargingPaymentReport ORDER BY session_id DESC');
    return res.json({ demoMode: DEMO_MODE, items });
  }
  catch (error) {
    return fail(res, error, 500);
  }
});
app.get('/api/reports/stations', async (_req, res) => {
  try {
    const items = DEMO_MODE
    ? []
    : await rows('SELECT * FROM vw_StationUtilization ORDER BY station_id');
    return res.json({ demoMode: DEMO_MODE, items });
  }
  catch (error) {
    return fail(res, error, 500);
  }
});
app.get('/api/audit', async (_req, res) => {
  try {
    const items = DEMO_MODE ? [] : await rows('SELECT TOP 100 * FROM AuditLog ORDER BY log_id DESC');
    return res.json({ demoMode: DEMO_MODE, items });
  }
  catch (error) {
    return fail(res, error, 500);
  }
});
app.post('/api/reservations', async (req, res) => {
  if (DEMO_MODE)
  return res.status(409).json({ error: 'API is in demo mode' });
  try {
    const connection = await pool();
    const request = connection.request();
    request
    .input('user_id', sql.Int, Number(req.body.user_id))
    .input('vehicle_id', sql.Int, Number(req.body.vehicle_id))
    .input('station_id', sql.Int, Number(req.body.station_id))
    .input('charger_type', sql.VarChar(20), req.body.charger_type || 'AC')
    .input('start_time', sql.DateTime, new Date(Date.now() + 30 * 60000))
    .input('end_time', sql.DateTime, new Date(Date.now() + 90 * 60000));
    const result = await request.execute('sp_CreateReservation');
    return res.status(201).json({ ok: true, recordset: result.recordset });
  }
  catch (error) {
    return fail(res, error);
  }
});
app.post('/api/sessions/start', async (req, res) => {
  if (DEMO_MODE)
  return res.status(409).json({ error: 'API is in demo mode' });
  try {
    const connection = await pool();
    const request = connection.request();
    request.input('reservation_id', sql.Int, Number(req.body.reservation_id));
    const result = await request.execute('sp_StartCharging');
    return res.status(201).json({ ok: true, recordset: result.recordset });
  }
  catch (error) {
    return fail(res, error);
  }
});
app.post('/api/sessions/end', async (req, res) => {
  if (DEMO_MODE)
  return res.status(409).json({ error: 'API is in demo mode' });
  try {
    const connection = await pool();
    const request = connection.request();
    request
    .input('session_id', sql.Int, Number(req.body.session_id))
    .input('energy_consumed', sql.Decimal(8, 2), Number(req.body.energy_consumed));
    const result = await request.execute('sp_EndCharging');
    return res.json({ ok: true, recordset: result.recordset });
  }
  catch (error) {
    return fail(res, error);
  }
});
app.post('/api/payments/pay', async (req, res) => {
  if (DEMO_MODE) return res.status(409).json({ error: 'API is in demo mode' });
  try {
    const paymentId = Number(req.body.payment_id);
    const method = String(req.body.payment_method || 'UPI');
    const connection = await pool();
    const transaction = new sql.Transaction(connection);
    await transaction.begin();
    try {
      const request = new sql.Request(transaction);
      const result = await request.input('payment_id', sql.Int, paymentId).input('payment_method', sql.VarChar(30), method).query(`
        UPDATE Payments SET payment_status = 'SUCCESS', payment_method = @payment_method, payment_time = GETDATE()
        OUTPUT inserted.payment_id, inserted.session_id, inserted.amount, inserted.payment_method, inserted.payment_status, inserted.payment_time
        WHERE payment_id = @payment_id AND payment_status = 'PENDING';
      `);
      if (!result.recordset.length) throw new Error('Payment is not pending or payment ID was not found.');
      await new sql.Request(transaction).input('payment_id', sql.Int, paymentId).query(`
        INSERT INTO AuditLog (entity_name, entity_id, action, description)
        SELECT 'Payment', payment_id, 'PAYMENT_SUCCESS', CONCAT('Payment completed: ', payment_method, ' · ₹', amount)
        FROM Payments WHERE payment_id = @payment_id;
      `);
      await transaction.commit();
      return res.json({ ok: true, payment: result.recordset[0] });
    } catch (error) { await transaction.rollback(); throw error; }
  } catch (error) { return fail(res, error); }
});
app.post('/api/queue', async (req, res) => {
  if (DEMO_MODE)
  return res.status(409).json({ error: 'API is in demo mode' });
  try {
    const connection = await pool();
    const request = connection.request();
    request
    .input('user_id', sql.Int, Number(req.body.user_id))
    .input('vehicle_id', sql.Int, Number(req.body.vehicle_id))
    .input('station_id', sql.Int, Number(req.body.station_id));
    const result = await request.execute('sp_AddToChargingQueue');
    return res.status(201).json({ ok: true, recordset: result.recordset });
  }
  catch (error) {
    return fail(res, error);
  }
});
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(currentDirectory, '../client/dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(currentDirectory, '../client/dist/index.html'));
  });
}
app.listen(PORT, () => {
  console.log(`Voltway API listening at http://localhost:${PORT} | ${DEMO_MODE ? 'DEMO' : 'SQL SERVER'}`);
});

