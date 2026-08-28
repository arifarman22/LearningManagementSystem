import * as React from 'react';
import { api, ApiClientError } from '@/lib/api';
import type { Course, Lesson, Quiz, BlogPost, ApiListResponse, ApiSingleResponse } from '@/types';

// ── All courses (admin/content-manager sees all) ──────────────────────────────
export function useAllCourses() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiListResponse<Course>>(
        '/courses?populate[instructor]=true&populate[lessons]=true&pagination[pageSize]=100',
      );
      setCourses(res.data ?? []);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);
  return { courses, loading, error, reload: load };
}

// ── Single course ─────────────────────────────────────────────────────────────
export function useContentCourse(documentId: string) {
  const [course, setCourse] = React.useState<Course | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [forbidden, setForbidden] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!documentId) return;
    setLoading(true); setForbidden(false); setError(null);
    try {
      const res = await api.get<ApiSingleResponse<Course>>(
        `/courses/${documentId}?populate[instructor]=true&populate[lessons]=true`,
      );
      setCourse(res.data);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 403) setForbidden(true);
      else setError(e instanceof ApiClientError ? e.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  React.useEffect(() => { load(); }, [load]);
  return { course, loading, forbidden, error, reload: load };
}

// ── All blog posts ────────────────────────────────────────────────────────────
export function useAllBlogPosts() {
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get<ApiListResponse<BlogPost>>(
        '/blog-posts?populate[author]=true&sort=createdAt:desc&pagination[pageSize]=100',
      );
      setPosts(res.data ?? []);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);
  return { posts, loading, error, reload: load };
}

// ── Single blog post ──────────────────────────────────────────────────────────
export function useBlogPost(documentId: string) {
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [forbidden, setForbidden] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!documentId) return;
    setLoading(true); setForbidden(false); setError(null);
    try {
      const res = await api.get<ApiSingleResponse<BlogPost>>(
        `/blog-posts/${documentId}?populate[author]=true&populate[coverImage]=true`,
      );
      setPost(res.data);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 403) setForbidden(true);
      else setError(e instanceof ApiClientError ? e.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  React.useEffect(() => { load(); }, [load]);
  return { post, loading, forbidden, error, reload: load };
}
