import * as React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Award, Users,
  Zap, Shield, Globe, CheckCircle, Star, 
  TrendingUp, Clock, BarChart3, Sparkles, Rocket, ChevronRight, Mail,
  GraduationCap, Flame, UserCheck, BadgeCheck, BookOpen,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CourseCard, CourseCardSkeleton, BlogCard } from '@/components/public/Cards';
import { AnimatedCounter, FloatingElement } from '@/components/public/LandingClientComponents';
import type { Course, BlogPost, ApiListResponse } from '@/types';

// ── Data fetching ─────────────────────────────────────────────────────────────
async function getFeaturedCourses(): Promise<Course[]> {
  try {
    const res = await api.get<ApiListResponse<Course>>(
      '/courses?filters[status]=published&populate[instructor]=true&populate[lessons]=true&populate[thumbnail]=true&pagination[pageSize]=6',
      { token: null },
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

async function getRecentPosts(): Promise<BlogPost[]> {
  try {
    const res = await api.get<ApiListResponse<BlogPost>>(
      '/blog-posts?filters[status]=published&populate[author]=true&populate[coverImage]=true&pagination[pageSize]=3&sort=publishedAt:desc',
      { token: null },
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

async function getPublicStats() {
  try {
    const res = await api.get<{ data: { enrollments: number; courses: number; instructors: number } }>(
      '/admin-panel/public-stats',
      { token: null },
    );
    return res.data;
  } catch {
    return { enrollments: 0, courses: 0, instructors: 0 };
  }
}

// ── Feature Card
function FeatureCard({ icon, title, desc, color = 'brand', index = 0 }: { 
  icon: React.ReactNode; 
  title: string; 
  desc: string;
  color?: 'brand' | 'emerald' | 'blue' | 'purple' | 'rose' | 'amber';
  index?: number;
}) {
  const colors = {
    brand: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/50',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
    purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
    rose: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  };

  return (
    <div 
      className="group relative p-6 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:shadow-brand-500/5 dark:hover:shadow-brand-500/10 hover:scale-[1.02] hover:border-brand-200 dark:hover:border-brand-800/50 animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
      <div className="relative">
        <div className={`flex h-12 w-12 items-center justify-center rounded-md border ${colors[color]} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>
        <h3 className="mt-4 text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

// Testimonial Card
function TestimonialCard({ name, role, content, avatar, rating }: { 
  name: string; 
  role: string; 
  content: string; 
  avatar: string;
  rating: number;
}) {
  return (
    <div className="group relative p-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/5 dark:hover:shadow-brand-500/10 hover:scale-[1.02]">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 p-0.5">
          <div className="h-full w-full rounded-full bg-white dark:bg-neutral-900 p-0.5">
            <div className="h-full w-full rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center text-xl font-bold text-violet-600 dark:text-violet-400">
              {avatar}
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{role}</p>
        </div>
        <div className="ml-auto flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`} />
          ))}
        </div>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">"{content}"</p>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BenefitItem({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 group animate-slide-up">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
        {icon || <CheckCircle size={14} />}
      </div>
      <span className="text-sm text-neutral-700 dark:text-neutral-300">{text}</span>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function LandingPage() {
  const [courses, posts, stats] = await Promise.all([getFeaturedCourses(), getRecentPosts(), getPublicStats()]);

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80')" }}
          aria-hidden
        />
        {/* Dark overlay to keep text readable */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/90 via-indigo-900/88 to-blue-900/85" aria-hidden />
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <FloatingElement delay={0}>
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
          </FloatingElement>
          <FloatingElement delay={1}>
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          </FloatingElement>
          <FloatingElement delay={2}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-3xl" />
          </FloatingElement>
          
          {/* Animated particles grid */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern id=%22grid%22 width=%2260%22 height=%2260%22 patternUnits=%22userSpaceOnUse%22%3E%3Cpath d=%22M 60 0 L 0 0 0 60%22 fill=%22none%22 stroke=%22rgba(255,255,255,0.03)%22 stroke-width=%220.5%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23grid)%22/%3E%3C/svg%3E')]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-700 bg-violet-800/50 backdrop-blur-sm px-4 py-1.5 mb-6 animate-slide-up">
                <Sparkles size={13} className="text-violet-300" />
                <span className="text-xs font-medium text-violet-200">The modern way to learn online</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight animate-slide-up" style={{ animationDelay: '0.05s' }}>
                Learn skills that{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-blue-300">
                  move your career
                </span>{' '}
                forward
              </h1>

              <p className="mt-6 text-lg text-violet-200 leading-relaxed max-w-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Expert-led courses, hands-on projects, and a community of learners. Start building the skills employers want today.
              </p>

              <div className="mt-8 flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
                <Button size="xl" asChild className="bg-white text-violet-700 hover:bg-violet-50 shadow-lg shadow-violet-500/25 group">
                  <Link href="/courses" className="no-underline flex items-center gap-2">
                    Browse courses
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="xl" variant="ghost" asChild className="text-white hover:bg-violet-800 border border-violet-700">
                  <Link href="/register" className="no-underline flex items-center gap-2">
                    <Rocket size={18} />
                    Start for free
                  </Link>
                </Button>
              </div>

              <div className="mt-6 flex items-center gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex -space-x-2">
                  {[<Users size={14} />, <GraduationCap size={14} />, <UserCheck size={14} />, <BookOpen size={14} />].map((icon, i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-violet-700 border-2 border-violet-900 flex items-center justify-center text-violet-200">
                      {icon}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm text-violet-200">
                    <span className="font-bold text-white">10k+</span> learners already enrolled
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-violet-400 animate-slide-up" style={{ animationDelay: '0.25s' }}>
                No credit card required · Cancel anytime
              </p>
            </div>

            {/* Right side - Animated Dashboard Preview */}
            <div className="hidden lg:block animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 blur-3xl opacity-20 rounded-3xl" />
                <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-rose-400" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-violet-300">
                      <Users size={14} />
                      <span>Active: 1,247</span>
                    </div>
                  </div>
                  
                  {/* Mock Dashboard */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="h-10 w-10 rounded-lg bg-violet-500/30 flex items-center justify-center">
                        <BookOpen size={20} className="text-violet-300" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-32 rounded bg-white/10" />
                        <div className="mt-2 h-1.5 w-24 rounded bg-violet-500/30" />
                      </div>
                      <span className="text-xs text-violet-300">75%</span>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                        <Award size={20} className="text-emerald-300" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-36 rounded bg-white/10" />
                        <div className="mt-2 h-1.5 w-28 rounded bg-emerald-500/30" />
                      </div>
                      <span className="text-xs text-emerald-300">92%</span>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/30 flex items-center justify-center">
                        <TrendingUp size={20} className="text-blue-300" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-28 rounded bg-white/10" />
                        <div className="mt-2 h-1.5 w-20 rounded bg-blue-500/30" />
                      </div>
                      <span className="text-xs text-blue-300">60%</span>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/30 flex items-center justify-center">
                        <Clock size={20} className="text-amber-300" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-40 rounded bg-white/10" />
                        <div className="mt-2 h-1.5 w-32 rounded bg-amber-500/30" />
                      </div>
                      <span className="text-xs text-amber-300">45%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar with Animated Counters ────────────────────────────── */}
      <section className="bg-violet-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <AnimatedCounter value={stats.enrollments} label="Active learners" suffix="+" />
            <AnimatedCounter value={stats.courses} label="Expert courses" suffix="+" />
            <AnimatedCounter value={stats.instructors} label="Instructors" suffix="+" />
            <AnimatedCounter value={95} label="Completion rate" suffix="%" />
          </div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 dark:bg-violet-950/30 px-4 py-1.5 mb-4">
              <Sparkles size={14} className="text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">Why LMS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
              Everything you need to succeed
            </h2>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 leading-relaxed">
              We've built the tools, content, and community to help you go from beginner to job-ready.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={
                // Book — solid filled, violet
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M21 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zm-1 14H7a1 1 0 0 1 0-2h13v2z"/>
                  <path d="M3 6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h1V6H3z"/>
                </svg>
              }
              title="Structured learning paths"
              desc="Curated courses organized into clear progressions so you always know what to learn next."
              color="brand"
              index={0}
            />
            <FeatureCard
              icon={
                // Lightning bolt — solid filled, amber
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/>
                </svg>
              }
              title="Learn at your own pace"
              desc="All content is on-demand. Watch, pause, and rewatch as many times as you need."
              color="amber"
              index={1}
            />
            <FeatureCard
              icon={
                // Ribbon award — solid filled, emerald
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 2a6 6 0 1 0 0 12A6 6 0 0 0 12 2zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>
                  <path d="m8.21 13.89-1.69 7.41L12 19l5.48 2.3-1.69-7.41A7.97 7.97 0 0 1 12 14a7.97 7.97 0 0 1-3.79-.11z"/>
                </svg>
              }
              title="Quizzes & assessments"
              desc="Test your knowledge with built-in quizzes and track your progress in real time."
              color="emerald"
              index={2}
            />
            <FeatureCard
              icon={
                // People/users — solid filled, blue
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4.42 0-8 1.79-8 4v1h16v-1c0-2.21-3.58-4-8-4z"/>
                  <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-1.2 0-2.3.3-3.2.8C16.1 11.9 17 13.35 17 15v1h6v-1c0-2.21-2.69-4-5-4z"/>
                </svg>
              }
              title="Expert instructors"
              desc="Learn from practitioners with real-world experience in their fields."
              color="blue"
              index={3}
            />
            <FeatureCard
              icon={
                // Shield — solid filled, purple
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 1 3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4z"/>
                </svg>
              }
              title="Lifetime access"
              desc="Once enrolled, the course is yours forever — including all future updates."
              color="purple"
              index={4}
            />
            <FeatureCard
              icon={
                // Globe — solid filled, rose
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              }
              title="Learn anywhere"
              desc="Fully responsive on desktop, tablet, and mobile. Your classroom is wherever you are."
              color="rose"
              index={5}
            />
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 dark:bg-violet-950/30 px-4 py-1.5 mb-4">
              <Star size={14} className="text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">Testimonials</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
              What our learners say
            </h2>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Real stories from real learners who transformed their careers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard 
              name="Sarah Johnson"
              role="Frontend Developer"
              content="The structured learning paths made it so easy to go from beginner to job-ready. I landed my dream job in 4 months!"
              avatar="S"
              rating={5}
            />
            <TestimonialCard 
              name="Michael Chen"
              role="Data Analyst"
              content="The hands-on projects gave me the portfolio I needed to showcase my skills. Highly recommend to anyone starting out."
              avatar="M"
              rating={5}
            />
            <TestimonialCard 
              name="Emma Wilson"
              role="Product Manager"
              content="Learning at my own pace with expert instructors made all the difference. The quizzes really helped reinforce concepts."
              avatar="E"
              rating={4}
            />
          </div>
        </div>
      </section>

      {/* ── Featured Courses ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 dark:bg-violet-950/30 px-4 py-1.5 mb-3">
                <Star size={14} className="text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">Featured</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">Popular courses</h2>
            </div>
            <Link href="/courses" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 no-underline shrink-0 group">
              View all 
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => <CourseCardSkeleton key={i} />)}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Button variant="secondary" asChild>
              <Link href="/courses" className="no-underline">View all courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Interactive Learning Dashboard Preview ──────────────────────── */}
      <section className="py-20 sm:py-28 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 dark:bg-violet-950/30 px-4 py-1.5 mb-4">
                <BarChart3 size={14} className="text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">Dashboard</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                Track your progress in real-time
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                Our interactive dashboard gives you a complete overview of your learning journey. Track completion rates, see your strengths, and identify areas for improvement.
              </p>
              <ul className="space-y-3">
                <BenefitItem text="Visual progress tracking with detailed analytics" />
                <BenefitItem text="Personalized learning recommendations" />
                <BenefitItem text="Achievement badges and milestones" />
                <BenefitItem text="Study streak tracking to keep you motivated" />
              </ul>
            </div>
            <div className="relative animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 blur-3xl opacity-20 rounded-3xl" />
              <div className="relative rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-rose-400" />
                  </div>
                  <span className="text-xs text-neutral-500">Last 30 days</span>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600 dark:text-neutral-300">Course Progress</span>
                      <span className="font-semibold text-violet-600 dark:text-violet-400">78%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                      <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600 dark:text-neutral-300">Quiz Performance</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">92%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                      <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600 dark:text-neutral-300">Study Streak</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1"><Flame size={13} /> 15 days</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                      <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits / CTA Split ──────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: benefits */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 dark:bg-violet-950/30 px-4 py-1.5 mb-4">
                <CheckCircle size={14} className="text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">What you get</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
                Real skills, real results
              </h2>
              <ul className="space-y-4">
                <BenefitItem text="Hands-on projects you can add to your portfolio" />
                <BenefitItem text="Quizzes after every module to reinforce learning" />
                <BenefitItem text="Track your progress with detailed lesson completion" />
                <BenefitItem text="Access to all course materials, forever" />
                <BenefitItem text="New courses added every month" />
                <BenefitItem text="Mobile-friendly — learn on any device" />
              </ul>
            </div>

            {/* Right: CTA card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 blur-3xl opacity-20 rounded-3xl" />
              <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 sm:p-10 text-white shadow-2xl shadow-violet-500/25">
                <div className="absolute top-0 right-0 p-4">
                  <Sparkles className="h-8 w-8 text-violet-300/30 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Ready to start learning?</h3>
                <p className="text-violet-200 mb-8 leading-relaxed">
                  Join thousands of learners already building their future on LMS. Create your free account in under a minute.
                </p>
                <div className="space-y-3">
                  <Button size="lg" fullWidth asChild className="bg-white text-violet-700 hover:bg-violet-50 shadow-lg group">
                    <Link href="/register" className="no-underline flex items-center justify-center gap-2">
                      Create free account
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" fullWidth variant="ghost" asChild className="text-white hover:bg-violet-700 border border-violet-500">
                    <Link href="/courses" className="no-underline flex items-center justify-center gap-2">
                      Browse courses first
                      <ChevronRight size={16} />
                    </Link>
                  </Button>
                </div>
                <p className="mt-5 text-center text-xs text-violet-300">No credit card · No commitment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Blog Preview ──────────────────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="py-20 sm:py-28 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 dark:bg-violet-950/30 px-4 py-1.5 mb-3">
                  <BookOpen size={14} className="text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">From the blog</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">Latest articles</h2>
              </div>
              <Link href="/blog" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 no-underline shrink-0 group">
                All articles 
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((p) => <BlogCard key={p.id} post={p} />)}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Button variant="secondary" asChild>
                <Link href="/blog" className="no-underline">Read all articles</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter Section ───────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 dark:bg-violet-950/30 px-4 py-1.5 mb-4">
            <Mail size={14} className="text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">Newsletter</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            Stay in the loop
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
            Get the latest courses, articles, and learning tips delivered straight to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
            <Button asChild className="shrink-0">
              <Link href="#" className="no-underline flex items-center gap-2 group">
                Subscribe
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
            No spam, unsubscribe anytime. Join 5,000+ subscribers.
          </p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-violet-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-700 bg-violet-800/50 backdrop-blur-sm px-4 py-1.5 mb-6">
              <Rocket size={14} className="text-violet-300" />
              <span className="text-xs font-medium text-violet-200">Join the community</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 animate-slide-up">
            Your next skill is one click away
          </h2>
          <p className="text-violet-300 mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.05s' }}>
            Stop putting it off. Start learning today with LMS's expert-led courses.
          </p>
          <Button size="xl" asChild className="bg-white text-violet-700 hover:bg-violet-50 shadow-lg shadow-violet-500/25 group animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Link href="/register" className="no-underline flex items-center gap-2">
              Get started for free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-violet-400 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <span className="flex items-center gap-1.5"><BadgeCheck size={13} className="text-emerald-400" /> Free account</span>
            <span className="flex items-center gap-1.5"><GraduationCap size={13} className="text-violet-300" /> Premium content</span>
            <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-amber-400" /> Expert instructors</span>
          </div>
        </div>
      </section>
    </div>
  );
}