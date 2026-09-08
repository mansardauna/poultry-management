import React from 'react';
import Image from 'next/image';

interface DocSectionProps {
  id: string;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  children: React.ReactNode;
}

export function DocSection({ id, title, description, imageSrc, imageAlt, children }: DocSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 mb-16 relative">
      <div className="absolute -inset-x-6 -inset-y-6 z-0 bg-white/40 rounded-3xl blur-xl transition-all duration-500 opacity-0 hover:opacity-100 pointer-events-none"></div>
      <div className="relative z-10 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow">
        
        {imageSrc && (
          <div className="w-full h-64 md:h-80 relative bg-indigo-50 border-b border-slate-100 overflow-hidden">
            <Image 
              src={imageSrc} 
              alt={imageAlt || title} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Glassmorphic overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent mix-blend-multiply"></div>
          </div>
        )}

        <div className="p-8 md:p-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">{title}</h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">{description}</p>
          
          <div className="prose prose-slate prose-indigo max-w-none text-slate-700 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
