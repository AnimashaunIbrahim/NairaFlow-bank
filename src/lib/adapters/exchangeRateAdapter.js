/**
 * Exchange Rate Adapter
 * Transforms OpenExchangeRates API responses to our application's data structure
 */

export class ExchangeRateAdapter {
  /**
   * Transform latest rates response
   */
  static fromLatestResponse(response) {
    if (!response || !response.rates) {
      throw new Error('Invalid exchange rate response');
    }

    return {
      base: response.base || 'USD',
      rates: response.rates,
      timestamp: response.timestamp,
      lastUpdated: response.timestamp ? new Date(response.timestamp * 1000).toISOString() : new Date().toISOString(),
      disclaimer: response.disclaimer,
      license: response.license,
    };
  }

  /**
   * Transform rates to our app format (with NGN as base where applicable)
   */
  static toAppFormat(ratesData, baseCurrency = 'NGN') {
    const { rates, base } = ratesData;
    
    if (!rates) {
      return ratesData;
    }
    
    // Ensure only major currencies are included
    const majorCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'AED'];
    const filteredRates = {};
    
    Object.entries(rates).forEach(([currency, rate]) => {
      if (majorCurrencies.includes(currency)) {
        filteredRates[currency] = rate;
      }
    });
    
    // If base is already our desired base
    if (base === baseCurrency) {
      filteredRates[baseCurrency] = filteredRates[baseCurrency] !== undefined ? filteredRates[baseCurrency] : 1;
      return {
        ...ratesData,
        base: baseCurrency,
        rates: filteredRates,
      };
    }
    
    // Convert rates to desired base currency
    if (filteredRates[baseCurrency] !== undefined) {
      const baseRate = filteredRates[baseCurrency];
      const convertedRates = {};
      
      convertedRates[baseCurrency] = 1;
      
      Object.entries(filteredRates).forEach(([currency, rate]) => {
        if (currency !== baseCurrency) {
          convertedRates[currency] = rate / baseRate;
        }
      });
      
      return {
        ...ratesData,
        base: baseCurrency,
        rates: convertedRates,
      };
    }
    
    // If base currency not in rates, try to convert from USD if available
    if (base === 'USD' && filteredRates['USD']) {
      const baseRate = filteredRates['USD'];
      const convertedRates = {};
      convertedRates[baseCurrency] = baseRate !== undefined ? 1 / baseRate : 1; // This is inverted logic, better to handle
    }
    
    // Default: ensure NGN is present
    if (!filteredRates[baseCurrency]) {
      filteredRates[baseCurrency] = 1;
    }
    
    return {
      ...ratesData,
      base: baseCurrency,
      rates: filteredRates,
    };
  }

  /**
   * Convert amount between currencies
   */
  static convert(amount, fromCurrency, toCurrency, ratesData) {
    const { rates, base } = ratesData;
    
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Get rates relative to base
    let fromRate, toRate;
    
    if (base === fromCurrency) {
      fromRate = 1;
    } else if (rates[fromCurrency]) {
      fromRate = rates[fromCurrency];
    } else {
      throw new Error(`Currency ${fromCurrency} not supported`);
    }
    
    if (base === toCurrency) {
      toRate = 1;
    } else if (rates[toCurrency]) {
      toRate = rates[toCurrency];
    } else {
      throw new Error(`Currency ${toCurrency} not supported`);
    }
    
    // Convert: amount (from) -> base -> to
    const amountInBase = amount / fromRate;
    const convertedAmount = amountInBase * toRate;
    
    return convertedAmount;
  }

  /**
   * Get supported currencies
   */
  static getSupportedCurrencies(ratesData) {
    if (!ratesData || !ratesData.rates) {
      return ['NGN', 'USD', 'EUR', 'GBP', 'AED'];
    }
    const majorCurrencies = ['NGN', 'USD', 'EUR', 'GBP', 'AED'];
    const currencies = Object.keys(ratesData.rates).filter(c => majorCurrencies.includes(c));
    if (ratesData.base && majorCurrencies.includes(ratesData.base) && !currencies.includes(ratesData.base)) {
      currencies.push(ratesData.base);
    }
    return currencies.sort();
  }
}

export default ExchangeRateAdapter;
