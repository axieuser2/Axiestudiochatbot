// API configuration - all requests go through our secure proxy
const API_CONFIG = {
  // All chat requests are proxied through Vite's dev server to hide the actual webhook URL
  CHAT_ENDPOINT: '/api/chat',
  BOOKING_IFRAME_URL: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h'
};

export default API_CONFIG;