# Plan: Fix Work Experience/Skills/Education Not Syncing After Resume Save

## Problem Statement
After saving changes in the Resume Builder and navigating back to the Profile Page, the **Work Experience**, **Skills**, **Achievements**, and **Education** sections do not reflect the updated values. The profile dropdown correctly shows the newly saved resume profile, but the section data remains stale.

## Root Cause Analysis
In `ProfilePage.tsx`, when centralized profile data arrives via props:

1. `applyProfileData()` sets `experiences`, `educations`, and `skills` from **main profile data** (`data.experience`, `data.education`, `data.skills`)
2. However, the Resume Builder saves edits into a **resume profile's `resumeSnapshot`**, not the main profile
3. The `loadResumeProfileData()` function correctly loads snapshot data when a resume profile is selected, but it's called **before** the centralized data arrives or when the user manually changes profiles
4. After save + navigation, the centralized `profileData` is refreshed, but the code path doesn't reload the snapshot from the active resume profile

## Data Flow (Current - Broken)
```
ResumePage saves → POST /api/profile (updates resumeProfile.resumeSnapshot)
                 → App.fetchProfileData() → profileData updated
                 → Navigate to /profile
                 → ProfilePage receives new profileData via props
                 → applyProfileData() runs → sets experiences from data.experience (WRONG)
                 → Shows stale main profile data, not the saved snapshot
```

## Data Flow (Expected - Fixed)
```
ResumePage saves → POST /api/profile (updates resumeProfile.resumeSnapshot)
                 → App.fetchProfileData() → profileData updated
                 → Navigate to /profile
                 → ProfilePage receives new profileData via props
                 → applyProfileData() runs → detects active resumeProfile
                 → Loads experiences/skills/education from resumeProfile.resumeSnapshot (CORRECT)
                 → Shows fresh saved data
```

## Fix Implementation

### Location: `ProfilePage.tsx` → `applyProfileData()`

### Current Code (Simplified)
```typescript
const applyProfileData = (data: ProfileData) => {
  // Contact info
  setFormData({ ... });
  
  // Experiences from MAIN profile (wrong after resume save)
  if (data.experience) {
    setExperiences(data.experience.map(...));
  }
  
  // Education from MAIN profile
  if (data.education) {
    setEducations(data.education.map(...));
  }
  
  // Skills from MAIN profile
  if (data.skills) {
    setSkills(data.skills);
  }
};
```

### Fixed Code (Simplified)
```typescript
const applyProfileData = (data: ProfileData) => {
  // Contact info (always from main profile)
  setFormData({ ... });
  
  // Find active resume profile
  const activeProfile = data.resumeProfiles?.find(p => p.name === selectedProfile);
  
  if (activeProfile?.resumeSnapshot) {
    // Load from snapshot when a resume profile is selected
    const snapshot = activeProfile.resumeSnapshot;
    setExperiences(snapshot.experience?.map(...) || []);
    setEducations(snapshot.education?.map(...) || []);
    setSkills(snapshot.skills || []);
  } else {
    // Fallback to main profile data
    setExperiences(data.experience?.map(...) || []);
    setEducations(data.education?.map(...) || []);
    setSkills(data.skills || []);
  }
};
```

### Key Changes
1. Check if `selectedProfile` matches a resume profile in `data.resumeProfiles`
2. If match found, load `experiences`, `educations`, `skills` from `resumeSnapshot`
3. If no match (e.g., "Base Profile" selected), fall back to main profile data

### Dependencies
- `selectedProfile` state must be available when `applyProfileData` runs
- The save operation in ResumePage must pass the profile name so App can set it before navigation
- May need to sync `selectedProfile` via URL query param or App state

## Testing Verification
1. Open Resume Builder → select a profile → edit Work Experience → Save
2. Verify redirect to Profile Page
3. Confirm dropdown shows the saved profile name
4. Confirm Work Experience section shows the edited values
5. Repeat for Skills, Education, Achievements

## Files to Modify
- `careerflow/frontend/src/components/Profile/ProfilePage.tsx` - Main fix
- Possibly `careerflow/frontend/src/App.tsx` - Pass selectedProfile if needed
