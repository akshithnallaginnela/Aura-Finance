/**
 * Market Status Utility
 * Determines real-time open/closed status for Indian (NSE/BSE) and US markets.
 *
 * NSE/BSE: Mon–Fri 9:15 AM – 3:30 PM IST
 * NYSE/NASDAQ: Mon–Fri 9:30 AM – 4:00 PM ET (pre-market 4:00 AM, after-hours until 8:00 PM)
 */

export type MarketState = 'OPEN' | 'CLOSED' | 'PRE-MARKET' | 'AFTER-HOURS';

interface MarketStatus {
  state: MarketState;
  label: string;
  subLabel: string;
  isLive: boolean;
}

// Major Indian market holidays for 2026 (NSE)
// This list can be expanded yearly
const NSE_HOLIDAYS_2026 = [
  '2026-01-26', // Republic Day
  '2026-03-10', // Maha Shivaratri
  '2026-03-17', // Holi
  '2026-03-30', // Id-Ul-Fitr (Ramadan)
  '2026-04-02', // Ram Navami
  '2026-04-03', // Mahavir Jayanti
  '2026-04-14', // Dr. Ambedkar Jayanti
  '2026-04-18', // Good Friday
  '2026-05-01', // Maharashtra Day
  '2026-06-06', // Id-Ul-Zuha (Bakri Id)
  '2026-07-06', // Muharram
  '2026-08-15', // Independence Day
  '2026-08-19', // Janmashtami
  '2026-09-04', // Milad-un-Nabi
  '2026-10-02', // Mahatma Gandhi Jayanti
  '2026-10-20', // Dussehra
  '2026-11-09', // Diwali (Laxmi Pujan)
  '2026-11-10', // Diwali Balipratipada
  '2026-11-19', // Guru Nanak Jayanti
  '2026-12-25', // Christmas
];

function getISTTime(): Date {
  // Get current time in IST (UTC+5:30)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 60 * 60 * 1000);
}

function getETTime(): Date {
  // Get current time in US Eastern Time
  // This is a simplified approach — doesn't handle DST transitions perfectly
  // but is good enough for market status
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0';
  return new Date(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day')),
    parseInt(get('hour')),
    parseInt(get('minute')),
    parseInt(get('second'))
  );
}

function isNSEHoliday(dateIST: Date): boolean {
  const dateStr = `${dateIST.getFullYear()}-${String(dateIST.getMonth() + 1).padStart(2, '0')}-${String(dateIST.getDate()).padStart(2, '0')}`;
  return NSE_HOLIDAYS_2026.includes(dateStr);
}

export function getIndianMarketStatus(): MarketStatus {
  const ist = getISTTime();
  const day = ist.getDay(); // 0=Sun, 6=Sat
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const timeMinutes = hours * 60 + minutes; // Total minutes from midnight

  const OPEN_TIME = 9 * 60 + 15;   // 9:15 AM
  const CLOSE_TIME = 15 * 60 + 30; // 3:30 PM
  const PRE_OPEN = 9 * 60;         // 9:00 AM (pre-open session)

  // Weekend
  if (day === 0 || day === 6) {
    return {
      state: 'CLOSED',
      label: 'MARKET CLOSED',
      subLabel: day === 0 ? 'Opens Monday 9:15 AM' : 'Opens Monday 9:15 AM',
      isLive: false,
    };
  }

  // Holiday
  if (isNSEHoliday(ist)) {
    return {
      state: 'CLOSED',
      label: 'MARKET CLOSED',
      subLabel: 'Market Holiday',
      isLive: false,
    };
  }

  // Pre-open session
  if (timeMinutes >= PRE_OPEN && timeMinutes < OPEN_TIME) {
    return {
      state: 'PRE-MARKET',
      label: 'PRE-OPEN',
      subLabel: 'Session starts 9:15 AM',
      isLive: true,
    };
  }

  // Market open
  if (timeMinutes >= OPEN_TIME && timeMinutes < CLOSE_TIME) {
    return {
      state: 'OPEN',
      label: 'MARKET OPEN',
      subLabel: 'Live updating',
      isLive: true,
    };
  }

  // After hours (same day, after close)
  if (timeMinutes >= CLOSE_TIME && timeMinutes < CLOSE_TIME + 60) {
    return {
      state: 'AFTER-HOURS',
      label: 'AFTER HOURS',
      subLabel: 'Session ended 3:30 PM',
      isLive: false,
    };
  }

  // Outside trading hours
  return {
    state: 'CLOSED',
    label: 'MARKET CLOSED',
    subLabel: timeMinutes < PRE_OPEN ? 'Opens 9:15 AM IST' : 'Opens tomorrow 9:15 AM',
    isLive: false,
  };
}

export function getUSMarketStatus(): MarketStatus {
  const et = getETTime();
  const day = et.getDay();
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeMinutes = hours * 60 + minutes;

  const OPEN_TIME = 9 * 60 + 30;  // 9:30 AM
  const CLOSE_TIME = 16 * 60;     // 4:00 PM
  const PRE_MARKET = 4 * 60;      // 4:00 AM
  const AFTER_HOURS_END = 20 * 60; // 8:00 PM

  if (day === 0 || day === 6) {
    return {
      state: 'CLOSED',
      label: 'US CLOSED',
      subLabel: 'Opens Monday 9:30 AM ET',
      isLive: false,
    };
  }

  if (timeMinutes >= PRE_MARKET && timeMinutes < OPEN_TIME) {
    return { state: 'PRE-MARKET', label: 'US PRE-MARKET', subLabel: 'Opens 9:30 AM ET', isLive: true };
  }

  if (timeMinutes >= OPEN_TIME && timeMinutes < CLOSE_TIME) {
    return { state: 'OPEN', label: 'US OPEN', subLabel: 'Live updating', isLive: true };
  }

  if (timeMinutes >= CLOSE_TIME && timeMinutes < AFTER_HOURS_END) {
    return { state: 'AFTER-HOURS', label: 'US AFTER-HOURS', subLabel: 'Extended trading', isLive: true };
  }

  return { state: 'CLOSED', label: 'US CLOSED', subLabel: 'Opens 9:30 AM ET', isLive: false };
}
