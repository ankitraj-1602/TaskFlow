import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { Button } from '../components/Forms/Button';
import { invitationApi } from '../api/invitation.api';
import { useAuthStore } from '../store/auth.store';
import { useWorkspaceStore } from '../store/workspace.store';

export const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { loadWorkspaces } = useWorkspaceStore();
  const [status, setStatus] = useState('loading');
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchDetails = async () => {
      try {
        const details = await invitationApi.getDetails(token);
        setInvitation(details);
        setStatus('loaded');
      } catch (err) {
        setError(err.response?.data?.message || 'Invitation not found');
        setStatus('error');
      }
    };

    fetchDetails();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Save token and redirect to login
      localStorage.setItem('pendingInvitation', token);
      navigate('/login');
      return;
    }

    // Check if logged-in user's email matches
    if (user?.email !== invitation?.email) {
      toast.error(`This invitation was sent to ${invitation.email}, but you're logged in as ${user.email}`);
      return;
    }

    try {
      await invitationApi.accept(token);
      await loadWorkspaces();
      toast.success('Invitation accepted!');
      navigate('/workspaces');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    }
  };

  if (status === 'loading') {
    return (
      <PublicLayout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </PublicLayout>
    );
  }

  if (status === 'error') {
    return (
      <PublicLayout>
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="text-indigo-600 hover:text-indigo-500">
            Go to homepage
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const emailMatches = user?.email === invitation.email;

  return (
    <PublicLayout>
      <div className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          You're Invited!
        </h2>
        <p className="text-gray-600 mb-6">
          <strong>{invitation.inviterName}</strong> has invited you to join
        </p>

        <div className="bg-indigo-50 rounded-lg p-6 mb-6 text-left">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase">Workspace</p>
              <p className="text-lg font-semibold text-gray-900">{invitation.workspaceName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Your Role</p>
              <p className="text-lg font-semibold text-gray-900">{invitation.role}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Invited Email</p>
              <p className="text-sm text-gray-700">{invitation.email}</p>
            </div>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Sign in or create an account to accept this invitation.
            </p>
            <Button fullWidth onClick={handleAccept}>
              Continue to Sign In
            </Button>
          </div>
        )}

        {isAuthenticated && !emailMatches && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              You're logged in as <strong>{user.email}</strong>. This invitation is for{' '}
              <strong>{invitation.email}</strong>.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Please log out and sign in with the correct email.
            </p>
          </div>
        )}

        {isAuthenticated && emailMatches && (
          <div className="space-y-3">
            <Button fullWidth onClick={handleAccept}>
              Accept Invitation
            </Button>
            <Link
              to="/dashboard"
              className="block text-sm text-gray-500 hover:text-gray-700"
            >
              Decline
            </Link>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};