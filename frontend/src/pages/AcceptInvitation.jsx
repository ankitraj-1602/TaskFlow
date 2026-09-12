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

  const [status, setStatus] = useState('loading'); // loading | loaded | error
  const [invitation, setInvitation] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [accepting, setAccepting] = useState(false);

  const hasFetched = useRef(false);

  // Step 1: Fetch invitation details (public)
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchDetails = async () => {
      try {
        const details = await invitationApi.getDetails(token);
        setInvitation(details);
        setStatus('loaded');
      } catch (err) {
        setErrorMessage(
          err.response?.data?.message ||
          'This invitation is invalid, expired, or has already been used.'
        );
        setStatus('error');
      }
    };

    if (!token) {
      setErrorMessage('No invitation token provided');
      setStatus('error');
      return;
    }

    fetchDetails();
  }, [token]);

  // Step 2: Accept invitation (requires auth)
  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Preserve token and send user to login
      localStorage.setItem('pendingInvitation', token);
      toast('Please sign in to accept the invitation', { icon: '🔐' });
      navigate('/login');
      return;
    }

    // Check email match
    if (user?.email !== invitation?.email) {
      toast.error(
        `This invitation is for ${invitation.email}, but you're signed in as ${user.email}.`
      );
      return;
    }

    setAccepting(true);
    try {
      await invitationApi.accept(token);
      await loadWorkspaces();
      localStorage.removeItem('pendingInvitation');
      toast.success('Invitation accepted!');
      navigate('/workspaces');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  // Step 3: Handle sign-up redirect (preserve token)
  const handleSignUp = () => {
    localStorage.setItem('pendingInvitation', token);
    navigate('/register');
  };

  const handleSignIn = () => {
    localStorage.setItem('pendingInvitation', token);
    navigate('/login');
  };

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    toast.success('Signed out. Please sign in with the correct email.');
  };

  // ─── Loading ──────────────────────────────────
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

  // ─── Error state ──────────────────────────────
  if (status === 'error') {
    return (
      <PublicLayout>
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Invitation
          </h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="space-y-3">
            <Link to="/login">
              <Button fullWidth>Go to Login</Button>
            </Link>
            <Link
              to="/"
              className="block text-sm text-gray-500 hover:text-gray-700"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // ─── Loaded state ─────────────────────────────
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

        {/* Invitation details card */}
        <div className="bg-indigo-50 rounded-lg p-6 mb-6 text-left">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase">Workspace</p>
              <p className="text-lg font-semibold text-gray-900">
                {invitation.workspaceName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Your Role</p>
              <p className="text-lg font-semibold text-gray-900">
                {invitation.role}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Invited Email</p>
              <p className="text-sm text-gray-700">{invitation.email}</p>
            </div>
          </div>
        </div>

        {/* ─── CASE 1: Not logged in ────────────── */}
        {!isAuthenticated && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Sign in or create an account to accept this invitation.
            </p>
            <Button fullWidth onClick={handleSignIn}>
              Sign in to accept
            </Button>
            <Button variant="secondary" fullWidth onClick={handleSignUp}>
              Create a new account
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Your invitation will be preserved.
            </p>
          </div>
        )}

        {/* ─── CASE 2: Logged in, but wrong email ─ */}
        {isAuthenticated && !emailMatches && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <p className="text-sm text-yellow-800">
                <strong>Email mismatch:</strong>
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                You're signed in as <strong>{user.email}</strong>, but this
                invitation is for <strong>{invitation.email}</strong>.
              </p>
            </div>
            <Button fullWidth variant="secondary" onClick={handleLogout}>
              Sign out and try again
            </Button>
          </div>
        )}

        {/* ─── CASE 3: Logged in and email matches ─ */}
        {isAuthenticated && emailMatches && (
          <div className="space-y-3">
            <Button
              fullWidth
              onClick={handleAccept}
              loading={accepting}
            >
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