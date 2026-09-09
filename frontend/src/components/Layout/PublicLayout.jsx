import React from 'react';
import { Link } from 'react-router-dom';

export const PublicLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link to="/">
            <h1 className="text-4xl font-bold text-indigo-600 mb-2">TaskFlow</h1>
          </Link>
          {title && (
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
};