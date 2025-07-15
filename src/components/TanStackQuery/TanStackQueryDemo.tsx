"use client";

import { useState } from 'react';
import { useCurrentUserProfile } from '@/hooks/queries/useUser';
import { useMyPosts, usePublishedPosts } from '@/hooks/queries/usePosts';
import { useCreatePost, useUpdatePost, useDeletePost } from '@/hooks/mutations/usePosts';
import { useUpdateProfile } from '@/hooks/mutations/useProfile';
import { useUser } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export function TanStackQueryDemo() {
  const { user } = useUser();
  const t = useTranslations('TanStackQuery');
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');

  // Queries
  const { data: profile, isLoading: profileLoading } = useCurrentUserProfile();
  const { data: myPosts = [], isLoading: myPostsLoading } = useMyPosts();
  const { data: publishedPosts = [], isLoading: publishedLoading } = usePublishedPosts();

  // Mutations
  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();
  const updateProfileMutation = useUpdateProfile();

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    
    await createPostMutation.mutateAsync({
      title: newPost.title,
      content: newPost.content,
      published: true
    });
    
    setNewPost({ title: '', content: '' });
  };

  const handleUpdatePost = async (postId: string, published: boolean) => {
    await updatePostMutation.mutateAsync({
      postId,
      updates: { published: !published }
    });
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm(t('posts.myPosts.deleteConfirm'))) {
      await deletePostMutation.mutateAsync(postId);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileName.trim()) return;
    
    await updateProfileMutation.mutateAsync({
      full_name: profileName
    });
    
    setProfileName('');
  };

  if (!user) {
    return (
      <div className="rounded-lg bg-white p-6 shadow dark:bg-dark">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{t('title')}</h2>
        <p className="text-gray-600 dark:text-gray-300">{t('loginRequired')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow dark:bg-dark">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{t('title')}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {t('description')}
        </p>
        
        {/* Demonstrated Features */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">{t('features.title')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>{t('features.realTime')}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>{t('features.optimistic')}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>{t('features.caching')}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>{t('features.error')}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>{t('features.loading')}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              <span>{t('features.mutations')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-dark">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('profile.title')}</h3>
        {profileLoading ? (
          <div className="text-gray-600 dark:text-gray-300">{t('profile.loading')}</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {profile?.avatar_url && (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="h-16 w-16 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{profile?.full_name || t('profile.nameNotDefined')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.emailAddresses[0]?.emailAddress}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">ID: {profile?.id}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder={t('profile.newNamePlaceholder')}
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                onClick={handleUpdateProfile}
                disabled={updateProfileMutation.isPending}
                variant="primary"
              >
                {updateProfileMutation.isPending ? t('profile.updating') : t('profile.updateButton')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Post */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-dark">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('posts.create.title')}</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t('posts.create.titlePlaceholder')}
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <textarea
            placeholder={t('posts.create.contentPlaceholder')}
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <Button
            onClick={handleCreatePost}
            disabled={createPostMutation.isPending}
            variant="primary"
          >
            {createPostMutation.isPending ? t('posts.create.creating') : t('posts.create.button')}
          </Button>
        </div>
      </div>

      {/* My Posts */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-dark">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          {t('posts.myPosts.title')} ({myPosts.length})
        </h3>
        {myPostsLoading ? (
          <div className="text-gray-600 dark:text-gray-300">{t('posts.myPosts.loading')}</div>
        ) : (
          <div className="space-y-3">
            {myPosts.map((post) => (
              <div key={post.id} className="rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 dark:text-white">{post.title}</h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{post.content}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        post.published 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {post.published ? t('posts.myPosts.published') : t('posts.myPosts.draft')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleUpdatePost(post.id, post.published ?? false)}
                      disabled={updatePostMutation.isPending}
                      variant="outlinePrimary"
                      size="small"
                    >
                      {post.published ? t('posts.myPosts.unpublishButton') : t('posts.myPosts.publishButton')}
                    </Button>
                    <Button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deletePostMutation.isPending}
                      variant="outlineDark"
                      size="small"
                    >
                      {t('posts.myPosts.deleteButton')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {myPosts.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">{t('posts.myPosts.empty')}</p>
            )}
          </div>
        )}
      </div>

      {/* Published Posts */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-dark">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          {t('posts.public.title')} ({publishedPosts.length})
        </h3>
        {publishedLoading ? (
          <div className="text-gray-600 dark:text-gray-300">{t('posts.public.loading')}</div>
        ) : (
          <div className="space-y-3">
            {publishedPosts.map((post) => (
              <div key={post.id} className="rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3">
                <h4 className="font-medium text-gray-800 dark:text-white">{post.title}</h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{post.content}</p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(post.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
            {publishedPosts.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">{t('posts.public.empty')}</p>
            )}
          </div>
        )}
      </div>

      {/* Query Status */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-dark">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('status.title')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">{t('status.profile')}</span> 
            <span className={profileLoading ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
              {profileLoading ? t('status.loading') : t('status.loaded')}
            </span>
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">{t('status.myPosts')}</span> 
            <span className={myPostsLoading ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
              {myPostsLoading ? t('status.loading') : t('status.loaded')}
            </span>
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">{t('status.publicPosts')}</span> 
            <span className={publishedLoading ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
              {publishedLoading ? t('status.loading') : t('status.loaded')}
            </span>
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">{t('status.mutations')}</span> 
            <span className={
              createPostMutation.isPending || 
              updatePostMutation.isPending || 
              deletePostMutation.isPending || 
              updateProfileMutation.isPending
                ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
            }>
              {createPostMutation.isPending || 
               updatePostMutation.isPending || 
               deletePostMutation.isPending || 
               updateProfileMutation.isPending 
                ? t('status.executing') : t('status.idle')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}