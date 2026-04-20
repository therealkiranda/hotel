// ============================================================
// src/context/BookingContext.jsx — Booking State
// ============================================================
import { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

const INITIAL_STATE = {
  check_in_date: '',
  check_out_date: '',
  adults: 1,
  children: 0,
  room_category_id: null,
  room_id: null,
  room_name: '',
  room_rate: 0,
  nights: 0,
  subtotal: 0,
  taxes: 0,
  total: 0,
  promo_code: '',
  discount: 0,
  guest_info: {
    first_name: '', last_name: '', email: '', phone: '',
    nationality: '', special_requests: '',
  },
  payment_method: 'cash',
};

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(INITIAL_STATE);
  const [availability, setAvailability] = useState(null);

  const updateBooking = (updates) => setBooking(prev => ({ ...prev, ...updates }));
  const updateGuestInfo = (updates) => setBooking(prev => ({
    ...prev, guest_info: { ...prev.guest_info, ...updates }
  }));
  const resetBooking = () => { setBooking(INITIAL_STATE); setAvailability(null); };

  return (
    <BookingContext.Provider value={{ booking, availability, setAvailability, updateBooking, updateGuestInfo, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
};
