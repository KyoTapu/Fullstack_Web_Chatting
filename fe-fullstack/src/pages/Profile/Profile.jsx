import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { LeftSidebar } from "../../components/sidebar/LeftSidebar";
import { EducateBlock } from "../../components/profile/EducateBlock";
import { InfoItem } from "../../components/profile/InfoItem";
import PrivacyBadge from "../../components/profile/PrivacyBadge";
import EditProfileModal from "./EditProfileModal";
import { MapPin, Mail, Phone, Globe, Edit3, Briefcase, Heart, BookOpen, Layers, User, Lock, ImagePlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/profile/Avatar";
import { updateUserProfileApi, getUserByIdApi } from "../../api/users.api";
import ProfileSkeleton from "../../components/skeleton/ProfileSkeleton";

export default function Profile() {
  const { userId } = useParams();
  const [openEdit, setOpenEdit] = useState(false);
  const { user: currentUser, updateProfile } = useAuth();
  const [viewedUser, setViewedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef(null);
  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    const fetchUserProfile = async () => {
      const currentUserId = currentUser?.id;

      if (!userId) {
        setViewedUser(currentUser);
        setLoading(false);
        return;
      }

      if (currentUser && userId === currentUserId) {
        setViewedUser(currentUser);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await getUserByIdApi(userId);
        if (res.success && res.data && res.data.length > 0) {
          setViewedUser(res.data[0]);
        } else {
          setViewedUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setViewedUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, currentUser]);

  const uploadToCloudinary = async (file) => {
    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      throw new Error(
        "Missing Cloudinary config. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in fe-fullstack/.env",
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryUploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload image to Cloudinary failed");
    }

    const data = await res.json();
    if (!data.secure_url) {
      throw new Error("Cloudinary did not return secure_url");
    }

    return data.secure_url;
  };

  const currentUserId = currentUser?.id;
  const viewedUserId = viewedUser?.id;
  const isOwnProfile = Boolean(currentUserId && viewedUserId && viewedUserId === currentUserId);
  const profile = viewedUser?.profile || {};
  const hasCoverImage = Boolean(profile.cover_url);

  const handleUploadAvatar = async (file) => {
    try {
      const url = await uploadToCloudinary(file);
      const res = await updateUserProfileApi({ avatar_url: url });

      if (!res?.success || !res?.data) {
        throw new Error("Failed to update avatar in backend");
      }

      setViewedUser(res.data);
      if (isOwnProfile) {
        updateProfile(res.data.profile);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Upload avatar failed. Please try again.");
      throw err;
    }
  };

  const handleUploadCover = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only images allowed");
      event.target.value = "";
      return;
    }

    try {
      setCoverUploading(true);
      const url = await uploadToCloudinary(file);
      const res = await updateUserProfileApi({ cover_url: url });

      if (!res?.success || !res?.data) {
        throw new Error("Failed to update cover photo in backend");
      }

      setViewedUser(res.data);
      if (isOwnProfile) {
        updateProfile(res.data.profile);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Upload cover photo failed. Please try again.");
    } finally {
      setCoverUploading(false);
      event.target.value = "";
    }
  };

  const handleSaveProfile = async (data) => {
    try {
      const res = await updateUserProfileApi(data);
      if (res.success) {
        setViewedUser(res.data);
        updateProfile(res.data.profile);
      }
      setOpenEdit(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to save profile. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-textMuted">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl font-semibold text-textPrimary">User not found</p>
          <p className="text-textMuted">The profile you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background font-sans text-textPrimary">
      <div className="fixed hidden h-full lg:block">
        <LeftSidebar active="dashboard" />
      </div>

      <main className="flex flex-1 flex-col bg-background transition-all duration-300 lg:ml-[80px]">
        <section className="bg-background">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="relative isolate overflow-hidden rounded-b-[2rem]">
              <div className="relative h-64 overflow-hidden bg-slate-200 md:h-[22rem]">
                {hasCoverImage ? (
                  <img
                    src={profile.cover_url}
                    alt={`${viewedUser.username} cover`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `
                          radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.35) 0%, transparent 26%),
                          radial-gradient(circle at 78% 20%, rgba(191, 219, 254, 0.28) 0%, transparent 24%),
                          linear-gradient(125deg, #dbeafe 0%, #93c5fd 38%, #60a5fa 68%, #2563eb 100%)
                        `,
                      }}
                    />
                    <div className="absolute -left-16 top-6 h-56 w-56 rounded-full bg-white/25 blur-3xl" />
                    <div className="absolute right-8 top-10 h-48 w-48 rounded-full bg-sky-100/25 blur-3xl" />
                    <div className="absolute bottom-0 left-1/4 h-32 w-80 rounded-t-full bg-white/10 blur-2xl" />
                    <div
                      className="absolute -left-8 bottom-0 h-40 w-[48%] bg-white/10"
                      style={{ clipPath: "ellipse(65% 100% at 50% 100%)" }}
                    />
                    <div
                      className="absolute right-0 bottom-0 h-36 w-[42%] bg-blue-200/14"
                      style={{ clipPath: "ellipse(70% 100% at 50% 100%)" }}
                    />
                    <div
                      className="absolute inset-0 opacity-35"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
                        `,
                        backgroundSize: "36px 36px",
                        maskImage: "linear-gradient(to bottom, rgba(0, 0, 0, 0.65), transparent)",
                      }}
                    />
                  </>
                )}

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(15,23,42,0.06)_52%,rgba(15,23,42,0.25)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent via-black/10 to-black/35" />

                {isOwnProfile ? (
                  <>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadCover}
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                    >
                      <ImagePlus className="h-4 w-4" />
                      {coverUploading ? "Uploading..." : hasCoverImage ? "Edit cover photo" : "Add cover photo"}
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="px-2 pb-4 sm:px-4">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col items-center gap-4 text-center md:-mt-10 md:flex-row md:items-end md:text-left">
                    <Avatar
                      avatar={profile.avatar_url}
                      isEditable={isOwnProfile}
                      onUpload={handleUploadAvatar}
                      sizeClass="h-32 w-32 md:h-44 md:w-44"
                      ringClass="border-background"
                    />

                  <div className="pb-2">
                    <h1 className="text-3xl font-bold text-textPrimary md:text-4xl">{viewedUser.username}</h1>
                    {profile.full_name ? <p className="mt-1 text-sm text-textMuted">{profile.full_name}</p> : null}
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-textMuted md:justify-start">
                      <span className="font-medium text-textPrimary">{profile.title || "No job title"}</span>
                      {profile.location ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-primary" />
                          {profile.location}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-primary" />
                        {viewedUser.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end md:pb-3">
                  <PrivacyBadge value={profile.privacy} />
                  {isOwnProfile ? (
                    <button
                      onClick={() => setOpenEdit(true)}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold transition hover:opacity-90"
                      style={{ color: "var(--app-chat-bubble-own-text)" }}
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit Profile
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex-1 px-4 pb-12 pt-6 sm:px-8">
          <div className="mx-auto max-w-5xl space-y-6">

            {currentUserId !== viewedUserId && viewedUser?.profile?.privacy === "private" ? (
              <div className="relative flex items-center gap-6 rounded-3xl border border-border bg-surface p-6 shadow-xl md:p-8">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-textMuted">{viewedUser.username}&apos;s profile is private</p>
                  <Link to="/dumbpage" className="text-sm font-medium text-primary">
                    Learn more
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6">
                  <Section title="Contact Information" icon={<Phone className="h-5 w-5 text-primary" />}>
                    <InfoItem
                      icon={<Mail className="h-4 w-4" />}
                      label="Email"
                      value={viewedUser.email}
                      copyable={true}
                    />
                    <InfoItem
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone"
                      value={profile.phone}
                      copyable={true}
                    />
                    <InfoItem
                      icon={<MapPin className="h-4 w-4" />}
                      label="Location"
                      value={profile.location}
                      copyable={true}
                    />
                    <InfoItem
                      icon={<Globe className="h-4 w-4" />}
                      label="Website"
                      value={profile.website}
                      copyable={true}
                    />
                  </Section>

                  <Section title="Hobbies" icon={<Heart className="h-5 w-5 text-primary" />}>
                    {profile.hobbies?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.hobbies.map((h) => (
                          <span
                            key={h}
                            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-textPrimary"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-textMuted">No hobbies yet.</p>
                    )}
                  </Section>
                </div>

                <div className="space-y-6 lg:col-span-2">
                  <Section title="About Me" icon={<User className="h-5 w-5 text-primary" />}>
                    <p className="text-textPrimary">{profile.bio || "No bio added yet."}</p>
                  </Section>

                  <Section title="Skills" icon={<Layers className="h-5 w-5 text-primary" />}>
                    {profile.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-textMuted">No skills added.</p>
                    )}
                  </Section>

                  <Section title="Education" icon={<BookOpen className="h-5 w-5 text-primary" />}>
                    {profile.education?.length > 0 ? (
                      profile.education.map((edu, idx) => <EducateBlock key={idx} education={edu} />)
                    ) : (
                      <p className="text-xs text-textMuted">No education info.</p>
                    )}
                  </Section>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {openEdit ? (
        <EditProfileModal
          profile={profile}
          onClose={() => setOpenEdit(false)}
          onSave={handleSaveProfile}
          user={viewedUser}
        />
      ) : null}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3 border-b border-border pb-3">
        <div className="rounded-lg bg-background p-2">{icon}</div>
        <h3 className="text-lg font-semibold text-textPrimary">{title}</h3>
      </div>
      {children}
    </section>
  );
}
