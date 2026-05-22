/**
 * AuthPageLogo — shared logo for all auth pages (login, signup, verify, etc.)
 *
 * Reads logo URL and brand name from useBrand() — no static imports.
 * Wraps in a Link → "/" for consistent nav.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBrand } from '../../brand/useBrand';

interface AuthPageLogoProps {
  className?: string;
  animate?: boolean;
}

export const AuthPageLogo: React.FC<AuthPageLogoProps> = ({
  className = 'h-10 md:h-12 mb-12 origin-left scale-[1.25] object-contain',
  animate = false,
}) => {
  const brand = useBrand();

  const img = animate ? (
    <motion.img
      whileHover={{ scale: 1.05 }}
      src={brand.logoUrl}
      alt={brand.name}
      className={className}
    />
  ) : (
    <img src={brand.logoUrl} alt={brand.name} className={className} />
  );

  return <Link to="/">{img}</Link>;
};

/**
 * AuthPageFooter — shared copyright footer for auth pages.
 * Reads brand name + copyright from useBrand().
 */
export const AuthPageFooter: React.FC = () => {
  const brand = useBrand();
  return (
    <footer className="mt-12 text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] relative z-10 transition-opacity hover:opacity-100 opacity-50">
      &copy; {new Date().getFullYear()} {brand.copyright}. The Digital Curator.
    </footer>
  );
};
