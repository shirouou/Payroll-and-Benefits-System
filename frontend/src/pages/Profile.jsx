import React, { useRef, useState } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Card from '../components/Card';
import '../styles/Profile.css';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const getErrorMessage = (error, fallback) => {
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileInput = useRef(null);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const trimmedName = name.trim();
  const nameChanged = trimmedName !== (user?.name || '');

  const saveName = async event => {
    event.preventDefault();
    if (trimmedName.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    try {
      setSavingName(true);
      const response = await profileAPI.updateName(trimmedName);
      updateUser({ name: response.data.data.name });
      setName(response.data.data.name);
      toast.success('Name updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Name could not be updated'));
    } finally {
      setSavingName(false);
    }
  };

  const choosePhoto = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      toast.error('Choose a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Profile photo must be 2 MB or smaller');
      return;
    }
    try {
      setPhotoBusy(true);
      const response = await profileAPI.uploadAvatar(file);
      updateUser({ avatarUpdatedAt: response.data.data.avatarUpdatedAt });
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Profile photo could not be uploaded'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    try {
      setPhotoBusy(true);
      await profileAPI.removeAvatar();
      updateUser({ avatarUpdatedAt: null });
      toast.success('Profile photo removed');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Profile photo could not be removed'));
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Update your name and profile photo.</p>
      </div>

      <Card title="Profile photo">
        <div className="profile-photo-row">
          <Avatar user={user} className="avatar-large" />
          <div className="profile-photo-actions">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={choosePhoto}
              hidden
            />
            <div className="profile-buttons">
              <Button variant="primary" loading={photoBusy} onClick={() => fileInput.current?.click()}>
                {user?.avatarUpdatedAt ? 'Change photo' : 'Upload photo'}
              </Button>
              {user?.avatarUpdatedAt && (
                <Button variant="ghost" disabled={photoBusy} onClick={removePhoto}>Remove</Button>
              )}
            </div>
            <small className="profile-hint">JPEG, PNG, or WebP; maximum 2 MB.</small>
          </div>
        </div>
      </Card>

      <Card title="Account details">
        <form className="profile-form" onSubmit={saveName}>
          <div className="form-group">
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              maxLength={80}
              onChange={event => setName(event.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="profile-email">Email</label>
            <input id="profile-email" type="email" value={user?.email || ''} disabled readOnly />
          </div>
          <div className="form-group">
            <label htmlFor="profile-role">Role</label>
            <input id="profile-role" type="text" value={user?.role || ''} disabled readOnly className="capitalize" />
          </div>
          <div className="form-actions">
            <Button type="submit" variant="primary" loading={savingName} disabled={!nameChanged}>Save name</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
