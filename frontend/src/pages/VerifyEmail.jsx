// import React, { useEffect, useState } from 'react';
// import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// import { PublicLayout } from '../components/Layout/PublicLayout';
// import { Button } from '../components/Forms/Button';
// import { authApi } from '../api/auth.api';
// import { useAuthStore } from '../store/auth.store';

// export const VerifyEmail = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const [status, setStatus] = useState('verifying'); // verifying | success | error
//   const [message, setMessage] = useState('');
//   const token = searchParams.get('token');

//   useEffect(() => {
//     if (!token) {
//       setStatus('error');
//       setMessage('No verification token provided');
//       return;
//     }

//     const verify = async () => {
//       try {
//         await authApi.verifyEmail(token);
//         setStatus('success');
//         setMessage('Your email has been verified successfully!');

//         // ⬇️ Refetch user so the verification banner disappears
//         try {
//           const { loadUser } = useAuthStore.getState();
//           await loadUser();
//         } catch (err) {
//           // Silent
//         }
//       } catch (error) {
//         setStatus('error');
//         setMessage(
//           error.response?.data?.message ||
//           'Verification failed. The link may have expired.'
//         );
//       }
//     };

//     verify();
//   }, [token]);

//   return (
//     <PublicLayout>
//       <div className="text-center">
//         {status === 'verifying' && (
//           <>
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
//             <h2 className="text-xl font-semibold text-gray-900">
//               Verifying your email...
//             </h2>
//             <p className="text-gray-600 mt-2">Please wait a moment</p>
//           </>
//         )}

//         {status === 'success' && (
//           <>
//             <div className="text-6xl mb-4">✅</div>
//             <h2 className="text-2xl font-bold text-gray-900 mb-2">
//               Email Verified!
//             </h2>
//             <p className="text-gray-600 mb-6">{message}</p>
//             <Button onClick={() => navigate('/dashboard')}>
//               Go to Dashboard
//             </Button>
//           </>
//         )}

//         {status === 'error' && (
//           <>
//             <div className="text-6xl mb-4">❌</div>
//             <h2 className="text-2xl font-bold text-gray-900 mb-2">
//               Verification Failed
//             </h2>
//             <p className="text-gray-600 mb-6">{message}</p>
//             <div className="space-y-3">
//               <Button onClick={() => navigate('/login')}>
//                 Back to Login
//               </Button>
//               <p className="text-sm text-gray-500">
//                 Need a new link?{' '}
//                 <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
//                   Login and request another
//                 </Link>
//               </p>
//             </div>
//           </>
//         )}
//       </div>
//     </PublicLayout>
//   );
// };

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { Button } from '../components/Forms/Button';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);
  const token = searchParams.get('token');

  useEffect(() => {
    // Prevent double-verification in React StrictMode
    if (hasVerified.current) return;
    hasVerified.current = true;

    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    const verify = async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus('success');
        setMessage('Your email has been verified successfully!');

        // Only refetch user if they are already logged in
        const { isAuthenticated, loadUser } = useAuthStore.getState();
        if (isAuthenticated) {
          try {
            await loadUser();
          } catch (err) {
            // Silent — user can still log in next time
          }
        }
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.message ||
            'Verification failed. The link may have expired.'
        );
      }
    };

    verify();
  }, [token]);

  return (
    <PublicLayout>
      <div className="text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">
              Verifying your email...
            </h2>
            <p className="text-gray-600 mt-2">Please wait a moment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button onClick={() => navigate('/login')}>
              Continue to Login
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')}>
                Back to Login
              </Button>
              <p className="text-sm text-gray-500">
                Need a new link?{' '}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
                  Login and request another
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
};