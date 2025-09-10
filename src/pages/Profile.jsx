import React from 'react'
import { useStore } from '../state/store.js'

export default function Profile() {
  const profile = useStore((s) => s.profile)

  // ✅ Correctly balanced braces
  const setProfile = (patch) =>
    useStore.setState((s) => ({
      profile: { ...s.profile, ...patch },
    }))

  const setLinkedInVis = (k) =>
    useStore.setState((s) => ({
      profile: {
        ...s.profile,
        linkedin: {
          ...s.profile.linkedin,
          visible: {
            ...s.profile.linkedin.visible,
            [k]: !s.profile.linkedin.visible[k],
          },
        },
      },
    }))

  return (
    <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
      <div className="card">
        <h2>Astronaut Card</h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <label>
            Name
            <input
              className="field"
              value={profile.name}
              onChange={(e) => setProfile({ name: e.target.value })}
            />
          </label>
          <label>
            Headline
            <input
              className="field"
              value={profile.headline}
              onChange={(e) => setProfile({ headline: e.target.value })}
            />
          </label>
          <label>
            College
            <input
              className="field"
              value={profile.college}
              onChange={(e) => setProfile({ college: e.target.value })}
            />
          </label>
          <label>
            Grad Year
            <input
              className="field"
              value={profile.gradYear}
              onChange={(e) => setProfile({ gradYear: e.target.value })}
            />
          </label>
        </div>
        <div className="row">
          <div className="pill">Goals: {profile.goals.join(', ')}</div>
          <div className="pill">Skills: {profile.skills.join(', ')}</div>
          <div className="pill">Availability: {profile.availability}</div>
        </div>
      </div>

      <div className="col">
        <div className="card">
          <h3>LinkedIn Snapshot</h3>
          <label>
            Profile URL
            <input
              className="field"
              value={profile.linkedin.url}
              onChange={(e) =>
                setProfile({ linkedin: { ...profile.linkedin, url: e.target.value } })
              }
            />
          </label>
          <label>
            Headline
            <input
              className="field"
              value={profile.linkedin.headline}
              onChange={(e) =>
                setProfile({
                  linkedin: { ...profile.linkedin, headline: e.target.value },
                })
              }
            />
          </label>
          <label>
            Key skills (comma separated)
            <input
              className="field"
              value={(profile.linkedin.skills || []).join(', ')}
              onChange={(e) =>
                setProfile({
                  linkedin: {
                    ...profile.linkedin,
                    skills: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                  },
                })
              }
            />
          </label>
          <div className="row">
            {Object.entries(profile.linkedin.visible).map(([k, v]) => (
              <label key={k} className="pill">
                <input type="checkbox" checked={v} onChange={() => setLinkedInVis(k)} /> Show on {k}
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Privacy</h3>
          <div className="row">
            <label className="pill">
              <input
                type="checkbox"
                checked={profile.privacy.journalsPrivate}
                onChange={() =>
                  useStore.setState((s) => ({
                    profile: {
                      ...s.profile,
                      privacy: {
                        ...s.profile.privacy,
                        journalsPrivate: !s.profile.privacy.journalsPrivate,
                      },
                    },
                  }))
                }
              />{' '}
              Journals private
            </label>
            <label className="pill">
              <input
                type="checkbox"
                checked={profile.privacy.allowAnon}
                onChange={() =>
                  useStore.setState((s) => ({
                    profile: {
                      ...s.profile,
                      privacy: {
                        ...s.profile.privacy,
                        allowAnon: !s.profile.privacy.allowAnon,
                      },
                    },
                  }))
                }
              />{' '}
              Allow anon posts
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
