# Portfolio Website

This is a simple portfolio website built with React, Vite, and Tailwind CSS.

## Setup and Installation

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd portfolio-website
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Running the Development Server

To run the application in development mode:

```bash
npm run dev
```

This will start the Vite development server, and you can view the application in your browser (usually at `http://localhost:5173`).

## Building for Production

To build the application for production:

```bash
npm run build
```

This will create a `dist` directory with the optimized production build.

## Tailwind CSS

This project uses Tailwind CSS for styling. The configuration is in `tailwind.config.js`, and the main CSS file (`src/index.css`) includes the necessary Tailwind directives.

**Note on Editor Warnings**: You might see "Unknown at rule @tailwind" warnings in `src/index.css` in your editor. These are typically editor/linter integration issues and do not affect the application's build or runtime.
