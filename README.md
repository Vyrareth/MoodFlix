# MoodFlix

A full-stack movie recommendation web app that suggests films based on your current mood. Built with Java Spring Boot on the backend and vanilla HTML/CSS/JavaScript on the frontend, powered by the [TMDb API](https://www.themoviedb.org/).

---

## Features

- **Mood Quiz** — Answer 6 questions and get 15 personalized movie recommendations powered by a custom genre-scoring algorithm
- **Popular Movies** — Browse 100 trending movies per page with animated Tron-style pagination
- **Search & Filter** — Search by title or filter by genre, year range, and sort order (up to 160 results at once)
- **Random Movie** — Roll an animated dice to get a completely random movie pick
- **Movie Detail Modal** — Click any movie to see its trailer (YouTube embed), full cast, director, runtime, budget, and rating

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot, Maven |
| HTTP Client | Spring RestTemplate |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| API | TMDb REST API |
| Animations | CSS keyframes (Tron light cycle, dice roll, page transitions) |

---

## How It Works

The Java backend acts as a secure middleware layer between the browser and TMDb. The API key never reaches the client, all requests flow through Spring Boot's `MovieController`, which delegates to `TMDbService` to build and execute the TMDb API calls. The frontend receives clean JSON and dynamically builds the UI.

### Quiz Algorithm

The mood quiz uses a weighted genre-scoring system. Each of the 5 scored questions maps answers to TMDb genre IDs with point values. For example, picking "Excited" adds +3 to Action, +2 to Adventure, +2 to War, and +2 to Fantasy. All five answers stack their points together, and the top 2 scoring genres are sent to TMDb's discover endpoint using OR logic — so you get movies from either genre rather than requiring both.

---

## Getting Started

### Prerequisites
- Java 17+
- Maven
- A free TMDb API key → [Get one here](https://www.themoviedb.org/settings/api)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/moodflix.git
   cd moodflix
   ```

2. **Configure your API key**
   ```bash
   cp src/main/resources/application.properties.example src/main/resources/application.properties
   ```
   Then open `application.properties` and replace `YOUR_TMDB_API_KEY_HERE` with your actual key.

3. **Run the app**
   ```bash
   ./mvnw spring-boot:run
   ```

4. **Open in browser**
   ```
   http://localhost:8080
   ```

---

## Project Structure

```
src/
├── main/
│   ├── java/com/moviepicker/moviepicker/
│   │   ├── MoviePickerApplication.java   # Spring Boot entry point
│   │   ├── MovieController.java          # REST endpoints (/api/movies/...)
│   │   └── TMDbService.java              # TMDb API integration
│   └── resources/
│       ├── application.properties.example
│       └── static/
│           ├── index.html                # Single-page frontend
│           ├── css/style.css             # Tron-themed styling + animations
│           └── js/app.js                 # All frontend logic
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/movies/popular?page=` | Trending movies |
| GET | `/api/movies/search?query=&page=` | Search by title |
| GET | `/api/movies/discover` | Filter by genre, year, runtime, sort |
| GET | `/api/movies/random` | Random movie |
| GET | `/api/movies/{id}/details` | Full movie info |
| GET | `/api/movies/{id}/credits` | Cast & crew |
| GET | `/api/movies/{id}/videos` | Trailer (YouTube) |

---

*Built as a Java final project, first full-stack project.*
