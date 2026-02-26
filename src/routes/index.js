const express = require('express');
const router = express.Router();
const { SITE_URL } = require('../config');
const { getAllPosts, getLatestPosts, getTrendingPosts, getTagCounts } = require('../content/cache');

const MAX_RECENT = 5;

router.get('/', (req, res) => {
    // Dynamically require so hot reloading works when require.cache is cleared
    const projects = require('../../content/projects');
    const resume = require('../../content/resume');

    const allPosts = getAllPosts();

    res.render('index', {
        title: 'Ayyappan Pillai — Full-Stack Developer',
        description: 'MERN Stack · Cloud Infrastructure',
        url: '/',
        siteUrl: SITE_URL,
        posts: allPosts.slice(0, MAX_RECENT),
        hasMore: allPosts.length > MAX_RECENT,
        allTags: getTagCounts(),
        projects,
        resume,
        latestPosts: getLatestPosts(3),
        trendingPosts: getTrendingPosts(3),
    });
});

module.exports = router;
