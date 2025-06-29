// ManageHousesModal.js
'use client';
import { useState, useEffect } from 'react';

export default function ManageHousesModal({ show, onClose, fetchHouseNumbers }) {
  const [managedHouses, setManagedHouses] = useState([]);
  const [editingHouse, setEditingHouse] = useState(null);
  const [houseForm, setHouseForm] = useState({
    house_no: '',
    milk_rate: '',
    cow_milk_rate: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (show) fetchManagedHouses();
  }, [show]);

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
    setHouseForm(prev => ({ ...prev, [name]: value }));
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
        if (fetchHouseNumbers) await fetchHouseNumbers();
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
        body: JSON.stringify({ id: editingHouse, ...houseForm })
      });
      if (response.ok) {
        await fetchManagedHouses();
        if (fetchHouseNumbers) await fetchHouseNumbers();
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
        const response = await fetch(`/api/house-manage?id=${id}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchManagedHouses();
          if (fetchHouseNumbers) await fetchHouseNumbers();
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

  if (!show) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Manage Houses</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                <label htmlFor="house_no" className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
                <input type="text" id="house_no" name="house_no" value={houseForm.house_no} onChange={handleHouseFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter house number" />
              </div>
              <div>
                <label htmlFor="milk_rate" className="block text-sm font-medium text-gray-700 mb-1">Milk Rate (₹)</label>
                <input type="number" id="milk_rate" name="milk_rate" value={houseForm.milk_rate} onChange={handleHouseFormChange} step="0.01" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter milk rate" />
              </div>
              <div>
                <label htmlFor="cow_milk_rate" className="block text-sm font-medium text-gray-700 mb-1">Cow Milk Rate (₹)</label>
                <input type="number" id="cow_milk_rate" name="cow_milk_rate" value={houseForm.cow_milk_rate} onChange={handleHouseFormChange} step="0.01" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter cow milk rate" />
              </div>
              <div className="md:col-span-3">
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                    {editingHouse ? 'Update House' : 'Create House'}
                  </button>
                  {editingHouse && (
                    <button type="button" onClick={() => { setEditingHouse(null); setHouseForm({ house_no: '', milk_rate: '', cow_milk_rate: '' }); }} className="px-6 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
          {/* Managed Houses List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Existing Houses ({managedHouses.length})</h3>
            {managedHouses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm16 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v0" />
                </svg>
                <p>No houses found. Add your first house using the form above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">House Number</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Milk Rate (₹)</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">Cow Milk Rate (₹)</th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managedHouses.map((house) => (
                      <tr key={house.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900">{house.house_no}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">₹{house.milk_rate}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">₹{house.cow_milk_rate}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => handleEditHouse(house)} className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors" title="Edit House">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDeleteHouse(house.id)} className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors" title="Delete House">
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
      </div>
    </div>
  );
}
