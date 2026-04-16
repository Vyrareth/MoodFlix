package com.moviepicker.moviepicker;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    @Autowired
    private TMDbService tmdbService;

    @GetMapping("/popular")
    public String getPopularMovies(@RequestParam(defaultValue = "1") int page) {
        return tmdbService.getPopularMovies(page);
    }

    @GetMapping("/toprated")
    public String getTopRatedMovies() {
        return tmdbService.getTopRatedMovies();
    }

    @GetMapping("/search")
    public String searchMovies(@RequestParam String query,
                               @RequestParam(defaultValue = "1") int page) {
        return tmdbService.searchMovies(query, page);
    }

    @GetMapping("/genre")
    public String getMoviesByGenre(@RequestParam String genreId) {
        return tmdbService.getMoviesByGenre(genreId);
    }

    @GetMapping("/byyear")
    public String getMoviesByYearRange(@RequestParam String startYear, @RequestParam String endYear) {
        return tmdbService.getMoviesByYearRange(startYear, endYear);
    }

    @GetMapping("/random")
    public String getRandomMovie() {
        return tmdbService.getRandomMovie();
    }

    @GetMapping("/discover")
    public String discoverMovies(
            @RequestParam(required = false) String genreIds,
            @RequestParam(required = false) String minRuntime,
            @RequestParam(required = false) String maxRuntime,
            @RequestParam(required = false) String startYear,
            @RequestParam(required = false) String endYear,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "1") int page) {
        return tmdbService.discoverMovies(genreIds, minRuntime, maxRuntime, startYear, endYear, sortBy, page);
    }

    @GetMapping("/{id}/credits")
    public String getMovieCredits(@PathVariable String id) {
        return tmdbService.getMovieCredits(id);
    }

    @GetMapping("/{id}/details")
    public String getMovieDetails(@PathVariable String id) {
        return tmdbService.getMovieDetails(id);
    }

    @GetMapping("/{id}/videos")
    public String getMovieVideos(@PathVariable String id) {
        return tmdbService.getMovieVideos(id);
    }
}
