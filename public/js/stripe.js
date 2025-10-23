/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// Wait for Stripe to be loaded
const getStripe = () => {
  if (window.Stripe) {
    return window.Stripe(
      'pk_test_51S5mQHJXU6WmT8UTTxOyo2uiP8F674ZnkzW7Y1WL429o2GvsFJHRXmlAIGURBknsBCdcoiYeziZDDXF8P5YvG5mu00df65CFgn'
    );
  }
  return null;
};

export const bookTour = async (tourID) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);


    // 2) Create checkout form + charge credit card
    const stripe = getStripe();
    if (stripe) {
      await stripe.redirectToCheckout({
        sessionId: session.data.session.id
      });
    } else {
      showAlert('error', 'Stripe is not loaded. Please refresh the page.');
    }
  } catch (err) {
    showAlert('error', err);
  }
};


