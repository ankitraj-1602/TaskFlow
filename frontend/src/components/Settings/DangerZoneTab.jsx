import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '../Forms/Input';
import { Button } from '../Forms/Button';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';

export const DangerZoneTab = () => {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [step, setStep] = useState('initial'); // initial | confirm
  const [password, setPassword] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    if (!acknowledged) {
      toast.error('Please confirm you understand the consequences');
      return;
    }

    setDeleting(true);
    try {
      await authApi.deleteAccount(password);
      toast.success('Account deleted');
      clearAuth();
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border-2 border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-1">
          Delete Account
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, there is no going back. All your
          workspaces, projects, tasks, and data will be permanently deleted.
        </p>

        {step === 'initial' ? (
          <Button variant="danger" onClick={() => setStep('confirm')}>
            Delete my account
          </Button>
        ) : (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ This action is permanent and cannot be undone.
              </p>
            </div>

            <Input
              label="Confirm with your password"
              type="password"
              fullWidth
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mt-0.5"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                I understand that all my data will be permanently deleted and
                cannot be recovered.
              </span>
            </label>

            <div className="flex space-x-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep('initial');
                  setPassword('');
                  setAcknowledged(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={deleting}
                disabled={!password || !acknowledged}
              >
                Permanently delete account
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};