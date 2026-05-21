import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoFull from '../../assets/1-glance.png';

type BrandHomeLinkProps = {
  className?: string;
  imgClassName?: string;
  alt?: string;
};

/**
 * Logo → home (/). On landing, scrolls to top and clears hash without full reload.
 */
export const BrandHomeLink: React.FC<BrandHomeLinkProps> = ({
  className = 'inline-flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
  imgClassName = 'h-10 md:h-12 origin-left object-contain',
  alt = '1-glance — home',
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== '/') return;

    e.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (window.location.hash) {
      navigate('/', { replace: true });
    }
  };

  return (
    <Link to="/" onClick={handleClick} className={className} aria-label="Go to home">
      <img src={logoFull} alt={alt} className={imgClassName} />
    </Link>
  );
};

export default BrandHomeLink;
