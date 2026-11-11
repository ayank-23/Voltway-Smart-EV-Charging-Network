import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowRight, ArrowUpRight, BatteryCharging, Bell, Bolt, CalendarClock, Check, ChevronDown,
CircleDollarSign, Clock3, Download, Leaf, LayoutDashboard, ListOrdered, MapPin, Menu, Plus, PlugZap, RadioTower,
RefreshCw, Search, ShieldCheck, Sparkles, Users, Wallet, X, Zap, Moon, Sun, CreditCard, Navigation } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
const initial = {
  stations: [{ station_id: 1, station_name: 'SRM Charging Hub', location: 'Kattankulathur' }, { station_id: 2,
station_name: 'Chennai Central EV', location: 'Chennai Central' }, { station_id: 3, station_name: 'OMR Green Charge',
location: 'Old Mahabalipuram Road' }],
  users: [{ user_id: 1, full_name: 'Ayan Khan', email: 'ayan@gmail.com' }, { user_id: 2, full_name: 'Rahul Sharma',
email: 'rahul@gmail.com' }, { user_id: 3, full_name: 'Priya Nair', email: 'priya@gmail.com' }, { user_id: 4,
full_name: 'Arjun Mehta', email: 'arjun@gmail.com' }, { user_id: 5, full_name: 'Sneha Kapoor', email: 'sneha@gmail.com' }],

  vehicles: [{ vehicle_id: 1, user_id: 1, vehicle_model: 'Tata Nexon EV', vehicle_number: 'TN01EV1001' }, { vehicle_id: 2,
user_id: 2, vehicle_model: 'MG ZS EV', vehicle_number: 'TN02EV1002' }, { vehicle_id: 3, user_id: 3, vehicle_model: 'Hyundai Ioniq 5',
vehicle_number: 'TN03EV1003' }, { vehicle_id: 4, user_id: 4, vehicle_model: 'Tata Punch EV', vehicle_number: 'TN04EV1004' },
{ vehicle_id: 5, user_id: 5, vehicle_model: 'Mahindra XUV400 EV', vehicle_number: 'TN05EV1005' }],
  chargers: [{ charger_id: 1, station_id: 1, charger_type: 'AC', power_rating: 22, status: 'AVAILABLE' }, { charger_id: 2,
station_id: 1, charger_type: 'DC', power_rating: 60, status: 'RESERVED' }, { charger_id: 3, station_id: 1, charger_type: 'DC',
power_rating: 120, status: 'AVAILABLE' }, { charger_id: 4, station_id: 1, charger_type: 'AC', power_rating: 22,
status: 'MAINTENANCE' }, { charger_id: 5, station_id: 2, charger_type: 'DC', power_rating: 60, status: 'AVAILABLE' },
{ charger_id: 6, station_id: 2, charger_type: 'AC', power_rating: 22, status: 'CHARGING' }, { charger_id: 7,
station_id: 2, charger_type: 'DC', power_rating: 120, status: 'AVAILABLE' }, { charger_id: 8, station_id: 3,
charger_type: 'AC', power_rating: 22, status: 'AVAILABLE' }, { charger_id: 9, station_id: 3, charger_type: 'DC',
power_rating: 60, status: 'CHARGING' }, { charger_id: 10, station_id: 3, charger_type: 'DC', power_rating: 120,
status: 'AVAILABLE' }, { charger_id: 11, station_id: 3, charger_type: 'AC', power_rating: 22, status: 'AVAILABLE' }],

  reservations: [{ reservation_id: 1048, user_id: 2, vehicle_id: 2, charger_id: 2, start_time: new Date(Date.now() + 45 * 60000).toISOString(),
status: 'CONFIRMED' }, { reservation_id: 1047, user_id: 3, vehicle_id: 3, charger_id: 6, start_time: new Date(Date.now() - 35 * 60000).toISOString(),
status: 'CONFIRMED' }, { reservation_id: 1046, user_id: 1, vehicle_id: 1, charger_id: 1, start_time: new Date(Date.now() - 120 * 60000).toISOString(),
status: 'COMPLETED' }],
  sessions: [{ session_id: 501, reservation_id: 1046, start_time: new Date(Date.now() - 120 * 60000).toISOString(),
energy_consumed: 20, total_amount: 160, status: 'COMPLETED' }, { session_id: 502, reservation_id: 1047, start_time: new Date(Date.now() - 35 * 60000).toISOString(),
status: 'ACTIVE' }],
  payments: [{ payment_id: 9001, session_id: 501, amount: 160, payment_method: 'UPI', payment_status: 'SUCCESS',
payment_time: new Date().toISOString() }],
  queue: [{ queue_id: 201, user_id: 4, vehicle_id: 4, station_id: 2, request_time: new Date(Date.now() - 12 * 60000).toISOString(),
queue_status: 'WAITING' }],
  audit: [{ log_id: 7004, entity_name: 'ChargingSession', entity_id: 501, action: 'SESSION_COMPLETED', description: 'Charging completed · 20 kWh · ₹160',
action_time: new Date(Date.now() - 60 * 60000).toISOString() }, { log_id: 7003, entity_name: 'Reservation',
entity_id: 1048, action: 'RESERVATION_CREATED', description: 'Reservation confirmed at SRM Charging Hub', action_time: new Date(Date.now() - 15 * 60000).toISOString() }]
};
const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));
const dt = x => x ? new Date(x).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const initials = x => (x || '?').split(' ').map(t => t[0]).slice(0, 2).join('').toUpperCase();
function App() {
  const [d, setD] = useState(() => { try {
      return JSON.parse(localStorage.getItem('voltway-v1')) || initial;
    }
    catch {
      return initial;
  } });
  const [page, setPage] = useState('Overview'), [query, setQuery] = useState(''), [modal, setModal] = useState(''),
[toast, setToast] = useState(''), [mobile, setMobile] = useState(false), [api, setApi] = useState('Local demo');
  const [f, setF] = useState({ user: '1', vehicle: '1', station: '1', chargerType: 'AC', energy: '18', session: '', paymentMethod: 'UPI' });
  const [dark, setDark] = useState(() => localStorage.getItem('voltway-theme') === 'dark');
  useEffect(() => { localStorage.setItem('voltway-theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => { localStorage.setItem('voltway-v1', JSON.stringify(d));
  }, [d]);
  useEffect(() => { fetch('/api/health').then(r => r.json()).then(async (x) => { if (x.ok && !x.demoMode) {
        setApi('SQL Server');
        const b = await fetch('/api/bootstrap');
        const j = await b.json();
        if (!b.ok)
        throw new Error(j.error || 'Could not load SQL data');
        setD(j.data);
      }
      else
      setApi('Local demo');
    }).catch(() => setApi('Local demo'));
  }, []);
  async function sqlAction(url, body) { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok)
    throw new Error(j.error || 'SQL operation failed');
    const b = await fetch('/api/bootstrap');
    const d = await b.json();
    if (!b.ok)
    throw new Error(d.error || 'Could not refresh SQL data');
    setD(d.data);
    return j;
  }
  useEffect(() => { if (toast) {
      const t = setTimeout(() => setToast(''), 3200);
      return () => clearTimeout(t);
  } }, [toast]);
  const station = id => d.stations.find(x => x.station_id === +id)?.station_name || 'Unknown station', user = id => d.users.find(x => x.user_id === +id)?.full_name || `User ${id}`,
car = id => d.vehicles.find(x => x.vehicle_id === +id), charger = id => d.chargers.find(x => x.charger_id === +id);
  const free = d.chargers.filter(x => x.status === 'AVAILABLE').length, charging = d.chargers.filter(x => x.status === 'CHARGING').length,
reserved = d.chargers.filter(x => x.status === 'RESERVED').length, active = d.sessions.filter(x => x.status === 'ACTIVE'),
revenue = d.payments.filter(x => x.payment_status === 'SUCCESS').reduce((a, x) => a + x.amount, 0);
  const nav = [['Overview', LayoutDashboard, 'WORKSPACE'], ['Live chargers', RadioTower, 'WORKSPACE'], ['Reservations',
CalendarClock, 'WORKSPACE'], ['Charging & billing', BatteryCharging, 'WORKSPACE'], ['Queue', ListOrdered, 'MANAGEMENT'],
['Analytics', Activity, 'MANAGEMENT'], ['Audit trail', ShieldCheck, 'MANAGEMENT']];
  const tell = x => setToast(x);
  function log(draft, action, entity, id, description) { draft.audit.unshift({ log_id: Math.max(7000, ...draft.audit.map(x => x.log_id || 0)) + 1,
action, entity_name: entity, entity_id: id, description, action_time: new Date().toISOString() });
  }
  async function reserve(e) { e.preventDefault();
    const uid = +f.user, vid = +f.vehicle, sid = +f.station;
    if (api === 'SQL Server') {
      try {
        const j = await sqlAction('/api/reservations', { user_id: uid, vehicle_id: vid, station_id: sid, charger_type: f.chargerType });
        setModal('');
        tell('Reservation created in SQL Server' + (j.recordset?.[0]?.reservation_id ? ' · #' + j.recordset[0].reservation_id : ''));
      }
      catch (err) {
        tell(err.message);
      }
      return;
    } const v = d.vehicles.find(x => x.vehicle_id === vid && x.user_id === uid), c = d.chargers.find(x => x.station_id === sid && x.status === 'AVAILABLE' && x.charger_type === f.chargerType);
    if (!v)
    return tell('Selected vehicle does not belong to this driver.');
    if (!c)
    return tell('No available connector here. Add the driver to the queue.');
    const id = Math.max(1000, ...d.reservations.map(x => x.reservation_id)) + 1;
    setD(old => { const n = structuredClone(old);
      n.chargers.find(x => x.charger_id === c.charger_id).status = 'RESERVED';
      n.reservations.unshift({ reservation_id: id, user_id: uid, vehicle_id: vid, charger_id: c.charger_id,
start_time: new Date(Date.now() + 30 * 60000).toISOString(), status: 'CONFIRMED' });
      log(n, 'RESERVATION_CREATED', 'Reservation', id, `${user(uid)} reserved charger #${c.charger_id} at ${station(sid)}`);
      return n;
    });
    setModal('');
    tell(`Reservation #${id} confirmed · Connector #${c.charger_id}`);
  }
  async function start(rid) { if (api === 'SQL Server') {
      try {
        await sqlAction('/api/sessions/start', { reservation_id: +rid });
        tell('Charging session started in SQL Server');
      }
      catch (err) {
        tell(err.message);
      }
      return;
    } const r = d.reservations.find(x => x.reservation_id === +rid);
    if (!r || r.status !== 'CONFIRMED')
    return tell('Select a confirmed reservation.');
    const id = Math.max(500, ...d.sessions.map(x => x.session_id)) + 1;
    setD(old => { const n = structuredClone(old);
      n.chargers.find(x => x.charger_id === r.charger_id).status = 'CHARGING';
      n.sessions.unshift({ session_id: id, reservation_id: r.reservation_id, start_time: new Date().toISOString(),
status: 'ACTIVE' });
      log(n, 'SESSION_STARTED', 'ChargingSession', id, `Charging started for reservation #${r.reservation_id}`);
      return n;
    });
    tell(`Session #${id} started`);
  }
  async function endSession(e) { e.preventDefault();
    const sid = +f.session;
    if (api === 'SQL Server') {
      try {
        const j = await sqlAction('/api/sessions/end', { session_id: sid, energy_consumed: +f.energy });
        setModal('');
        const result = j.recordset?.[0];
        tell(result ? `Session ended · ${fmt(result.total_amount)} due. Complete payment in the Payment ledger.` : 'Session ended. Complete payment in the Payment ledger.');
      }
      catch (err) {
        tell(err.message);
      }
      return;
    } const s = d.sessions.find(x => x.session_id === sid && x.status === 'ACTIVE');
    if (!s)
    return tell('Choose an active session.');
    const r = d.reservations.find(x => x.reservation_id === s.reservation_id), c = charger(r?.charger_id), hour = new Date().getHours(),
peak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21), rate = c?.charger_type === 'DC' ? (peak ? 18 : 12) : (peak ? 12 : 8),
energy = Math.max(.1, +f.energy || 18), amount = Math.round(energy * rate * 100) / 100;
    setD(old => { const n = structuredClone(old), ss = n.sessions.find(x => x.session_id === sid);
      ss.end_time = new Date().toISOString();
      ss.energy_consumed = energy;
      ss.total_amount = amount;
      ss.status = 'COMPLETED';
      n.reservations.find(x => x.reservation_id === ss.reservation_id).status = 'COMPLETED';
      n.chargers.find(x => x.charger_id === r.charger_id).status = 'AVAILABLE';
      const paymentId = Math.max(9000, ...n.payments.map(x => x.payment_id)) + 1;
      n.payments.unshift({ payment_id: paymentId, session_id: sid, amount, payment_method: f.paymentMethod || 'UPI', payment_status: 'PENDING', payment_time: null });
      log(n, 'SESSION_COMPLETED', 'ChargingSession', sid, `${energy} kWh × ${fmt(rate)} / kWh = ${fmt(amount)} · payment pending`);
      const freedCharger = n.chargers.find(x => x.charger_id === r.charger_id);
      const next = n.queue.filter(q => q.queue_status === 'WAITING' && q.station_id === freedCharger?.station_id).sort((a,b) => new Date(a.request_time)-new Date(b.request_time))[0];
      if (next && freedCharger) {
        freedCharger.status = 'RESERVED';
        next.queue_status = 'ASSIGNED';
        const reservationId = Math.max(1000, ...n.reservations.map(x => x.reservation_id)) + 1;
        n.reservations.unshift({ reservation_id: reservationId, user_id: next.user_id, vehicle_id: next.vehicle_id, charger_id: freedCharger.charger_id, start_time: new Date().toISOString(), status: 'CONFIRMED' });
        log(n, 'QUEUE_AUTO_ASSIGNED', 'Reservation', reservationId, `${user(next.user_id)} automatically assigned to freed connector #${freedCharger.charger_id}`);
      }
      return n;
    });
    setModal('');
    tell(`Session ended · ${fmt(amount)} due. Use Make payment in the Payment ledger.`);
  }
  async function pay(paymentId) {
    if (api === 'SQL Server') {
      try {
        await sqlAction('/api/payments/pay', { payment_id: +paymentId, payment_method: f.paymentMethod || 'UPI' });
        tell(`Payment #${paymentId} successful`);
      } catch (err) { tell(err.message); }
      return;
    }
    setD(old => { const n = structuredClone(old); const p = n.payments.find(x => x.payment_id === +paymentId); if (!p || p.payment_status === 'SUCCESS') return n; p.payment_status = 'SUCCESS'; p.payment_method = f.paymentMethod || 'UPI'; p.payment_time = new Date().toISOString(); log(n, 'PAYMENT_SUCCESS', 'Payment', p.payment_id, `Payment of ${fmt(p.amount)} completed via ${p.payment_method}`); return n; });
    tell(`Payment #${paymentId} successful`);
  }
  async function addQueue(e) { e.preventDefault();
    const uid = +f.user, vid = +f.vehicle, sid = +f.station;
    if (api === 'SQL Server') {
      try {
        await sqlAction('/api/queue', { user_id: uid, vehicle_id: vid, station_id: sid });
        setModal('');
        tell('Driver added to SQL Server queue');
      }
      catch (err) {
        tell(err.message);
      }
      return;
    } if (!d.vehicles.some(v => v.vehicle_id === vid && v.user_id === uid))
    return tell('Vehicle does not belong to this driver.');
    if (d.chargers.some(c => c.station_id === sid && c.status === 'AVAILABLE'))
    return tell('There is an available charger. Reserve it instead.');
    setD(old => ({ ...old, queue: [...old.queue, { queue_id: Math.max(200, ...old.queue.map(x => x.queue_id)) + 1,
user_id: uid, vehicle_id: vid, station_id: sid, request_time: new Date().toISOString(), queue_status: 'WAITING' }] }));
    setModal('');
    tell(`${user(uid)} added to queue`);
  }
  function reset() { if (confirm('Reset demo data?')) {
      localStorage.removeItem('voltway-v1');
      setD(initial);
      tell('Demo data reset');
  } }
  function exportCSV() { const rows = [['id', 'entity', 'action', 'description', 'time'], ...d.audit.map(x => [x.log_id,
x.entity_name, x.action, x.description, x.action_time])];
    const blob = new Blob([rows.map(r => r.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')],
{ type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'voltway-audit.csv';
    a.click();
    tell('CSV report exported');
  }
  const Status = ({ s }) => <span className={'status ' + (s || '').toLowerCase()}>
  <i />
  {s}
  </span>;
  const Intro = ({ eyebrow, title, sub, action }) => <div className="page-intro">
  <div>
  <div className="eyebrow">
  {eyebrow}
  </div>
  <h1>
  {title}<b>.</b>
  </h1>
  <p>
  {sub}
  </p>
  </div>
  {action}
  </div>;
  const btn = (label, fn, icon = <ArrowRight size={15}/>, primary = false) => <button className={primary ? 'primary' : 'outline'} onClick={fn}>
  {icon}{label}
  </button>;
  const Table = ({ rows }) => <div className="table-scroll">
  <table>
  <thead>
  <tr>
  <th>REFERENCE</th>
  <th>DRIVER / VEHICLE</th>
  <th>CONNECTOR</th>
  <th>START TIME</th>
  <th>STATUS</th>
  <th>ACTION</th>
  </tr>
  </thead>
  <tbody>
  {rows.map(r => <tr key={r.reservation_id}>
    <td>
    <b className="mono">VW-{r.reservation_id}
    </b>
    </td>
    <td>
    <div className="driver">
    <span>
    {initials(user(r.user_id))}
    </span>
    <div>
    <b>
    {user(r.user_id)}
    </b>
    <small>
    {car(r.vehicle_id)?.vehicle_model}
    </small>
    </div>
    </div>
    </td>
    <td>
    <span className="tag">#{r.charger_id} · {charger(r.charger_id)?.charger_type}
    </span>
    </td>
    <td>
    {dt(r.start_time)}
    </td>
    <td>
    <Status s={r.status}/>
    </td>
    <td>
    {r.status === 'CONFIRMED' && !d.sessions.some(s => s.reservation_id === r.reservation_id && s.status === 'ACTIVE') ? <button className="smallprimary" onClick={() => start(r.reservation_id)}>Start charging</button> : r.status === 'COMPLETED' ? <Status s={r.status}/> : d.sessions.some(s => s.reservation_id === r.reservation_id && s.status === 'ACTIVE') ? <span className="muted">Charging in progress</span> : <span className="muted">—</span>}
    </td>
    </tr>)}
  </tbody>
  </table>
  {!rows.length && <div className="empty">Nothing to show yet.</div>}
  </div>;
  const ActivityList = ({ rows }) => <div className="activity-list">
  {rows.map(x => <div className="activity-row" key={x.log_id}>
    <div className="activity-icon">
    {x.action?.includes('COMPLETED') ? <Check size={15}/> : <CalendarClock size={15}/>}
    </div>
    <div>
    <b>
    {x.action?.replaceAll('_', ' ')}
    </b>
    <p>
    {x.description}
    </p>
    <small>
    {dt(x.action_time)}
    </small>
    </div>
    </div>)}
  </div>;
  const Top = () => <header className="topbar">
  <button className="mobile-toggle" onClick={() => setMobile(!mobile)}>
  <Menu />
  </button>
  <div className="crumb">Workspace <span>/</span> <b>
  {page}
  </b>
  </div>
  <div className="topright">
  <span className="connection">
  <i />
  {api}
  </span>
  <button className="round" title={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDark(v => !v)}>
  {dark ? <Sun size={16}/> : <Moon size={16}/>}
  </button>
  <button className="round" title="Reset demo" onClick={reset}>
  <RefreshCw size={16}/>
  </button>
  <button className="round" onClick={() => tell('No urgent alerts.')}>
  <Bell size={16}/>
  </button>
  <span className="user-badge">AK</span>
  </div>
  </header>;
  const sidebar = <aside className={'sidebar ' + (mobile ? 'open' : '')}>
  <div className="brand">
  <div className="brand-icon">
  <Zap fill="currentColor"/>
  </div>
  <div>
  <strong>voltway<span>.</span>
  </strong>
  <small>CHARGING NETWORK OS</small>
  </div>
  <button className="close-mobile" onClick={() => setMobile(false)}>
  <X />
  </button>
  </div>
  <div className="workspace">
  <span /> SRM · OPERATIONS <ChevronDown size={14}/>
  </div>
  {['WORKSPACE', 'MANAGEMENT'].map(g => <div className="navgroup" key={g}>
    <label>
    {g}
    </label>
    {nav.filter(x => x[2] === g).map(([n, I]) => <button key={n} className={'navitem ' + (page === n ? 'selected' : '')} onClick={() => { setPage(n);
          setQuery('');
          setMobile(false);
      }}>
      <I size={17}/>
      {n}{n === 'Queue' && d.queue.filter(q => q.queue_status === 'WAITING').length > 0 && <em>
        {d.queue.filter(q => q.queue_status === 'WAITING').length}
        </em>}
      </button>)}
    </div>)}<div className="sidebottom">
  <div className="impact">
  <div className="impact-icon">
  <Leaf />
  </div>
  <small>NETWORK IMPACT</small>
  <strong>2.4 <i>tCO₂ saved</i>
  </strong>
  <span>
  <b /> Clean energy tracking</span>
  </div>
  <div className="profile">
  <div>AK</div>
  <span>
  <b>Ayan Khan</b>
  <small>Network administrator</small>
  </span>
  </div>
  </div>
  </aside>;
  const Stat = ({ title, value, unit, foot, I, tone = '' }) => <div className="stat">
  <div className={'staticon ' + tone}>
  <I size={18}/>
  </div>
  <label>
  {title}
  </label>
  <strong>
  {value}<small>
  {unit}
  </small>
  </strong>
  <div className="statfoot">
  <span>
  <ArrowUpRight size={13}/> {foot}
  </span>
  </div>
  </div>;
  const Reservations = ({ rows = d.reservations }) => <section className="panel table-panel">
  <div className="panelhead">
  <div>
  <small>BOOKING OPERATIONS</small>
  <h3>Reservation ledger</h3>
  </div>
  <span className="muted">
  {rows.length} records</span>
  </div>
  <Table rows={rows}/>
  </section>;
  const Overview = () => <>
  <div className="welcome">
  <div>
  <div className="eyebrow">
  <Sparkles size={13}/> NETWORK CONTROL CENTER <span className="pulse"/> LIVE OVERVIEW</div>
  <h1>Good evening, Ayan<b>.</b>
  </h1>
  <p>Your network at a glance. Here's what needs your attention.</p>
  </div>
  {btn('New reservation', () => setModal('reservation'), <Plus size={16}/>, true)}
  </div>
  <section className="hero">
  <div className="herocopy">
  <div className="hero-kicker">
  <i /> NETWORK HEALTH <span /> {Math.round((free + charging + reserved) / d.chargers.length * 100)}% OPERATIONAL</div>
  <h2>Powering the next<br />
  <em>move forward.</em>
  </h2>
  <p>One network. Smarter charging. Less waiting.</p>
  <div className="herofoot">
  <button onClick={() => setPage('Live chargers')}>Explore chargers <ArrowRight size={15}/>
  </button>
  <span>
  <ShieldCheck size={15}/> Transaction-safe allocation</span>
  </div>
  </div>
  <div className="orbital">
  <div className="orbit o1"/>
  <div className="orbit o2"/>
  <div className="orbit o3"/>
  <div className="core">
  <Zap fill="currentColor" size={37}/>
  </div>
  <div className="orbitnode na">
  <PlugZap />
  </div>
  <div className="orbitnode nb">
  <Leaf />
  </div>
  <div className="orbitnode nc">
  <BatteryCharging />
  </div>
  <span className="orbittext">AC / DC</span>
  </div>
  <div className="herometrics">
  <div>
  <small>ACTIVE SESSIONS</small>
  <strong>
  {String(active.length).padStart(2, '0')}
  </strong>
  <span>Currently charging</span>
  </div>
  <hr />
  <div>
  <small>ENERGY DELIVERED</small>
  <strong>
  {d.sessions.filter(x => x.status === 'COMPLETED').reduce((a, x) => a + (x.energy_consumed || 0), 0).toFixed(1)} <i>kWh</i>
  </strong>
  <span>Completed sessions</span>
  </div>
  </div>
  </section>
  <div className="stats">
  <Stat title="Available connectors" value={free} unit={`/ ${d.chargers.length}`} foot={`${Math.round(free / d.chargers.length * 100)}% ready to reserve`} I={PlugZap}/>
  <Stat title="Charging now" value={charging} unit=" units" foot="Active sessions" I={Bolt} tone="blue"/>
  <Stat title="Recorded revenue" value={fmt(revenue)} unit="" foot="Successful payments" I={CircleDollarSign} tone="amber"/>
  <Stat title="Waiting in queue" value={d.queue.filter(x => x.queue_status === 'WAITING').length} unit=" drivers" foot="Awaiting connector" I={Clock3} tone="violet"/>
  </div>
  <div className="grid2">
  <section className="panel chartpanel">
  <div className="panelhead">
  <div>
  <small>PERFORMANCE</small>
  <h3>Network revenue <span className="pill">7 days</span>
  </h3>
  </div>
  <span className="muted">₹ INR</span>
  </div>
  <div className="legend">
  <i /> Revenue <span className="demo-note">Illustrative trend in demo mode</span>
  </div>
  <div className="chart">
  <ResponsiveContainer width="100%" height="100%">
  <AreaChart data={[{ day: 'Mon', revenue: 4200 }, { day: 'Tue', revenue: 3100 }, { day: 'Wed', revenue: 5600 }, { day: 'Thu', revenue: 4700 }, { day: 'Fri', revenue: 6900 }, { day: 'Sat', revenue: 5200 }, { day: 'Sun', revenue: revenue + 1600 }]}>
  <defs>
  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stopColor="#83c88d" stopOpacity=".35"/>
  <stop offset="100%" stopColor="#83c88d" stopOpacity="0"/>
  </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e8eee8"/>
  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#89938d', fontSize: 11 }}/>
  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#89938d', fontSize: 10 }}/>
  <Tooltip formatter={v => fmt(v)}/>
  <Area dataKey="revenue" type="monotone" stroke="#4c9b65" strokeWidth={2.5} fill="url(#fill)"/>
  </AreaChart>
  </ResponsiveContainer>
  </div>
  </section>
  <section className="panel stations">
  <div className="panelhead">
  <div>
  <small>LOCATIONS</small>
  <h3>Station pulse</h3>
  </div>
  <button className="round" onClick={() => setPage('Live chargers')}>
  <ArrowRight size={16}/>
  </button>
  </div>
  {d.stations.map(s => { const cs = d.chargers.filter(c => c.station_id === s.station_id), av = cs.filter(c => c.status === 'AVAILABLE').length, oc = cs.filter(c => ['RESERVED', 'CHARGING'].includes(c.status)).length; return <div className="stationrow" key={s.station_id}>
      <div className="mapicon">
      <MapPin size={17}/>
      </div>
      <div className="stationinfo">
      <b>
      {s.station_name}
      </b>
      <small>
      {s.location}
      </small>
      <div className="progress">
      <i style={{ width: `${oc / Math.max(1, cs.length) * 100}%` }}/>
      </div>
      </div>
      <strong>
      {av}<small>/{cs.length}
      </small>
      <i>free</i>
      </strong>
      </div>; })}<button className="fulloutline" onClick={() => setPage('Live chargers')}>Manage stations <ArrowRight size={14}/>
  </button>
  </section>
  </div>
  <div className="grid2 bottom">
  <Reservations rows={d.reservations.slice(0, 4)}/>
  <section className="panel">
  <div className="panelhead">
  <div>
  <small>SYSTEM LOG</small>
  <h3>Activity stream</h3>
  </div>
  <span className="live">● LIVE</span>
  </div>
  <ActivityList rows={d.audit.slice(0, 4)}/>
  <button className="textlink" onClick={() => setPage('Audit trail')}>Open audit trail <ArrowRight size={14}/>
  </button>
  </section>
  </div></>;
  const StationMap = () => {
    const positions = { 1: { x: 26, y: 45, label: 'Kattankulathur' }, 2: { x: 58, y: 28, label: 'Chennai Central' }, 3: { x: 75, y: 67, label: 'OMR' } };
    return <section className="station-map panel"><div className="panelhead"><div><small>NETWORK LOCATIONS</small><h3>Live charging locations</h3></div><span className="map-legend"><i className="map-dot available"/> Available <i className="map-dot charging"/> Charging <i className="map-dot reserved"/> Reserved</span></div>
      <div className="map-canvas"><svg className="map-roads" viewBox="0 0 1000 430" preserveAspectRatio="none" aria-hidden="true"><path d="M-20 330 C150 250 190 170 330 205 S570 310 720 180 S900 90 1030 140"/><path d="M100 -20 C190 110 300 160 430 180 S700 250 820 450"/><path d="M-20 90 C200 120 330 30 500 80 S790 140 1030 40"/><path d="M450 -20 C430 90 520 150 500 240 S550 350 600 450"/></svg>
        <span className="map-water">BAY OF BENGAL</span><span className="map-label ml1">Chennai</span><span className="map-label ml2">GST Road</span><span className="map-label ml3">OMR</span>
        {d.stations.map(st => { const pos = positions[st.station_id] || { x: 45 + (st.station_id * 13) % 40, y: 25 + (st.station_id * 19) % 55 }; const cs = d.chargers.filter(c => c.station_id === st.station_id); const freeCount = cs.filter(c => c.status === 'AVAILABLE').length; const busy = cs.some(c => c.status === 'CHARGING'); return <button key={st.station_id} className="map-pin" style={{ left: `${pos.x}%`, top: `${pos.y}%` }} onClick={() => { setQuery(st.station_name); }} title={`${st.station_name} · ${freeCount} available`}><span className={'pin-symbol ' + (freeCount ? 'available' : busy ? 'charging' : 'reserved')}><MapPin size={19} fill="currentColor"/></span><span className="pin-card"><b>{st.station_name}</b><small>{st.location}</small><em>{freeCount} available · {cs.length} connectors</em></span></button>; })}
      </div><div className="map-station-list">{d.stations.map(st => { const cs = d.chargers.filter(c => c.station_id === st.station_id); return <div key={st.station_id}><MapPin size={15}/><span><b>{st.station_name}</b><small>{st.location}</small></span><strong>{cs.filter(c => c.status === 'AVAILABLE').length}<small> available</small></strong></div>; })}</div>
      <p className="map-note"><Navigation size={13}/> Schematic network map for demonstration; marker positions are approximate, not GPS navigation coordinates.</p>
    </section>;
  };
  const ChargerPage = () => { const rows = d.chargers.filter(c => `${station(c.station_id)} ${c.status} ${c.charger_type} ${c.charger_id}`.toLowerCase().includes(query.toLowerCase())); return <>
    <Intro eyebrow="INFRASTRUCTURE" title="Live charger map" sub="Operational view of every connector across your network." action={btn('Reservations', () => setPage('Reservations'), <CalendarClock size={16}/>, true)}/>
    <div className="filter">
    <div>
    <Search size={16}/>
    <input placeholder="Search station, connector or status..." value={query} onChange={e => setQuery(e.target.value)}/>
    </div>
    <small>
    {rows.length} CONNECTORS</small>
    </div>
    <StationMap/>
    <div className="chargers">
    {rows.map(c => <div className="charger-card" key={c.charger_id}>
      <div className="charger-top">
      <div className={'plug ' + c.charger_type}>
      <PlugZap />
      </div>
      <Status s={c.status}/>
      </div>
      <small>CONNECTOR / {String(c.charger_id).padStart(3, '0')}
      </small>
      <h3>
      {station(c.station_id)}
      </h3>
      <p>Connector #{c.charger_id} · {c.charger_type}
      </p>
      <div className="power">
      <b>
      <Zap size={14}/>
      {c.power_rating} kW</b>
      <small>
      {c.charger_type === 'DC' ? 'FAST CHARGE' : 'AC CHARGE'}
      </small>
      </div>
      {c.status === 'AVAILABLE' ? <button className="cardaction" onClick={() => { setF(x => ({ ...x, station: String(c.station_id) })); setModal('reservation'); }}>Reserve connector <ArrowRight size={14}/>
        </button> : <div className="locked">
        <ShieldCheck size={14}/>
        {c.status === 'CHARGING' ? 'Session in progress' : c.status === 'RESERVED' ? 'Already allocated' : 'Service required'}
        </div>}
      </div>)}
    </div></>; };
  const ReservationPage = () => { const rows = d.reservations.filter(r => `${user(r.user_id)} ${station(charger(r.charger_id)?.station_id)} ${r.status} ${r.reservation_id}`.toLowerCase().includes(query.toLowerCase())); return <>
    <Intro eyebrow="BOOKING OPERATIONS" title="Reservations" sub="Allocate connectors and review bookings across the network." action={btn('New reservation', () => setModal('reservation'), <Plus size={16}/>, true)}/>
    <div className="filter">
    <div>
    <Search size={16}/>
    <input placeholder="Search driver, station or booking..." value={query} onChange={e => setQuery(e.target.value)}/>
    </div>
    <small>
    {rows.length} BOOKINGS</small>
    </div>
    <Reservations rows={rows}/>
    <section className="panel callout">
    <div>
    <h3>All connectors busy?</h3>
    <p>Add the driver to the FIFO waiting queue for their chosen station.</p>
    </div>
    {btn('Add to queue', () => setModal('queue'), <ListOrdered size={15}/>)}
    </section></>; };
  const ChargingPage = () => <>
  <Intro eyebrow="ENERGY & REVENUE" title="Charging & billing" sub="Track active sessions, energy consumed and payment records." action={btn('Reservations', () => setPage('Reservations'), <CalendarClock size={15}/>, true)}/>
  <div className="stats">
  <Stat title="Active sessions" value={active.length} unit="" foot="In progress" I={BatteryCharging}/>
  <Stat title="Energy delivered" value={d.sessions.reduce((a, s) => a + (s.energy_consumed || 0), 0).toFixed(1)} unit=" kWh" foot="Completed sessions" I={Zap} tone="blue"/>
  <Stat title="Payments recorded" value={d.payments.length} unit="" foot="Payment ledger" I={Wallet} tone="amber"/>
  </div>
  <section className="panel table-panel">
  <div className="panelhead">
  <div>
  <small>SESSION LEDGER</small>
  <h3>Charging sessions</h3>
  </div>
  </div>
  <div className="table-scroll">
  <table>
  <thead>
  <tr>
  <th>SESSION</th>
  <th>BOOKING</th>
  <th>CONNECTOR</th>
  <th>ENERGY</th>
  <th>AMOUNT</th>
  <th>STATUS / ACTION</th>
  </tr>
  </thead>
  <tbody>
  {d.sessions.map(s => { const r = d.reservations.find(x => x.reservation_id === s.reservation_id); return <tr key={s.session_id}>
      <td className="mono">SES-{s.session_id}
      </td>
      <td>VW-{s.reservation_id}
      </td>
      <td>#{r?.charger_id} · {charger(r?.charger_id)?.charger_type}
      </td>
      <td>
      {s.energy_consumed == null ? '—' : `${s.energy_consumed} kWh`}
      </td>
      <td>
      <b>
      {s.total_amount == null ? '—' : fmt(s.total_amount)}
      </b>
      </td>
      <td>
      {s.status === 'ACTIVE' ? <button className="smallprimary" onClick={() => { setF(x => ({ ...x, session: String(s.session_id), energy: '18' })); setModal('end'); }}>End session</button> : <Status s={s.status}/>}
      </td>
      </tr>; })}
  </tbody>
  </table>
  </div>
  </section>
  <section className="panel table-panel">
  <div className="panelhead">
  <div>
  <small>PAYMENT LEDGER</small>
  <h3>Recent payments</h3>
  </div>
  </div>
  <div className="table-scroll">
  <table>
  <thead>
  <tr>
  <th>PAYMENT</th>
  <th>SESSION</th>
  <th>METHOD</th>
  <th>AMOUNT</th>
  <th>STATUS / ACTION</th>
  <th>TIME</th>
  </tr>
  </thead>
  <tbody>
  {d.payments.map(p => <tr key={p.payment_id}>
    <td className="mono">PAY-{p.payment_id}
    </td>
    <td>SES-{p.session_id}
    </td>
    <td>
    {p.payment_method}
    </td>
    <td>
    <b>
    {fmt(p.amount)}
    </b>
    </td>
    <td>
    {p.payment_status === 'PENDING' ? <button className="smallprimary" onClick={() => pay(p.payment_id)}><CreditCard size={13}/> Make payment</button> : <Status s={p.payment_status}/>}
    </td>
    <td>
    {dt(p.payment_time)}
    </td>
    </tr>)}
  </tbody>
  </table>
  </div>
  </section></>;
  const QueuePage = () => { const qs = d.queue.filter(q => q.queue_status === 'WAITING').sort((a, b) => new Date(a.request_time) - new Date(b.request_time)); return <>
    <Intro eyebrow="WAITING ROOM" title="Charging queue" sub="FIFO ordering for drivers waiting on a connector." action={btn('Add driver', () => setModal('queue'), <Plus size={16}/>, true)}/>
    <div className="queuehero">
    <ListOrdered size={31}/>
    <div>
    <small>QUEUE ALGORITHM</small>
    <h3>First request. First served.</h3>
    <p>Queue position is calculated from request time.</p>
    </div>
    <strong>
    {String(qs.length).padStart(2, '0')}<small>WAITING</small>
    </strong>
    </div>
    <section className="panel table-panel">
    <div className="panelhead">
    <div>
    <small>CURRENT WAITLIST</small>
    <h3>Waiting drivers</h3>
    </div>
    </div>
    <div className="table-scroll">
    <table>
    <thead>
    <tr>
    <th>POSITION</th>
    <th>DRIVER</th>
    <th>VEHICLE</th>
    <th>STATION</th>
    <th>REQUESTED</th>
    <th>STATUS</th>
    </tr>
    </thead>
    <tbody>
    {qs.map((q, i) => <tr key={q.queue_id}>
      <td>
      <b className="position">
      {String(i + 1).padStart(2, '0')}
      </b>
      </td>
      <td>
      {user(q.user_id)}
      </td>
      <td>
      {car(q.vehicle_id)?.vehicle_model}
      </td>
      <td>
      {station(q.station_id)}
      </td>
      <td>
      {dt(q.request_time)}
      </td>
      <td>
      <Status s={q.queue_status}/>
      </td>
      </tr>)}
    </tbody>
    </table>
    {!qs.length && <div className="empty">No drivers waiting — all clear.</div>}
    </div>
    </section></>; };
  const Analytics = () => <>
  <Intro eyebrow="NETWORK INTELLIGENCE" title="Analytics" sub="Operational signals across connector availability and billing." action={btn('Export audit CSV', exportCSV, <Download size={15}/>)}/>
  <div className="stats">
  <Stat title="Gross revenue" value={fmt(revenue)} foot="Successful payments" I={CircleDollarSign}/>
  <Stat title="Utilization" value={`${Math.round((charging + reserved) / d.chargers.length * 100)}%`} foot="Charging + reserved" I={Activity} tone="blue"/>
  <Stat title="Completed sessions" value={d.sessions.filter(s => s.status === 'COMPLETED').length} foot="Session ledger" I={Check} tone="amber"/>
  </div>
  <div className="grid2">
  <section className="panel chartpanel">
  <div className="panelhead">
  <div>
  <small>CONNECTOR UTILIZATION</small>
  <h3>Station availability</h3>
  </div>
  </div>
  {d.stations.map(s => { const cs = d.chargers.filter(c => c.station_id === s.station_id), used = cs.filter(c => ['CHARGING', 'RESERVED'].includes(c.status)).length; return <div className="utilrow" key={s.station_id}>
      <div>
      <b>
      {s.station_name}
      </b>
      <small>
      {used} occupied · {cs.filter(c => c.status === 'AVAILABLE').length} available</small>
      </div>
      <div className="progress">
      <i style={{ width: `${used / Math.max(1, cs.length) * 100}%` }}/>
      </div>
      </div>; })}<p className="note">Live values are computed from current connector statuses. Revenue trend on Overview is illustrative in demo mode.</p>
  </section>
  <section className="panel chartpanel">
  <div className="panelhead">
  <div>
  <small>DATABASE DESIGN</small>
  <h3>SQL features</h3>
  </div>
  </div>
  {['Stored procedures', 'Transactions & rollback', 'UPDLOCK concurrency control', 'AFTER INSERT audit trigger', 'Views for reporting', 'ROW_NUMBER / RANK window functions'].map(x => <div className="feature" key={x}>
    <Check size={15}/>
    {x}
    </div>)}
  </section>
  </div></>;
  const Audit = () => <>
  <Intro eyebrow="GOVERNANCE & TRACEABILITY" title="Audit trail" sub="Chronological history of reservation and charging events." action={btn('Export CSV', exportCSV, <Download size={15}/>)}/>
  <section className="panel auditpanel">
  <div className="panelhead">
  <div>
  <small>EVENT LOG</small>
  <h3>Latest first</h3>
  </div>
  <span className="live">● TRACKING</span>
  </div>
  {d.audit.map(x => <div className="auditrow" key={x.log_id}>
    <div className="auditicon">
    <ShieldCheck size={17}/>
    </div>
    <div>
    <b>
    {x.action?.replaceAll('_', ' ')}
    </b>
    <p>
    {x.description}
    </p>
    <small>
    {x.entity_name} · ID {x.entity_id}
    </small>
    </div>
    <time>
    {dt(x.action_time)}
    </time>
    </div>)}
  </section></>;
  const Modal = () => !modal ? null : <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && setModal('')}>
  <form className="modal" onSubmit={modal === 'reservation' ? reserve : modal === 'queue' ? addQueue : endSession}>
  <div className="modalhead">
  <div>
  <small>NETWORK ACTION</small>
  <h2>
  {modal === 'reservation' ? 'Create reservation' : modal === 'queue' ? 'Join charging queue' : 'Complete charging session'}
  </h2>
  </div>
  <button type="button" className="round" onClick={() => setModal('')}>
  <X />
  </button>
  </div>
  {modal === 'end' ? <>
    <label>ACTIVE SESSION<select required value={f.session} onChange={e => setF({ ...f, session: e.target.value })}>
    {active.map(s => <option key={s.session_id} value={s.session_id}>Session #{s.session_id} · Booking #{s.reservation_id}
      </option>)}
    </select>
    </label>
    <label>ENERGY CONSUMED (kWh)<input type="number" min=".1" step=".1" required value={f.energy} onChange={e => setF({ ...f, energy: e.target.value })}/>
    <small>Bill = kWh × applicable AC/DC peak or off-peak rate. Payment is completed separately.</small>
    </label><label>PAYMENT METHOD<select value={f.paymentMethod} onChange={e => setF({ ...f, paymentMethod: e.target.value })}><option>UPI</option><option>Card</option><option>Net banking</option><option>Wallet</option></select></label></> : <>
    <label>DRIVER<select value={f.user} onChange={e => { const id = e.target.value, v = d.vehicles.find(v => v.user_id === +id); setF({ ...f, user: id, vehicle: String(v?.vehicle_id || '') }); }}>
    {d.users.map(u => <option key={u.user_id} value={u.user_id}>
      {u.full_name} · {u.email}
      </option>)}
    </select>
    </label>
    <label>VEHICLE<select value={f.vehicle} onChange={e => setF({ ...f, vehicle: e.target.value })}>
    {d.vehicles.filter(v => v.user_id === +f.user).map(v => <option key={v.vehicle_id} value={v.vehicle_id}>
      {v.vehicle_model} · {v.vehicle_number}
      </option>)}
    </select>
    </label>
    <label>STATION<select value={f.station} onChange={e => setF({ ...f, station: e.target.value })}>
    {d.stations.map(s => <option key={s.station_id} value={s.station_id}>
      {s.station_name} — {s.location}
      </option>)}
    </select>
    </label>
    {modal === 'reservation' && <label>CHARGER TYPE<select required value={f.chargerType} onChange={e => setF({ ...f, chargerType: e.target.value })}><option value="AC">AC · Standard charging</option><option value="DC">DC · Fast charging</option></select><small>Only a matching available connector at the selected station will be allocated.</small></label>}
    <div className="allocation">
    <PlugZap />
    <div>
    <b>
    {modal === 'reservation' ? 'Automatic connector allocation' : 'FIFO queue policy'}
    </b>
    <small>
    {modal === 'reservation' ? `${d.chargers.filter(c => c.station_id === +f.station && c.status === 'AVAILABLE').length} available connector(s) at this station` : 'Requests are ordered by request time.'}
    </small>
    </div>
    </div></>}<div className="modalactions">
  <button type="button" className="outline" onClick={() => setModal('')}>Cancel</button>
  <button className="primary" type="submit">
  {modal === 'reservation' ? 'Confirm reservation' : modal === 'queue' ? 'Join queue' : 'End charging & calculate bill'} <ArrowRight size={15}/>
  </button>
  </div>
  </form>
  </div>;
  return <div className={"app " + (dark ? "dark-theme" : "")}>
  {sidebar}<main>
  <Top />
  <div className="content">
  {page === 'Overview' ? <Overview /> : page === 'Live chargers' ? <ChargerPage /> : page === 'Reservations' ? <ReservationPage /> : page === 'Charging & billing' ? <ChargingPage /> : page === 'Queue' ? <QueuePage /> : page === 'Analytics' ? <Analytics /> : <Audit />}<footer>VOLTWAY NETWORK OS <span /> BUILT FOR SMARTER MOBILITY <Leaf size={13}/>
  </footer>
  </div>
  </main>
  <Modal />
  {toast && <div className="toast">
    <Check size={16}/>
    {toast}<button onClick={() => setToast('')}>
    <X size={14}/>
    </button>
    </div>}
  </div>;
}
export default App;

