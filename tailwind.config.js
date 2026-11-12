/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
  	extend: {
  		screens: {
  			// touch: devices without hover (phones, tablets), where
  			// hover-revealed controls must be shown outright.
  			touch: { raw: '(hover: none)' }
  		},
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)'
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)'
  			},
  			muted: {
  				DEFAULT: 'var(--muted)',
  				foreground: 'var(--muted-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--accent-foreground)'
  			},
  			destructive: {
  				DEFAULT: 'var(--destructive)'
  			},
  			rating: {
  				DEFAULT: 'var(--rating)',
  				hover: 'var(--rating-hover)',
  				foreground: 'var(--rating-foreground)'
  			},
  			border: 'var(--border)',
  			input: 'var(--input)',
  			ring: 'var(--ring)',
  			surface: 'var(--secondary)',
  			'surface-hover': 'var(--accent)',
  			text: 'var(--foreground)',
  			'text-muted': 'var(--muted-foreground)'
  		},
  		fontFamily: {
  			sans: [
  				'Roboto',
  				'sans-serif'
  			],
  			serif: [
  				'EB Garamond',
  				'serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'collapsible-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-collapsible-content-height)' }
  			},
  			'collapsible-up': {
  				from: { height: 'var(--radix-collapsible-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'collapsible-down': 'collapsible-down 200ms ease-out',
  			'collapsible-up': 'collapsible-up 200ms ease-out'
  		},
  		typography: {
  			DEFAULT: {
  				css: {
  					'code::before': {
  						content: ''
  					},
  					'code::after': {
  						content: ''
  					},
  					code: {
  						background: '#f3f3f3',
  						wordWrap: 'break-word',
  						padding: '.1rem .2rem',
  						borderRadius: '.2rem'
  					}
  				}
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
