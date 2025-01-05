// src/services/paymentService.js
const config = require('../config/config');
const logger = require('../config/logger');

// Lazy load stripe to avoid issues if key is not set
let stripe;

const getStripe = () => {
  if (!stripe) {
    if (!config.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key is not set');
    }
    stripe = require('stripe')(config.STRIPE_SECRET_KEY);
  }
  return stripe;
};

/**
 * Process payment
 * @param {Object} options - Payment options
 */
exports.processPayment = async (options) => {
  try {
    const { amount, paymentMethod, cardDetails, description, metadata } = options;
    
    // In development, return mock payment if no Stripe key
    if (process.env.NODE_ENV === 'development' && !config.STRIPE_SECRET_KEY) {
      logger.warn('Using mock payment processing (Stripe key not set)');
      return {
        success: true,
        transactionId: `mock_${Date.now()}`,
        status: 'succeeded'
      };
    }
    
    const stripeInstance = getStripe();
    
    // Create payment intent
    if (cardDetails && !paymentMethod.startsWith('pm_')) {
      // Create payment method with card details
      const paymentMethodObj = await stripeInstance.paymentMethods.create({
        type: 'card',
        card: {
          number: cardDetails.number,
          exp_month: cardDetails.expiryMonth,
          exp_year: cardDetails.expiryYear,
          cvc: cardDetails.cvc
        }
      });
      
      // Create payment intent
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100), // convert to cents
        currency: 'usd',
        payment_method: paymentMethodObj.id,
        description,
        metadata,
        confirm: true
      });
      
      return {
        success: true,
        transactionId: paymentIntent.id,
        status: paymentIntent.status
      };
    } else {
      // Use existing payment method
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100), // convert to cents
        currency: 'usd',
        payment_method: paymentMethod,
        description,
        metadata,
        confirm: true
      });
      
      return {
        success: true,
        transactionId: paymentIntent.id,
        status: paymentIntent.status
      };
    }
  } catch (error) {
    logger.error(`Payment processing error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};