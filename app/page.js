'use client';

import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FloatingActionButton from './components/FloatingActionButton';
import ManageHousesModal from './components/ManageHousesModal';

export default function Home() {
  const [formData, setFormData] = useState({
    houseNumber: '',
    date: '',
    milkQty: '',
    milkAmount: '',
    cowMilk: '',
    cowMilkAmount: '',
    other: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [houseNumbers, setHouseNumbers] = useState([]);
  const [selectedHouseData, setSelectedHouseData] = useState(null);
  const [showManageHouses, setShowManageHouses] = useState(false);
  const [managedHouses, setManagedHouses] = useState([]);
  const [editingHouse, setEditingHouse] = useState(null);
  const [houseForm, setHouseForm] = useState({
    house_no: '',
    milk_rate: '',
    cow_milk_rate: ''
  });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchHouseNumbers();
    // Load house number from localStorage on component mount
    const savedHouseNumber = localStorage.getItem('selectedHouseNumber');
    if (savedHouseNumber) {
      setFormData(prev => ({
        ...prev,
        houseNumber: savedHouseNumber
      }));
    }
  }, []);

  // Update selectedHouseData when houseNumbers are loaded and we have a saved house number
  useEffect(() => {
    if (houseNumbers.length > 0 && formData.houseNumber) {
      const selectedHouse = houseNumbers.find(house => house.house_no === formData.houseNumber);
      if (selectedHouse) {
        setSelectedHouseData(selectedHouse);
      }
    }
  }, [houseNumbers, formData.houseNumber]);

  const fetchHouseNumbers = async () => {
    try {
      const response = await fetch('/api/house-numbers');
      const data = await response.json();
      
      if (response.ok) {
        setHouseNumbers(data.houseNumbers);
      } else {
        console.error('Error fetching house numbers:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch house numbers:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let updatedFormData = {
      ...formData,
      [name]: value
    };

    // If house number is selected, find and console log the house data
    if (name === 'houseNumber' && value) {
      const selectedHouse = houseNumbers.find(house => house.house_no === value);
      if (selectedHouse) {
        setSelectedHouseData(selectedHouse);
        // Save house number to localStorage
        localStorage.setItem('selectedHouseNumber', value);
        // Recalculate amounts if quantities exist
        if (formData.milkQty) {
          updatedFormData.milkAmount = (parseFloat(formData.milkQty) * parseFloat(selectedHouse.milk_rate)).toFixed(2);
        }
        if (formData.cowMilk) {
          updatedFormData.cowMilkAmount = (parseFloat(formData.cowMilk) * parseFloat(selectedHouse.cow_milk_rate)).toFixed(2);
        }
      }
    }

    // FORWARD CALCULATION: Quantity → Amount
    // If milk quantity is changed and house is selected, calculate milk amount
    if (name === 'milkQty' && selectedHouseData && value) {
      const quantity = parseFloat(value);
      const rate = parseFloat(selectedHouseData.milk_rate);
      if (!isNaN(quantity) && !isNaN(rate)) {
        updatedFormData.milkAmount = (quantity * rate).toFixed(2);
      }
    }

    // If cow milk quantity is changed and house is selected, calculate cow milk amount
    if (name === 'cowMilk' && selectedHouseData && value) {
      const quantity = parseFloat(value);
      const rate = parseFloat(selectedHouseData.cow_milk_rate);
      if (!isNaN(quantity) && !isNaN(rate)) {
        updatedFormData.cowMilkAmount = (quantity * rate).toFixed(2);
      }
    }

    // REVERSE CALCULATION: Amount → Quantity
    // If milk amount is changed and house is selected, calculate milk quantity
    if (name === 'milkAmount' && selectedHouseData && value) {
      const amount = parseFloat(value);
      const rate = parseFloat(selectedHouseData.milk_rate);
      if (!isNaN(amount) && !isNaN(rate) && rate > 0) {
        updatedFormData.milkQty = (amount / rate).toFixed(2);
      }
    }

    // If cow milk amount is changed and house is selected, calculate cow milk quantity
    if (name === 'cowMilkAmount' && selectedHouseData && value) {
      const amount = parseFloat(value);
      const rate = parseFloat(selectedHouseData.cow_milk_rate);
      if (!isNaN(amount) && !isNaN(rate) && rate > 0) {
        updatedFormData.cowMilk = (amount / rate).toFixed(2);
      }
    }

    // Clear corresponding field if input is cleared
    if (name === 'milkQty' && !value) {
      updatedFormData.milkAmount = '';
    }
    if (name === 'cowMilk' && !value) {
      updatedFormData.cowMilkAmount = '';
    }
    if (name === 'milkAmount' && !value) {
      updatedFormData.milkQty = '';
    }
    if (name === 'cowMilkAmount' && !value) {
      updatedFormData.cowMilk = '';
    }

    setFormData(updatedFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that house is selected for amount calculation
    if (!selectedHouseData) {
      setMessage('Please select a house number first');
      return;
    }

    // Auto-calculate amounts if not already calculated
    let finalFormData = { ...formData };
    
    if (formData.milkQty && !formData.milkAmount) {
      finalFormData.milkAmount = (parseFloat(formData.milkQty) * parseFloat(selectedHouseData.milk_rate)).toFixed(2);
    }
    
    if (formData.cowMilk && !formData.cowMilkAmount) {
      finalFormData.cowMilkAmount = (parseFloat(formData.cowMilk) * parseFloat(selectedHouseData.cow_milk_rate)).toFixed(2);
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/dairy-bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage('Data submitted successfully!');
        toast.success('Data submitted successfully!', { position: 'top-right' });
        handleReset();
      } else {
        setMessage(`Error: ${result.error}`);
        toast.error(`Error: ${result.error}`, { position: 'top-right' });
      }
    } catch (error) {
      setMessage('Failed to submit data. Please try again.');
      toast.error('Failed to submit data. Please try again.', { position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(prev => ({
      houseNumber: prev.houseNumber, // Preserve house number
      date: '',
      milkQty: '',
      milkAmount: '',
      cowMilk: '',
      cowMilkAmount: '',
      other: ''
    }));
    // Don't reset selectedHouseData to keep the house selection
    setMessage('');
  };

  // Navigation functions for house numbers
  const getCurrentHouseIndex = () => {
    return houseNumbers.findIndex(house => house.house_no === formData.houseNumber);
  };

  const handlePreviousHouse = () => {
    const currentIndex = getCurrentHouseIndex();
    if (currentIndex > 0) {
      const previousHouse = houseNumbers[currentIndex - 1];
      const fakeEvent = {
        target: {
          name: 'houseNumber',
          value: previousHouse.house_no
        }
      };
      handleInputChange(fakeEvent);
    }
  };

  const handleNextHouse = () => {
    const currentIndex = getCurrentHouseIndex();
    if (currentIndex < houseNumbers.length - 1) {
      const nextHouse = houseNumbers[currentIndex + 1];
      const fakeEvent = {
        target: {
          name: 'houseNumber',
          value: nextHouse.house_no
        }
      };
      handleInputChange(fakeEvent);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Dairy Bills Form
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* House Number Dropdown with Navigation */}
          <div>
            <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mb-1">
              House Number
            </label>
            <div className="flex gap-2">
              {/* Previous Button */}
              <button
                type="button"
                onClick={handlePreviousHouse}
                disabled={getCurrentHouseIndex() <= 0 || houseNumbers.length === 0}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous House"
              >
                ←
              </button>
              
              {/* Dropdown */}
              <select
                id="houseNumber"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a house number</option>
                {houseNumbers.map((house) => (
                  <option key={house.id} value={house.house_no}>
                    {house.house_no}
                  </option>
                ))}
              </select>
              
              {/* Next Button */}
              <button
                type="button"
                onClick={handleNextHouse}
                disabled={getCurrentHouseIndex() >= houseNumbers.length - 1 || getCurrentHouseIndex() === -1}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next House"
              >
                →
              </button>
            </div>
            
            {/* House Rate Display */}
            {selectedHouseData && (
              <div className="mt-2 text-xs text-gray-600">
                <p>Milk Rate: ₹{selectedHouseData.milk_rate} | Cow Milk Rate: ₹{selectedHouseData.cow_milk_rate}</p>
                <p className="text-xs text-gray-500">
                  House {getCurrentHouseIndex() + 1} of {houseNumbers.length}
                </p>
              </div>
            )}
          </div>

          {/* Date Input */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Milk Quantity and Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="milkQty" className="block text-sm font-medium text-gray-700 mb-1">
                Milk Qty (L)
              </label>
              <input
                type="number"
                id="milkQty"
                name="milkQty"
                value={formData.milkQty}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Milk qty"
              />
            </div>
            <div>
              <label htmlFor="milkAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Milk Amount (₹)
              </label>
              <input
                type="number"
                id="milkAmount"
                name="milkAmount"
                value={formData.milkAmount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Milk amount"
              />
            </div>
          </div>

          {/* Cow Milk Quantity and Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cowMilk" className="block text-sm font-medium text-gray-700 mb-1">
                Cow Milk (L)
              </label>
              <input
                type="number"
                id="cowMilk"
                name="cowMilk"
                value={formData.cowMilk}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Cow milk"
              />
            </div>
            <div>
              <label htmlFor="cowMilkAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Cow Milk Amount (₹)
              </label>
              <input
                type="number"
                id="cowMilkAmount"
                name="cowMilkAmount"
                value={formData.cowMilkAmount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Cow milk amount"
              />
            </div>
          </div>

          {/* Other Input */}
          <div>
            <label htmlFor="other" className="block text-sm font-medium text-gray-700 mb-1">
              Other
            </label>
            <input
              type="number"
              id="other"
              name="other"
              value={formData.other}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter other amount"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes('successfully') 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}

      </div>

      {/* Floating Action Button for Manage Houses */}
      <FloatingActionButton onClick={() => setShowManageHouses(true)} />

      {/* Manage Houses Modal */}
      <ManageHousesModal show={showManageHouses} onClose={() => setShowManageHouses(false)} fetchHouseNumbers={fetchHouseNumbers} />
    </div>
  );
}
