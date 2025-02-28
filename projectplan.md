Project Manager Report: Wavelength Web Game Development
Prepared for: Development Team
Prepared by: [Your Name]
Date: [Today's Date]
Project Hosting: GitHub Pages (Frontend) + Minimal Backend (WebSockets on Render/Vercel)
1. Project Summary
The Wavelength Web Game is a multiplayer, browser-based game where up to 30 players can participate in a single session. Players are presented with a scale with two opposing concepts (e.g., “Outdated Curriculum” vs. “Modern Curriculum”), and they must guess where a given clue fits on the scale.

The game will be used in team sessions, with questions based on the Curriculum Roadmap 2025. A real-time leaderboard tracks scores, and players can enter their names for session tracking.

2. User Experience (UX) Overview
Game Flow:
Game Start

Players visit the GitHub Pages-hosted Angular app.
They enter their name and join a game session.
The first player to join becomes the session host.
Round Mechanics

A random clue is placed on the scale (e.g., “Updated curriculum approach”).
Players guess where it belongs using a slider.
After all guesses, the correct position is revealed.
Points are awarded based on proximity to the correct answer.
Leaderboard

Scores are updated in real-time.
The leaderboard ranks all players.
Game Completion

The game continues for X rounds (configurable).
At the end, a winner is announced.
3. Features & Functional Breakdown
Core Features
✅ Multiplayer (Up to 30 Players)

WebSockets (Socket.io) for real-time updates.
Minimal backend to sync player actions.
✅ Customizable Player Experience

Players enter their name at the start.
Their scores persist throughout the session.
✅ Scale-Based Gameplay

Dynamic slider input for guessing placement.
Adjustable game parameters (e.g., round count).
✅ Real-Time Leaderboard

Updates dynamically after each round.
Tracks scores without storing user data long-term.
✅ Lightweight Backend

In-memory game state (resets after session).
Hosted on Render/Vercel (low-cost server).
✅ Fully Browser-Based

No installations required.
Works across desktop & mobile devices.
4. Tech Stack
Frontend (Angular)
Angular 17+ (SPA framework)
Tailwind CSS (UI styling)
RxJS (State management for real-time updates)
Angular Router (For navigation)
Backend (Minimal WebSocket Server)
Node.js + Express
Socket.io (Real-time multiplayer sync)
Deployed on: Render/Vercel
Hosting & Deployment
Frontend: GitHub Pages
Backend: Render/Vercel (WebSockets only, minimal server)
Data Storage: None (Session-based, resets after each game)
5. Folder Structure
pgsql
Copy
Edit
wavelength-game/
│── frontend/  (Angular App - Hosted on GitHub Pages)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  (Game UI components)
│   │   │   ├── services/  (Game logic, WebSocket communication)
│   │   │   ├── pages/  (Main game screens)
│   │   │   ├── app.module.ts  (Module definitions)
│   │   │   ├── app.component.ts  (Main entry point)
│   │   ├── assets/  (Images, icons)
│   │   ├── styles.css  (Global styles)
│   ├── angular.json  (Angular config)
│   ├── package.json  (Dependencies)
│   ├── README.md  (Documentation)
│
│── backend/  (Minimal Node.js server - Hosted on Render/Vercel)
│   ├── server.js  (WebSocket server logic)
│   ├── package.json  (Dependencies)
│   ├── README.md  (Server documentation)
│
│── docs/  (Project documentation)
│   ├── instructions.md  (Guidelines for developers)
│   ├── memory.md  (Tracks game state and bug fixes)
│   ├── .cursorrules  (Cursor project rules)
│── README.md  (Project overview)
6. Development Timeline
Phase	Tasks	Timeline
Week 1	Setup Angular project, wireframing	March 4 - 8
Week 2	Implement game logic (scale, guessing)	March 9 - 15
Week 3	Develop multiplayer WebSockets & state sync	March 16 - 22
Week 4	Add Curriculum-based questions	March 23 - 29
Week 5	UI improvements & mobile responsiveness	March 30 - April 5
Week 6	Testing & debugging	April 6 - 12
Week 7	Deployment & final review	April 13 - 19
April 20	Game Ready for Team Session!	April 20
7. Special Files & Instructions
1. .cursorrules
This file defines Cursor project rules, ensuring coding conventions and best practices are followed.
Developers should read and adhere to these rules when coding.
2. instructions.md
Contains developer guidelines for setting up, running, and modifying the project.
Includes deployment steps for GitHub Pages & WebSockets.
3. memory.md
Tracks game state, bug reports, and fixes.
Developers should log all changes and debugging steps here.
8. Action Items for the Dev Team
✅ Frontend

Setup Angular project & component structure.
Implement game board & scale slider.
Connect to WebSocket backend.
✅ Backend

Build a minimal WebSocket server.
Manage real-time player state (game synchronization).
Deploy to Render/Vercel.
✅ Deployment

Automate GitHub Pages deployment for frontend.
Ensure WebSocket server auto-restarts on session reset.
✅ Testing & Finalization

Conduct internal playtests.
Ensure cross-browser compatibility.
Gather team feedback before the session.