import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  RiEditLine, RiSaveLine, RiCameraLine, RiAddLine, RiDeleteBinLine,
  RiGithubLine, RiLinkedinLine, RiGlobalLine, RiUserLine, RiMailLine
} from 'react-icons/ri'

const Section = ({ title, icon: Icon, children }) => (
  <div className="card">
    <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
      <Icon className="text-primary-600" /> {title}
    </h2>
    {children}
  </div>
)

const ProfilePage = () => {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: userService.getMyProfile,
  })

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      college: user?.college || '',
      graduation_year: user?.graduation_year || '',
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: userService.updateMe,
    onSuccess: () => {
      refreshUser()
      toast.success('Profile updated!')
      setEditMode(false)
    },
    onError: () => toast.error('Update failed'),
  })

  const updateProfileMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['my-profile'])
      toast.success('Profile updated!')
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => userService.uploadAvatar(file),
    onSuccess: (data) => {
      refreshUser()
      toast.success('Profile picture updated!')
    },
    onError: () => toast.error('Upload failed'),
  })

  const addSkillMutation = useMutation({
    mutationFn: userService.addSkill,
    onSuccess: () => { queryClient.invalidateQueries(['my-profile']); toast.success('Skill added!') },
  })

  const deleteSkillMutation = useMutation({
    mutationFn: userService.deleteSkill,
    onSuccess: () => { queryClient.invalidateQueries(['my-profile']); toast.success('Skill removed') },
  })

  const addEduMutation = useMutation({
    mutationFn: userService.addEducation,
    onSuccess: () => { queryClient.invalidateQueries(['my-profile']); toast.success('Education added!') },
  })

  const deleteEduMutation = useMutation({
    mutationFn: userService.deleteEducation,
    onSuccess: () => { queryClient.invalidateQueries(['my-profile']); toast.success('Education removed') },
    onError: () => toast.error('Failed to remove education'),
  })

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0]
    if (file) uploadAvatarMutation.mutate(file)
  }

  const handleAddSkill = () => {
    const name = prompt('Enter skill name:')
    const category = prompt('Category (Programming/Soft Skills/Tools):') || 'Programming'
    if (name) addSkillMutation.mutate({ name, category, proficiency: 'Intermediate' })
  }

  const onSubmitUser = (data) => updateUserMutation.mutate(data)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information and portfolio</p>
      </div>

      {/* Profile Header Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-primary flex items-center justify-center text-white text-3xl font-bold">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt={user?.full_name} className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.[0]?.toUpperCase()
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
              <RiCameraLine className="text-sm" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</h2>
            <p className="text-gray-500 dark:text-gray-400">@{user?.username}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              {user?.email && (
                <span className="flex items-center gap-1 text-sm text-gray-500"><RiMailLine /> {user.email}</span>
              )}
              {user?.college && (
                <span className="badge badge-primary">{user.college}</span>
              )}
              {user?.graduation_year && (
                <span className="badge badge-gray">Class of {user.graduation_year}</span>
              )}
            </div>

            {/* Social Links */}
            <div className="flex justify-center sm:justify-start gap-3 mt-3">
              {profile?.github_url && (
                <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <RiGithubLine className="text-xl" />
                </a>
              )}
              {profile?.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                  <RiLinkedinLine className="text-xl" />
                </a>
              )}
              {profile?.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <RiGlobalLine className="text-xl" />
                </a>
              )}
            </div>
          </div>

          <button onClick={() => setEditMode(e => !e)} className="btn-secondary btn-sm">
            {editMode ? <><RiSaveLine /> Cancel</> : <><RiEditLine /> Edit Profile</>}
          </button>
        </div>

        {/* Edit Form */}
        {editMode && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleSubmit(onSubmitUser)}
            className="mt-6 pt-6 border-t border-gray-100 dark:border-dark-700 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="label">Full Name</label>
              <input {...register('full_name')} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" />
            </div>
            <div>
              <label className="label">College</label>
              <input {...register('college')} className="input" />
            </div>
            <div>
              <label className="label">Graduation Year</label>
              <input {...register('graduation_year')} type="number" className="input" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="btn-primary">
                <RiSaveLine /> Save Changes
              </button>
            </div>
          </motion.form>
        )}
      </div>

      {/* Bio & Links */}
      <Section title="About & Links" icon={RiUserLine}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Bio</label>
            <textarea
              defaultValue={profile?.bio || ''}
              onBlur={(e) => updateProfileMutation.mutate({ bio: e.target.value })}
              rows={3}
              className="input resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
          <div>
            <label className="label">GitHub URL</label>
            <div className="relative">
              <RiGithubLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                defaultValue={profile?.github_url || ''}
                onBlur={(e) => updateProfileMutation.mutate({ github_url: e.target.value })}
                className="input pl-10"
                placeholder="https://github.com/username"
              />
            </div>
          </div>
          <div>
            <label className="label">LinkedIn URL</label>
            <div className="relative">
              <RiLinkedinLine className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
              <input
                defaultValue={profile?.linkedin_url || ''}
                onBlur={(e) => updateProfileMutation.mutate({ linkedin_url: e.target.value })}
                className="input pl-10"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>
          <div>
            <label className="label">Portfolio URL</label>
            <div className="relative">
              <RiGlobalLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                defaultValue={profile?.portfolio_url || ''}
                onBlur={(e) => updateProfileMutation.mutate({ portfolio_url: e.target.value })}
                className="input pl-10"
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
          <div>
            <label className="label">Target Role</label>
            <input
              defaultValue={profile?.target_role || ''}
              onBlur={(e) => updateProfileMutation.mutate({ target_role: e.target.value })}
              className="input"
              placeholder="Software Engineer"
            />
          </div>
        </div>
      </Section>

      {/* Skills */}
      <Section title="Skills" icon={RiAddLine}>
        <div className="flex flex-wrap gap-2 mb-4">
          {profile?.skills?.map(skill => (
            <div key={skill.id} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-sm border border-primary-100 dark:border-primary-800">
              {skill.name}
              <button onClick={() => deleteSkillMutation.mutate(skill.id)} className="hover:text-danger-500 transition-colors ml-1">
                <RiDeleteBinLine className="text-xs" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={handleAddSkill} className="btn-secondary btn-sm">
          <RiAddLine /> Add Skill
        </button>
      </Section>

      {/* Education */}
      <Section title="Education" icon={RiAddLine}>
        <div className="space-y-3 mb-4">
          {profile?.educations?.map(edu => (
            <div key={edu.id} className="p-3 rounded-xl bg-gray-50 dark:bg-dark-700 border border-gray-100 dark:border-dark-600">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{edu.degree} in {edu.field_of_study}</p>
                  <p className="text-xs text-gray-500">{edu.institution}</p>
                  {edu.grade && <p className="text-xs text-primary-600 mt-1">{edu.grade}</p>}
                </div>
                <button onClick={() => deleteEduMutation.mutate(edu.id)} className="text-danger-400 hover:text-danger-600">
                  <RiDeleteBinLine className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            const institution = prompt('Institution name:')
            const degree = prompt('Degree (e.g., B.Tech):')
            const field = prompt('Field of study:')
            const grade = prompt('Grade (optional):')
            if (institution && degree && field) {
              addEduMutation.mutate({ institution, degree, field_of_study: field, grade })
            }
          }}
          className="btn-secondary btn-sm"
        >
          <RiAddLine /> Add Education
        </button>
      </Section>
    </div>
  )
}

export default ProfilePage
