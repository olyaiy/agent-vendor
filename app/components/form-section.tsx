import React from 'react';

interface FormSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-4">
        <div className="pb-2 border-b">
          <h2 className="text-lg font-medium tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        </div>
      </div>
      <div className="md:col-span-8 space-y-6">
        {children}
      </div>
    </section>
  );
}