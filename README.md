# ARM Viewer

ARM Viewer is a SvelteKit-based application for visualizing application reference models. It allows users to upload structured data (e.g., CSV or Excel files), group and filter the data, and apply conditional formatting rules for better visualization.

## Features

- **Data Upload**: Upload `.xlsx` files to visualize hierarchical data.
- **Grouping**: Group data into multiple levels (N1, N2, N3, and applications).
- **Filtering**: Filter data at each level to focus on specific subsets.
- **Conditional Formatting**: Define rules to highlight data with emojis and styles.
- **Responsive Design**: Automatically adjusts to different screen sizes.

## Project Structure

```
├── src/
│   ├── app.d.ts                # Global TypeScript definitions
│   ├── app.html                # HTML template for the app
│   ├── lib/
│   │   ├── components/         # Svelte components
│   │   │   ├── AppMap.svelte               # Main visualization component
│   │   │   ├── Sidebar.svelte              # Sidebar for filtering and display options
│   │   │   ├── NLevelView.svelte           # Component for hierarchical views
│   │   │   ├── ConditionalFormatDialogue.svelte # Conditional formatting UI
│   │   ├── types.d.ts          # TypeScript type definitions
│   ├── routes/
│   │   ├── +layout.svelte      # Layout for the app
│   │   ├── +page.svelte        # Main page of the app
├── static/
│   ├── css/
│   │   ├── app.css             # Custom styles for the app
├── svelte.config.js            # SvelteKit configuration
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
```



## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/arm-viewer.git
   cd arm-viewer
    ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173` to view the application.


## Usage
1. Upload a `.xlsx` file using the upload button.
2. Use the sidebar to group and filter the data by N1, N2, N3, and applications.
3. Define conditional formatting rules to highlight specific data points.
4. Explore the hierarchical views of the data.

## Scripts
* `npm run dev`: Start the development server.
* `npm run build`: Build the application for production.
* `npm run preview`: Preview the production build locally.
* `npm run lint`: Run ESLint to check for code quality issues.
* `npm run prettier`: Format the code using Prettier.


## Dependencies
- [SvelteKit](https://kit.svelte.dev/): Framework for building Svelte applications.
- [Vite](https://vitejs.dev/): Build tool that provides a fast development environment.
- [XLSX](): Library for parsing and writing spreadsheet files.

