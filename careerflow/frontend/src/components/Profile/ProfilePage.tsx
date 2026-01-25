import React, { useState } from 'react';
import { Camera, MapPin, Briefcase, Mail, Phone, Globe, Save } from 'lucide-react';

const ProfilePage: React.FC = () => {
    // Mock user data state
    const [user, setUser] = useState({
        firstName: 'Herman',
        lastName: 'Johnson',
        role: 'UI Designer',
        company: 'Cityscaper',
        location: 'Berlin, Germany',
        email: 'h.johnson@example.com',
        phone: '+49 123 456 789',
        website: 'www.hermanj.design',
        bio: 'Passionate UI designer with over 5 years of experience in creating intuitive and visually appealing digital experiences.',
        avatar: 'https://i.pravatar.cc/300?img=11'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Profile updated! (This is a demo)');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* Header / Cover */}
            <div style={{ position: 'relative', marginBottom: '40px' }}>
                <div style={{
                    height: '160px',
                    backgroundColor: '#dcebf7',
                    borderRadius: '16px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative blobs */}
                    <div style={{ position: 'absolute', top: -20, left: -20, width: 150, height: 150, background: '#cfe2f3', borderRadius: '50%', opacity: 0.6 }} />
                    <div style={{ position: 'absolute', top: 20, right: '10%', width: 200, height: 200, background: '#e3f0fa', borderRadius: '50%', opacity: 0.8 }} />
                </div>

                {/* Avatar with Edit Button */}
                <div style={{
                    position: 'absolute',
                    bottom: '-40px',
                    left: '30px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    padding: '4px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                        <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
                            padding: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center'
                        }}>
                            <Camera size={14} />
                        </button>
                    </div>
                </div>

                <div style={{ marginLeft: '170px', marginTop: '12px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{user.firstName} {user.lastName}</h1>
                    <p style={{ color: '#6B7280', margin: '4px 0 0 0' }}>{user.role} at {user.company}</p>
                </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Personal Information</h2>
                    <button type="submit" style={{
                        backgroundColor: '#2563EB', color: 'white', border: 'none',
                        padding: '10px 20px', borderRadius: '8px', fontWeight: '600',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <Save size={16} /> Save Changes
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                    {/* First Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={user.firstName}
                            onChange={handleChange}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                        />
                    </div>

                    {/* Last Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={user.lastName}
                            onChange={handleChange}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                        />
                    </div>

                    {/* Role */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Role / Job Title</label>
                        <div style={{ position: 'relative' }}>
                            <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
                            <input
                                type="text"
                                name="role"
                                value={user.role}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Company */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Company</label>
                        <input
                            type="text"
                            name="company"
                            value={user.company}
                            onChange={handleChange}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                        />
                    </div>

                    {/* Email */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
                            <input
                                type="email"
                                name="email"
                                value={user.email}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Phone</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
                            <input
                                type="tel"
                                name="phone"
                                value={user.phone}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Location</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
                            <input
                                type="text"
                                name="location"
                                value={user.location}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Website */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Website / Portfolio</label>
                        <div style={{ position: 'relative' }}>
                            <Globe size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9CA3AF' }} />
                            <input
                                type="text"
                                name="website"
                                value={user.website}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Bio</label>
                        <textarea
                            name="bio"
                            value={user.bio}
                            onChange={handleChange}
                            rows={4}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', resize: 'vertical' }}
                        />
                    </div>

                </div>
            </form>
        </div>
    );
};

export default ProfilePage;
