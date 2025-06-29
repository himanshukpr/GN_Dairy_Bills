'use client';

import { useState, useEffect } from 'react';

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
        console.log('Restored House Data:', selectedHouse);
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
        console.log('Selected House Data:', selectedHouse);
        console.log('House Number:', selectedHouse.house_no);
        console.log('Milk Rate:', selectedHouse.milk_rate);
        console.log('Cow Milk Rate:', selectedHouse.cow_milk_rate);
        console.log('Date:', selectedHouse.date);
        
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
        handleReset();
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage('Failed to submit data. Please try again.');
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

  // House management functions
  const openManageHouses = async () => {
    setShowManageHouses(true);
    await fetchManagedHouses();
  };

  const closeManageHouses = () => {
    setShowManageHouses(false);
    setEditingHouse(null);
    setHouseForm({
      house_no: '',
      milk_rate: '',
      cow_milk_rate: ''
    });
  };

  const fetchManagedHouses = async () => {
    try {
      const response = await fetch('/api/house-manage');
      const data = await response.json();
      if (response.ok) {
        setManagedHouses(data.houseNumbers);
      }
    } catch (error) {
      console.error('Failed to fetch houses:', error);
    }
  };

  const handleHouseFormChange = (e) => {
    const { name, value } = e.target;
    setHouseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateHouse = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/house-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(houseForm)
      });

      if (response.ok) {
        await fetchManagedHouses();
        await fetchHouseNumbers(); // Refresh main dropdown
        setHouseForm({ house_no: '', milk_rate: '', cow_milk_rate: '' });
        setMessage('House created successfully!');
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Failed to create house');
    }
  };

  const handleEditHouse = (house) => {
    setEditingHouse(house.id);
    setHouseForm({
      house_no: house.house_no,
      milk_rate: house.milk_rate,
      cow_milk_rate: house.cow_milk_rate
    });
  };

  const handleUpdateHouse = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/house-manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingHouse,
          ...houseForm
        })
      });

      if (response.ok) {
        await fetchManagedHouses();
        await fetchHouseNumbers(); // Refresh main dropdown
        setEditingHouse(null);
        setHouseForm({ house_no: '', milk_rate: '', cow_milk_rate: '' });
        setMessage('House updated successfully!');
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Failed to update house');
    }
  };

  const handleDeleteHouse = async (id) => {
    if (confirm('Are you sure you want to delete this house?')) {
      try {
        const response = await fetch(`/api/house-manage?id=${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchManagedHouses();
          await fetchHouseNumbers(); // Refresh main dropdown
          setMessage('House deleted successfully!');
        } else {
          const error = await response.json();
          setMessage(`Error: ${error.error}`);
        }
      } catch (error) {
        setMessage('Failed to delete house');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
      <button
        onClick={openManageHouses}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 hover:scale-110 active:scale-95"
        title="Manage Houses"
      >
        <svg
          className="w-8 h-8 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm16 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v0M3 7h18M8 11v4M16 11v4"
          />
        </svg>
      </button>

      {/* House Management Modal */}
      {showManageHouses && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                Manage Houses
              </h2>
              <button
                onClick={closeManageHouses}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* House Management Form */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {editingHouse ? 'Edit House' : 'Add New House'}
                </h3>
                <form onSubmit={editingHouse ? handleUpdateHouse : handleCreateHouse} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="house_no" className="block text-sm font-medium text-gray-700 mb-1">
                      House Number
                    </label>
                    <input
                      type="text"
                      id="house_no"
                      name="house_no"
                      value={houseForm.house_no}
                      onChange={handleHouseFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter house number"
                    />
                  </div>
                  <div>
                    <label htmlFor="milk_rate" className="block text-sm font-medium text-gray-700 mb-1">
                      Milk Rate (₹)
                    </label>
                    <input
                      type="number"
                      id="milk_rate"
                      name="milk_rate"
                      value={houseForm.milk_rate}
                      onChange={handleHouseFormChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter milk rate"
                    />
                  </div>
                  <div>
                    <label htmlFor="cow_milk_rate" className="block text-sm font-medium text-gray-700 mb-1">
                      Cow Milk Rate (₹)
                    </label>
                    <input
                      type="number"
                      id="cow_milk_rate"
                      name="cow_milk_rate"
                      value={houseForm.cow_milk_rate}
                      onChange={handleHouseFormChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter cow milk rate"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        {editingHouse ? 'Update House' : 'Create House'}
                      </button>
                      {editingHouse && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHouse(null);
                            setHouseForm({ house_no: '', milk_rate: '', cow_milk_rate: '' });
                          }}
                          className="px-6 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Managed Houses List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Existing Houses ({managedHouses.length})
                </h3>
                {managedHouses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm16 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v0"
                      />
                    </svg>
                    <p>No houses found. Add your first house using the form above.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                            House Number
                          </th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Milk Rate (₹)
                          </th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Cow Milk Rate (₹)
                          </th>
                          <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {managedHouses.map((house) => (
                          <tr key={house.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900">
                              {house.house_no}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                              ₹{house.milk_rate}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                              ₹{house.cow_milk_rate}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleEditHouse(house)}
                                  className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                                  title="Edit House"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteHouse(house.id)}
                                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                  title="Delete House"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
