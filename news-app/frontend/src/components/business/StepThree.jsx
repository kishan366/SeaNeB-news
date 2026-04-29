import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';
import api from '@/lib/apiconfig';

const StepThree = ({
  formData,
  setFormData,
  citySearch,
  setCitySearch,
  stateName,
  setStateName,
  onNext,
  onBack,
  handleCancelOnboarding,
  t,
  showNotification
}) => {
  const [fieldErrors, setFieldErrors] = useState({});
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [fetchingCities, setFetchingCities] = useState(false);
  
  const cityRef = useRef(null);

  // Click outside to close city suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // City Autocomplete
  useEffect(() => {
    const fetchCitySuggestions = async () => {
      if (!citySearch || citySearch.length < 2) {
        setCitySuggestions([]);
        return;
      }
      setFetchingCities(true);
      try {
        const data = await api.location.getCities(citySearch);
        if (data && data.success && data.cities) {
          setCitySuggestions(data.cities);
        }
      } catch (error) {
        console.error('City autocomplete error:', error);
      } finally {
        setFetchingCities(false);
      }
    };
    const timeoutId = setTimeout(fetchCitySuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [citySearch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectCity = (city) => {
    setFormData(prev => ({ ...prev, place_id: city.place_id }));
    setCitySearch(city.city_name);
    setStateName(city.state_name || '');
    setShowCitySuggestions(false);
    if (fieldErrors.place_id) {
      setFieldErrors(prev => ({ ...prev, place_id: false }));
    }
  };

  const validateAndNext = () => {
    const errors = {};
    if (!citySearch || citySearch.trim() === '') {
      errors.place_id = true;
      setFieldErrors(errors);
      showNotification('Search City is required', 'warning');
      return;
    }
    if (!formData.place_id) {
      errors.place_id = true;
      setFieldErrors(errors);
      showNotification('Please select a city from the search list', 'warning');
      return;
    }
    setFieldErrors({});
    onNext();
  };

  return (
    <div className="space-y-4">
      {/* City Search */}
      <div className="relative" ref={cityRef}>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.searchCity || "Search City"} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            placeholder="Type city name (min. 2 characters)..."
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value);
              setShowCitySuggestions(true);
              if (formData.place_id) {
                setFormData(prev => ({ ...prev, place_id: '' }));
              }
              setStateName('');
              setFieldErrors(prev => ({ ...prev, place_id: true }));
            }}
            className={`w-full p-3 pl-10 rounded-2xl bg-slate-50 border text-sm outline-none ${fieldErrors.place_id ? 'border-red-500' : 'border-slate-200 focus:border-blue-500 focus:bg-white'}`}
          />
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          {fieldErrors.place_id && (
            <p className="text-red-500 text-xs mt-1">Please select a city from the list</p>
          )}
          {fetchingCities && (
            <div className="absolute right-4 top-3">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        {showCitySuggestions && citySuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-40 overflow-y-auto">
            {citySuggestions.map((city, i) => (
              <div
                key={i}
                onClick={() => handleSelectCity(city)}
                className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-3 border-b last:border-b-0"
              >
                <MapPin size={16} className="text-slate-400 mt-1 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-slate-900">{city.city_name}</p>
                  <p className="text-[10px] text-slate-500">{city.state_name}, {city.country_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* State & Country */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">{t?.state || "State"}</label>
          <input
            value={stateName} // extracted to parent since review step needs it
            disabled
            placeholder="State"
            className="w-full p-3 rounded-2xl bg-gray-100 border border-slate-200 text-sm outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">{t?.country || "Country"}</label>
          <input
            value="India"
            disabled
            placeholder="Country"
            className="w-full p-3 rounded-2xl bg-gray-100 border border-slate-200 text-sm outline-none"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.businessAddress || "Business Address"}
        </label>
        <textarea
          name="address"
          placeholder="Street, building, area..."
          onChange={handleChange}
          value={formData.address}
          rows="2"
          className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all resize-none"
        />
      </div>

      {/* Landmark */}
      <div>
        <label className="text-xs font-semibold text-slate-700 mb-1 block">
          {t?.landmark || "Landmark"}
        </label>
        <input
          name="landmark"
          placeholder="Near..."
          onChange={handleChange}
          value={formData.landmark}
          className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          className="flex-1 py-3 rounded-2xl"
        >
          ← Back
        </Button>
        <Button
          type="button"
          onClick={validateAndNext}
          variant="primary"
          className="flex-1 py-3 rounded-2xl"
        >
          Continue →
        </Button>
      </div>
      <button
        type="button"
        onClick={handleCancelOnboarding}
        className="w-full py-2 text-[11px] font-bold text-slate-300 hover:text-slate-500 transition-colors"
      >
        Cancel Registration
      </button>
    </div>
  );
};
export default StepThree;
