import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Archive,
  GraduationCap,
  Users,
  Shield,
  Heart,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';

const features = [
  {
    icon: BookOpen,
    title: 'Verified Lecture Notes',
    description: 'Direct access to faculty-uploaded lecture materials, syllabus notes, and slide decks.',
  },
  {
    icon: Calendar,
    title: 'Dynamic Timetable',
    description: 'Daily and weekly schedule tailored to your branch, section, and semester with real-time class highlights.',
  },
  {
    icon: CheckSquare,
    title: 'Coursework Deadlines',
    description: 'Track assignments, lab submission due dates, and problem sets in one central dashboard.',
  },
  {
    icon: Archive,
    title: 'Previous Question Papers',
    description: 'Mid-semester and end-semester past papers with solution outlines for focused exam preparation.',
  },
];

const values = [
  { title: 'Academic Focus', desc: 'Designed specifically around a student daily college schedule, not generic PDF administration.' },
  { title: 'Section Personalization', desc: 'Content is organized automatically by your branch, year, semester, and section.' },
  { title: 'Privacy & Security', desc: 'Secure student profiles with no unnecessary public exposure of private personal information.' },
];

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="About Study Companion"
        subtitle="An integrated academic companion built to help college students stay organized every day."
      />

      {/* Mission Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Everything a student needs for college academics in one place.
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Study Companion eliminates the frustration of searching through fragmented messaging groups, email threads, and portals. From today's schedule and next room assignments to lecture notes and pending tasks, Study Companion organizes everything relevant to your class.
        </p>
      </div>

      {/* Key Academic Capabilities */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-foreground">Core Capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-2xl border border-border bg-card p-5 space-y-2 hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Principles */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-bold text-foreground">Our Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {values.map((v) => (
            <div key={v.title} className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 space-y-1">
              <span className="font-semibold text-foreground block">{v.title}</span>
              <p className="text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
