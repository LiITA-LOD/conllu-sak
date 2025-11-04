import { Box, Link, Typography } from '@mui/material';
import React from 'react';

interface NavigationLink {
  url: string;
  label: string;
}

interface NavigationLinksProps {
  links: NavigationLink[];
}

const NavigationLinks: React.FC<NavigationLinksProps> = ({ links }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {links.map((link, index) => (
        <React.Fragment key={link.url}>
          <Link
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              fontSize: '0.875rem',
              opacity: 0.8,
              '&:hover': {
                opacity: 1,
                textDecoration: 'underline',
              },
            }}
          >
            {link.label}
          </Link>
          {index < links.length - 1 && (
            <Typography sx={{ opacity: 0.5, fontSize: '0.875rem' }}>
              ·
            </Typography>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default NavigationLinks;
