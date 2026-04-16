package com.moviepicker.moviepicker;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class TMDbService {

    @Value("${tmdb.api.key}")
    private String apiKey;

    @Value("${tmdb.base.url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    //  POPULAR & TOP RATED

    public String getPopularMovies(int page) {
        String url = baseUrl + "/movie/popular?api_key=" + apiKey + "&language=en-US&page=" + page;
        return restTemplate.getForObject(url, String.class);
    }

    public String getTopRatedMovies() {
        String url = baseUrl + "/movie/top_rated?api_key=" + apiKey + "&language=en-US&page=1";
        return restTemplate.getForObject(url, String.class);
    }

    //  SEARCH

    public String searchMovies(String query, int page) {
        String url = baseUrl + "/search/movie?api_key=" + apiKey + "&query=" + query + "&language=en-US&page=" + page;
        return restTemplate.getForObject(url, String.class);
    }

    //  DISCOVER

    public String getMoviesByGenre(String genreId) {
        String url = baseUrl + "/discover/movie?api_key=" + apiKey + "&with_genres=" + genreId + "&sort_by=popularity.desc";
        return restTemplate.getForObject(url, String.class);
    }

    public String discoverMovies(String genreIds, String minRuntime, String maxRuntime,
                                 String startYear, String endYear, String sortBy, int page) {
        String sort = (sortBy != null && !sortBy.isEmpty()) ? sortBy : "vote_average.desc";
        StringBuilder url = new StringBuilder(baseUrl + "/discover/movie?api_key=" + apiKey
                + "&language=en-US&sort_by=" + sort + "&vote_count.gte=50&page=" + page);
        if (genreIds != null && !genreIds.isEmpty())
            url.append("&with_genres=").append(genreIds);
        if (minRuntime != null && !minRuntime.isEmpty())
            url.append("&with_runtime.gte=").append(minRuntime);
        if (maxRuntime != null && !maxRuntime.isEmpty())
            url.append("&with_runtime.lte=").append(maxRuntime);
        if (startYear != null && !startYear.isEmpty())
            url.append("&primary_release_date.gte=").append(startYear).append("-01-01");
        if (endYear != null && !endYear.isEmpty())
            url.append("&primary_release_date.lte=").append(endYear).append("-12-31");
        return restTemplate.getForObject(url.toString(), String.class);
    }

    public String getMoviesByYearRange(String startYear, String endYear) {
        String url = baseUrl + "/discover/movie?api_key=" + apiKey
                + "&primary_release_date.gte=" + startYear + "-01-01"
                + "&primary_release_date.lte=" + endYear + "-12-31"
                + "&sort_by=popularity.desc";
        return restTemplate.getForObject(url, String.class);
    }

    //RANDOM

    public String getRandomMovie() {
        int randomPage = (int) (Math.random() * 20) + 1;
        String url = baseUrl + "/movie/popular?api_key=" + apiKey + "&page=" + randomPage;
        return restTemplate.getForObject(url, String.class);
    }

    //  MOVIE DETAILS

    public String getMovieCredits(String movieId) {
        String url = baseUrl + "/movie/" + movieId + "/credits?api_key=" + apiKey + "&language=en-US";
        return restTemplate.getForObject(url, String.class);
    }

    public String getMovieDetails(String movieId) {
        String url = baseUrl + "/movie/" + movieId + "?api_key=" + apiKey + "&language=en-US";
        return restTemplate.getForObject(url, String.class);
    }

    public String getMovieVideos(String movieId) {
        String url = baseUrl + "/movie/" + movieId + "/videos?api_key=" + apiKey + "&language=en-US";
        return restTemplate.getForObject(url, String.class);
    }
}
