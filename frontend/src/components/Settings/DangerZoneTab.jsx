import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '../Forms/Input';
import { Button } from '../Forms/Button';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-red-50 flex items-center justify-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-red-600 mb-1">
              Delete Account
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Once you delete your account, there is no going back. All your
              workspaces, projects, tasks, and data will be permanently deleted.
            </p>

            {step === 'initial' ? (
              <Button variant="danger" onClick={() => setStep('confirm')}>
                Delete my account
              </Button>
            ) : (
              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-lg p-3.5">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">
                    This action is permanent and cannot be undone.
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

                <label className="flex items-start gap-3 cursor-pointer">
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

                <div className="flex gap-3 pt-1">
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
      </div>
    </div>
  );
};