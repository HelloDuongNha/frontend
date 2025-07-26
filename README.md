# Note Taking App

A modern, clean UI for a note-taking application built with Vue 3. This app allows users to manage notes, organize them in folders, and tag them for easy searching and filtering.

## Features

- 📝 Create, edit, delete notes
- 📁 Organize notes in folders
- 🏷️ Tag notes for easy filtering
- 🗓️ Calendar view to see notes by date
- 🔍 Search functionality
- 📱 Mobile responsive design

## Project Structure

```
src/
├── assets/           # Images and static assets
├── components/       # Reusable UI components
│   ├── AppHeader.vue
│   ├── FolderCard.vue
│   ├── NoteCard.vue
│   └── Sidebar.vue
├── helpers/          # Utility functions and API
│   ├── api.js        # Axios instance and API functions
│   └── utils.js      # Helper functions (formatDate, etc)
├── views/            # Page components
│   ├── Archive.vue
│   ├── Calendar.vue
│   ├── Home.vue
│   ├── Tags.vue
│   └── Trash.vue
├── App.vue           # Root layout component
├── index.css         # Global CSS
├── main.js           # Entry point
└── router.js         # Vue Router configuration
```

## Setup Instructions

1. **Install dependencies**

```bash
npm install
```

2. **Set up environment variables**

Create a `.env.local` file in the root directory with the following content:

```
VUE_APP_API_URL=http://localhost:3000
```

3. **Start the development server**

```bash
npm run serve
```

4. **Build for production**

```bash
npm run build
```

## Technologies Used

- Vue 3 - Front-end framework
- Vue Router - Client-side routing
- Axios - HTTP client for API requests
- CSS Variables - For theming and consistent styling

## Backend Integration

This frontend is designed to work with a Node.js/Express backend with MongoDB. The API endpoints include:

- `GET /notes/user?userId=...` - Get all notes
- `GET /tags/user?userId=...` - Get all tags
- `POST /notes` - Create a new note
- `PUT /notes/:id` - Update a note
- `DELETE /notes/:id` - Delete a note
- `POST /tags` - Create a new tag
- `DELETE /tags/:id` - Delete a tag

## License

This project is open-source and available under the MIT License.
