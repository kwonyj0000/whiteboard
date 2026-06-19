# Collaborative Whiteboard

A real-time collaborative whiteboard application built with vanilla JavaScript and Supabase.

## Features

- ✏️ **Canvas Drawing**: Smooth freehand drawing with multiple brush sizes
- 📝 **Sticky Notes**: Add, edit, and drag sticky notes anywhere on the board
- ⏪ **Undo/Redo**: Full history management (20 actions)
- 🔄 **Real-time Sync**: See other users' changes in real-time via Supabase
- 💾 **Persistent Storage**: Data saved to Supabase (with localStorage fallback)
- 📱 **Responsive**: Works on desktop, tablet, and mobile
- 🎨 **Clean UI**: Modern, minimal interface

## Tech Stack

- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript (ES6 modules)
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Canvas**: HTML5 Canvas API for drawing
- **Storage**: Supabase Database with localStorage fallback

## Quick Start

### Option 1: localStorage Only (No Setup Required)

1. Open `index.html` in your browser
2. Start drawing!

Data is saved locally in your browser. No server needed.

### Option 2: Supabase Backend (Full Collaboration)

1. **Set up Supabase** (one-time setup):
   - Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Create a Supabase project
   - Run the SQL schema
   - Get your API credentials

2. **Configure the app**:
   - Edit `js/config.js` and add your Supabase URL and anon key
   - Or copy `.env.example` to `.env` (if using a bundler)

3. **Open in browser**:
   ```bash
   # Option A: Direct file open
   open index.html

   # Option B: Local server (recommended for testing)
   python3 -m http.server 8080
   # Then visit http://localhost:8080
   ```

4. **Test collaboration**:
   - Open in two browser windows
   - Draw in one → see it in the other!

## Project Structure

```
Whiteboard/
├── index.html                 # Main HTML file
├── css/
│   ├── variables.css          # CSS custom properties (theme)
│   ├── layout.css             # Layout and responsive styles
│   └── components.css         # Component styles
├── js/
│   ├── main.js                # Application entry point
│   ├── config.js              # Configuration (Supabase credentials)
│   ├── supabase-client.js     # Supabase API wrapper
│   ├── storage.js             # localStorage fallback
│   ├── canvas.js              # Canvas rendering
│   ├── strokes.js             # Stroke data structures
│   ├── stickyNotes.js         # Sticky note logic
│   └── undo.js                # Undo/redo stack
├── supabase-schema.sql        # Database schema
├── .env.example               # Environment variable template
├── SUPABASE_SETUP.md          # Supabase setup guide
└── README.md                  # This file
```

## Usage

### Drawing

- **Click and drag** to draw freehand strokes
- **Choose brush size**: Thin, Medium, or Thick (toolbar buttons)
- **Touch support**: Works on tablets and touch screens

### Sticky Notes

- **Add note**: Click "📝 Add Note" button
- **Edit**: Click inside a note to type
- **Move**: Drag the note header
- **Delete**: Select the note and press Delete key (or click 🗑 Delete button)

### Keyboard Shortcuts

- **Ctrl+Z / Cmd+Z**: Undo
- **Ctrl+Y / Cmd+Y**: Redo (also Ctrl+Shift+Z)
- **Delete / Backspace**: Delete selected item

### Toolbar

- **Brush sizes**: Thin / Medium / Thick
- **Undo / Redo**: Step through history
- **Delete**: Remove selected stroke or note
- **Add Note**: Create a new sticky note
- **Clear All**: Delete everything (with confirmation)
- **Connection status**: Shows Supabase connection (green = connected)

## Architecture

### Data Flow

```
User Action
  → Event Handler (main.js)
  → Update Local State (state.strokes / state.stickyNotes)
  → Save to Backend (Supabase or localStorage)
  → Re-render UI
```

### Real-time Sync

```
User A draws
  → saveStroke() → Supabase INSERT
  → Supabase broadcasts via WebSocket
  → User B receives → handleRemoteStroke()
  → User B's canvas updates
```

### Fallback Strategy

1. App checks if Supabase is configured (`config.js`)
2. If configured → Try to connect
3. If connection fails → Fall back to localStorage
4. User sees connection status in toolbar

## Database Schema

### Tables

- **sessions**: Whiteboard sessions (by name)
- **strokes**: Drawing strokes (points, brush size)
- **sticky_notes**: Sticky notes (content, position)

### Indexes

- `strokes.session_id`
- `sticky_notes.session_id`

See `supabase-schema.sql` for full schema.

## Configuration

### `js/config.js`

```javascript
export const config = {
    supabase: {
        url: 'YOUR_SUPABASE_URL',
        anonKey: 'YOUR_SUPABASE_ANON_KEY'
    },
    defaultSessionName: 'default',
    useLocalStorage: false  // Set true to force localStorage mode
};
```

### Session Management

Currently, all users share a single session (`'default'`).

**Future enhancement**: Add UI to create/join named sessions for separate whiteboards.

## Development

### No Build Step Required

This project uses **ES6 modules** loaded directly in the browser. No bundler needed.

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6 modules support required
- Canvas API support required

### Local Development Server

```bash
# Python 3
python3 -m http.server 8080

# Node.js (if you have `http-server` installed)
npx http-server -p 8080

# PHP
php -S localhost:8080
```

## Deployment

### Static Hosting (Vercel, Netlify, GitHub Pages)

1. **Set Supabase credentials** in `js/config.js`
2. **Deploy** the entire `Whiteboard/` folder
3. Done! No build step needed.

### Environment Variables (Optional)

If you want to use `.env` files:

1. Add a bundler (Vite, Webpack, Parcel)
2. Configure it to inject `import.meta.env.SUPABASE_URL`
3. Update `config.js` to read from env vars

Example with Vite:
```bash
npm init -y
npm install vite
# Update package.json: "dev": "vite"
npm run dev
```

## Security

### Current Setup (Development)

- **Public access**: Anyone can read/write
- **No authentication**: No user accounts
- **Shared session**: All users see the same board

⚠️ This is fine for demos but **NOT production-ready**.

### Recommended for Production

1. **Enable Supabase Auth**:
   ```javascript
   await supabase.auth.signUp({ email, password })
   ```

2. **Add Row Level Security (RLS)**:
   ```sql
   CREATE POLICY "Users access own sessions" ON sessions
   FOR ALL USING (user_id = auth.uid());
   ```

3. **Rate limiting**: Prevent abuse via Supabase Edge Functions

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for details.

## Limitations

### Current Version

- Single shared session (no multi-room support yet)
- No user authentication
- No stroke/note owners (anyone can delete anything)
- No export to PNG/SVG

### Supabase Free Tier Limits

- 500 MB database storage
- 2 GB bandwidth/month
- 200 concurrent realtime connections

Typical usage:
- **Small team (2-5 users)**: Free tier OK
- **Medium team (10-20 users)**: May need Pro plan ($25/month)

## Roadmap

- [ ] Multi-session UI (create/join named rooms)
- [ ] User authentication (Supabase Auth)
- [ ] Export to PNG/SVG
- [ ] Color picker for strokes
- [ ] Eraser tool
- [ ] Shapes (rectangle, circle, arrow)
- [ ] Text tool (not just sticky notes)
- [ ] Zoom and pan
- [ ] Mobile touch improvements

## Troubleshooting

### Connection status shows "Disconnected"

- Check `js/config.js` for correct credentials
- Check browser console for errors
- Verify Supabase project is active

### Real-time not working

- Enable replication in Supabase: **Database → Replication**
- Check RLS policies allow INSERT/UPDATE/DELETE
- Check browser console for subscription errors

### Data not persisting

- **Supabase mode**: Check database in Supabase dashboard → Table Editor
- **localStorage mode**: Check browser DevTools → Application → Local Storage

### CORS errors

- Supabase allows all origins by default in dev
- For production, configure in **Authentication → URL Configuration**

## Contributing

This is a learning project. Feel free to fork and experiment!

### Code Style

- ES6+ JavaScript (no TypeScript)
- Functional programming (no classes)
- CSS variables for theming
- Comments for non-obvious logic

## License

MIT License - feel free to use for learning, demos, or commercial projects.

## Credits

Built with:
- [Supabase](https://supabase.com) - Backend and real-time
- HTML5 Canvas API - Drawing
- Pure JavaScript - No frameworks!

---

**Questions?** See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) or check the code comments.
