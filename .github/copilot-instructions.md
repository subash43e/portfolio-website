# Portfolio Website - AI Agent Instructions

## Software Engineering Principles (SOP)
Follow these core principles as standard operating procedures for all code changes:

- **Separation of Concerns**: Always break down monolithic components into modular, single-responsibility parts (e.g., extract Header, Hero sections into separate files).
- **DRY (Don't Repeat Yourself)**: Eliminate code duplication by extracting common patterns into reusable functions or components.
- **KISS (Keep It Simple, Stupid)**: Prefer simple solutions over complex ones; avoid over-engineering.
- **YAGNI (You Aren't Gonna Need It)**: Only implement features that are immediately needed; avoid speculative code.
- **Single Responsibility Principle**: Each component/function should have one reason to change.
- **SOLID Principles**: Apply as applicable (Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion).

## Architecture Overview
This is a single-page React application built with Vite, featuring a portfolio layout with sections for Header, Hero, About, Skills, Projects, and Contact. Currently, all components are contained within `src/App.jsx` as a single functional component, but **always follow separation of concerns** by breaking down the app into modular components. Create separate files for each major section (e.g., `src/components/Header.jsx`, `src/components/Hero.jsx`) to improve maintainability and reusability.

Key files:
- `src/App.jsx`: Main application component that imports and composes section components
- `src/components/`: Directory for individual section components (create if needed)
- `src/main.jsx`: React root rendering entry point
- `src/index.css`: Tailwind directives and basic resets
- `tailwind.config.js`: Tailwind configuration with content paths
- `vite.config.js`: Vite config with Tailwind plugin integration

## Development Workflows
- **Start dev server**: `npm run dev` (runs Vite dev server with HMR)
- **Build for production**: `npm run build` (outputs to `dist/` directory)
- **Linting**: `npm run lint` (ESLint checks)
- **Preview production build**: `npm run preview` (serves built files locally)

## Styling Conventions
- Use Tailwind utility classes exclusively in `className` attributes
- Tailwind v4 syntax: `@import "tailwindcss/preflight"; @tailwind utilities;` in `src/index.css`
- Gradients use `bg-linear-to-br` (not `bg-gradient-to-br`)
- Color scheme: Dark theme with `slate-900` background and `slate-100` text
- Responsive design: Use `md:` prefixes for tablet+ breakpoints

## Code Patterns
- **Separation of Concerns**: Always extract UI sections into separate component files. For example, move the Header JSX from `src/App.jsx` to `src/components/Header.jsx` and import it in `App.jsx`.
- Functional components with arrow functions
- JSX with inline event handlers (e.g., `onClick={() => ...}`)
- Array mapping for repetitive elements (e.g., skills tags, project cards)
- Placeholder content for projects and contact info
- No custom hooks or context; all logic inline per component

## Dependencies & Integration
- **Tailwind CSS v4**: Integrated via `@tailwindcss/vite` plugin in `vite.config.js`
- **React 19**: Latest version with modern JSX transform
- **Vite**: Fast build tool with React plugin
- **ESLint**: Basic React linting rules

## Common Tasks
- **Refactor for Separation**: When adding new sections, create a new component file (e.g., `src/components/NewSection.jsx`) and import it into `src/App.jsx`.
- Add new sections: Append JSX to `src/App.jsx` main return statement (but refactor to separate components immediately)
- Update styles: Modify `className` strings with Tailwind utilities in the respective component file
- Add images: Place in `public/` directory and reference with `/filename`
- Customize content: Edit text and data arrays directly in the component file