import React from 'react';
import { Heart, Target, Users } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
          Empowering Inclusive Learning for Every Student
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          SaathiFy — derived from the Hindi word <em>Saathi</em> meaning Companion — is built on the belief that educational content should adapt seamlessly to the student, never the other way around.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surface-raised border border-border p-6 rounded-2xl space-y-3">
          <Target className="w-8 h-8 text-accent" />
          <h2 className="text-xl font-bold text-text-primary">Our Mission</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Eliminate communication and formatting barriers in higher education for visually, hearing, motor, and neurodivergent learners across India and globally.
          </p>
        </div>

        <div className="bg-surface-raised border border-border p-6 rounded-2xl space-y-3">
          <Heart className="w-8 h-8 text-danger" />
          <h2 className="text-xl font-bold text-text-primary">Indian Sign Language First</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Pioneering automated ISL spatial gloss mapping to allow deaf students to study STEM subjects in their native sign language grammar.
          </p>
        </div>

        <div className="bg-surface-raised border border-border p-6 rounded-2xl space-y-3">
          <Users className="w-8 h-8 text-success" />
          <h2 className="text-xl font-bold text-text-primary">Co-Designed with Students</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Built through direct feedback loops with disability advocates, screen-reader users, and neurodivergent educators.
          </p>
        </div>
      </div>
    </div>
  );
};
