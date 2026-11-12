/**
 * A theme colour backed by `--<name>`, with opacity-modifier support:
 * `bg-rating` → var(--rating); `bg-rating/10` → 10% rating over transparent.
 */
const token =
  (name) =>
  ({ opacityValue } = {}) =>
    opacityValue === undefined || opacityValue === "1"
      ? `var(--${name})`
      : `color-mix(in srgb, var(--${name}) calc(${opacityValue} * 100%), transparent)`;

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
  		// Every colour is a CSS variable holding a hex value. Tailwind can't
  		// apply an opacity modifier (`bg-rating/10`) to a plain var() — it
  		// silently emits no rule — so each token is a function that mixes the
  		// variable with transparent via color-mix() when a modifier is used.
  		colors: {
  			background: token('background'),
  			foreground: token('foreground'),
  			card: {
  				DEFAULT: token('card'),
  				foreground: token('card-foreground')
  			},
  			popover: {
  				DEFAULT: token('popover'),
  				foreground: token('popover-foreground')
  			},
  			primary: {
  				DEFAULT: token('primary'),
  				foreground: token('primary-foreground')
  			},
  			secondary: {
  				DEFAULT: token('secondary'),
  				foreground: token('secondary-foreground')
  			},
  			muted: {
  				DEFAULT: token('muted'),
  				foreground: token('muted-foreground')
  			},
  			accent: {
  				DEFAULT: token('accent'),
  				foreground: token('accent-foreground')
  			},
  			destructive: {
  				DEFAULT: token('destructive'),
  				foreground: token('destructive-foreground')
  			},
  			rating: {
  				DEFAULT: token('rating'),
  				hover: token('rating-hover'),
  				foreground: token('rating-foreground')
  			},
  			success: token('success'),
  			warning: token('warning'),
  			streak: token('streak'),
  			overlay: token('overlay'),
  			navbar: token('navbar'),
  			border: token('border'),
  			input: token('input'),
  			ring: token('ring'),
  			surface: token('secondary'),
  			'surface-hover': token('accent'),
  			text: token('foreground'),
  			'text-muted': token('muted-foreground')
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
