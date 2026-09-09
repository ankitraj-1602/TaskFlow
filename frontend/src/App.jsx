import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">TaskFlow</h1>
                <p className="text-gray-600">Production-style Project & Team Management</p>
                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <p className="text-green-700">🚀 Frontend is running!</p>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;