import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import { getStations } from '../services/stationService';
import { createBooking } from '../services/bookingService';
import WizardStepper from '../components/wizard/WizardStepper';
import WizardStep1Station from '../components/wizard/WizardStep1Station';
import WizardStep2Vehicle from '../components/wizard/WizardStep2Vehicle';
import WizardStep3Details from '../components/wizard/WizardStep3Details';
import WizardStep4Payment from '../components/wizard/WizardStep4Payment';
import WizardMapPanel from '../components/wizard/WizardMapPanel';
import BookingSuccessPage from '../components/wizard/BookingSuccessPage';

const STEPS = [
  { label: 'Station', desc: 'Choose charging station', icon: 'fa-charging-station' },
  { label: 'Vehicle', desc: 'Select EV type', icon: 'fa-car' },
  { label: 'Details & Slot', desc: 'Enter details', icon: 'fa-clipboard-list' },
  { label: 'Payment', desc: 'Complete booking', icon: 'fa-credit-card' }
];

export default function StationBookingPage() {
  const { user } = useAuth();
  const { toast, addNotif, showProc, hideProc } = useNotif();
  const navigate = useNavigate();
  const location = useLocation();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(location.state?.station || null);
  const [vehicleType, setVehicleType] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [userPos, setUserPos] = useState([9.9250, 78.1150]);
  const [isComplete, setIsComplete] = useState(false);

  // Auth check
  useEffect(() => {
    if (!user) {
      toast('Please sign in to book', 'err');
      navigate('/login');
    }
  }, [user, toast, navigate]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => {} // fallback to default
      );
    }
  }, []);

  // Load stations
  useEffect(() => {
    setLoading(true);
    getStations()
      .then(r => {
        setStations(r.data.stations || []);
        setLoading(false);
      })
      .catch(() => {
        toast('Failed to load stations', 'err');
        setLoading(false);
      });
  }, [toast]);

  // If station was passed via navigation state, skip to step 2
  useEffect(() => {
    if (location.state?.station && currentStep === 1) {
      setSelectedStation(location.state.station);
      setCurrentStep(2);
    }
  }, [location.state]);

  // Step 1: Select station
  const handleSelectStation = useCallback((station) => {
    setSelectedStation(station);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Step 2: Select vehicle type
  const handleSelectVehicle = useCallback((type) => {
    setVehicleType(type);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Step 3: Submit details
  const handleDetailsSubmit = useCallback((details) => {
    setBookingDetails(details);
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Step 4: Payment & booking creation
  const handlePayment = useCallback(async (paymentInfo) => {
    showProc('Creating your booking...');
    try {
      const payload = {
        stationId: selectedStation.stationId,
        stationName: selectedStation.name,
        vehicleType,
        vehicleBrand: bookingDetails.vehicleBrand,
        vehicleModel: bookingDetails.vehicleModel,
        vehicleNumberPlate: bookingDetails.vehicleNumberPlate,
        currentBatteryPercent: bookingDetails.currentBatteryPercent,
        targetBatteryPercent: bookingDetails.targetBatteryPercent,
        connectorType: bookingDetails.connectorType,
        slot: bookingDetails.slot,
        date: bookingDetails.date,
        time: bookingDetails.time,
        duration: bookingDetails.duration,
        chargerType: bookingDetails.chargerType,
        energy: paymentInfo.pricing.energyNum,
        basePrice: paymentInfo.pricing.baseNum,
        gst: paymentInfo.pricing.gstNum,
        totalAmount: paymentInfo.pricing.totalNum,
        userName: user?.name || '',
        userMobile: bookingDetails.phone || user?.phone || '',
        userEmail: user?.email || '',
        paymentMethod: paymentInfo.paymentMethod
      };

      const res = await createBooking(payload);
      hideProc();

      setBookingResult(res.data.booking);
      setIsComplete(true);
      addNotif(`Booking confirmed: ${res.data.booking.bookingId}`, 'fa-check-circle');
      toast('Booking confirmed successfully!', 'ok');

      // Refresh stations
      getStations().then(r => setStations(r.data.stations || [])).catch(() => {});
    } catch (err) {
      hideProc();
      toast(err.response?.data?.message || 'Booking failed. Please try again.', 'err');
    }
  }, [selectedStation, vehicleType, bookingDetails, user, showProc, hideProc, addNotif, toast]);

  // Reset wizard for new booking
  const handleNewBooking = useCallback(() => {
    setCurrentStep(1);
    setSelectedStation(null);
    setVehicleType(null);
    setBookingDetails(null);
    setBookingResult(null);
    setIsComplete(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Back handlers
  const goBack = useCallback((step) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Completed state — show success page
  if (isComplete && bookingResult) {
    return (
      <div className="pg">
        <div className="ctn">
          <BookingSuccessPage
            booking={bookingResult}
            station={selectedStation}
            userPos={userPos}
            onNewBooking={handleNewBooking}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pg">
      <div className="ctn">
        {/* Page Header */}
        <div className="wz-page-header">
          <button className="sbpage-back" onClick={() => navigate('/stations')}>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="wz-page-title">Book Charging Station</h2>
            <p className="wz-page-subtitle">Complete the steps below to reserve your charging slot</p>
          </div>
        </div>

        {/* Mobile Stepper (horizontal) */}
        <div className="wz-mobile-stepper">
          {STEPS.map((s, i) => (
            <div key={i} className={`wz-mob-step ${i + 1 < currentStep ? 'completed' : i + 1 === currentStep ? 'active' : ''}`}>
              <div className="wz-mob-step-circle">
                {i + 1 < currentStep ? <i className="fa-solid fa-check"></i> : <span>{i + 1}</span>}
              </div>
              <span className="wz-mob-step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* 3-Panel Layout */}
        <div className="wz-layout">
          {/* LEFT: Vertical Stepper */}
          <div className="wz-layout-stepper">
            <WizardStepper currentStep={currentStep} steps={STEPS} />
          </div>

          {/* CENTER: Step Content */}
          <div className="wz-layout-content">
            {currentStep === 1 && (
              <WizardStep1Station
                stations={stations}
                loading={loading}
                onSelect={handleSelectStation}
              />
            )}
            {currentStep === 2 && (
              <WizardStep2Vehicle
                selectedStation={selectedStation}
                onSelect={handleSelectVehicle}
                onBack={() => goBack(1)}
              />
            )}
            {currentStep === 3 && (
              <WizardStep3Details
                selectedStation={selectedStation}
                vehicleType={vehicleType}
                onSubmit={handleDetailsSubmit}
                onBack={() => goBack(2)}
              />
            )}
            {currentStep === 4 && (
              <WizardStep4Payment
                selectedStation={selectedStation}
                vehicleType={vehicleType}
                bookingDetails={bookingDetails}
                onPay={handlePayment}
                onBack={() => goBack(3)}
              />
            )}
          </div>

          {/* RIGHT: Map Panel */}
          <div className="wz-layout-map">
            <WizardMapPanel
              stations={stations}
              selectedStation={selectedStation}
              userPos={userPos}
              currentStep={currentStep}
              bookingResult={bookingResult}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
