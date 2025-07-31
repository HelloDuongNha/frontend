# Note Taking App

A modern, clean UI for a note-taking application built with Vue 3. This app allows users to create and manage notes, organize them with tags, and includes user authentication with admin capabilities.

## Features

- 📝 Create, edit, view and delete notes
- 🏷️ Tag notes for easy organization and filtering
- 🗓️ Calendar view to see notes by date
- 🔍 Search functionality
- 🗑️ Trash management for deleted notes
- 👤 User authentication and account management
- 👑 Admin panel to manage users and their content
- 📱 Mobile responsive design

## Project Structure

```
client/
├── src/
│   ├── assets/          # Images and static assets
│   ├── components/      # Reusable UI components
│   │   ├── AppHeader.vue
│   │   ├── NoteCard.vue
│   │   ├── NoteForm.vue
│   │   ├── Sidebar.vue
│   │   ├── TagBadge.vue
│   │   ├── TagForm.vue
│   │   ├── UserEditModal.vue
│   │   └── UserProfileModal.vue
│   ├── helpers/         # Utility functions and API
│   │   ├── api.js       # API functions and authentication
│   │   └── utils.js     # Helper functions
│   ├── views/           # Page components
│   │   ├── AllUsers.vue
│   │   ├── Auth.vue
│   │   ├── Calendar.vue
│   │   ├── Home.vue
│   │   ├── TagDetail.vue
│   │   ├── Tags.vue
│   │   ├── Trash.vue
│   │   ├── UserDetail.vue
│   │   └── UserTagNotes.vue
│   ├── App.vue          # Root layout component
│   ├── index.css        # Global CSS
│   ├── main.js          # Entry point
│   └── router.js        # Vue Router configuration
└── public/              # Public static files

server/
├── api/
│   ├── controllers/     # API endpoint controllers
│   │   ├── noteController.js
│   │   ├── tagController.js
│   │   └── userController.js
│   ├── models/          # Database models
│   │   ├── noteModel.js
│   │   ├── tagModel.js
│   │   └── userModel.js
│   ├── routes/          # API routes
│   │   ├── noteRoute.js
│   │   ├── tagRoute.js
│   │   └── userRoute.js
│   └── utils/           # Utility functions
│       └── emailService.js
└── app.js               # Express server setup
```

## Setup Instructions

1. **Install dependencies**

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

2. **Set up environment variables**

Create a `.env` file in the server directory with the following content:

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/note-taking-app
JWT_SECRET=your_jwt_secret_key_here
```

3. **Start the development servers**

```bash
# Start the server
cd server
npm start

# In a separate terminal, start the client
cd client
npm run serve
```

4. **Build for production**

```bash
cd client
npm run build
```

## Technologies Used

- **Frontend**
  - Vue 3 - Front-end framework
  - Vue Router - Client-side routing
  - SweetAlert2 - Notifications and dialogs
  - CSS Variables - For theming and consistent styling

- **Backend**
  - Node.js/Express - Server framework
  - MongoDB - Database
  - JWT - Authentication

## API Endpoints

### Notes
- `GET /api/notes` - Get all notes for current user
- `GET /api/notes/:id` - Get a specific note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Move note to trash
- `DELETE /api/notes/:id/permanent` - Permanently delete a note

### Tags
- `GET /api/tags` - Get all tags for current user
- `GET /api/tags/:id` - Get a specific tag with its notes
- `POST /api/tags` - Create a new tag
- `PUT /api/tags/:id` - Update a tag
- `DELETE /api/tags/:id` - Delete a tag

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a specific user
- `GET /api/users/:id/stats` - Get user statistics (notes, tags)
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

## License

This project is open-source and available under the MIT License.
