/**
 * Portfolio projects data.
 * Pure data — separated from route logic.
 */

module.exports = [
    {
        name: 'ORCUBE',
        description: 'Scalable property rental web app using React.js, Redux Toolkit, Node.js, and MongoDB with secure JWT/OTP authentication. Integrated Stripe payments, AWS S3 image storage, and interactive maps (Mapbox/Google Maps). Deployed via Docker on VPS with Nginx reverse proxy, UFW firewall, and automated email notifications via Nodemailer.',
        tech: ['React.js', 'Redux Toolkit', 'Node.js', 'MongoDB', 'Stripe', 'AWS S3', 'Docker', 'Nginx', 'Mapbox'],
        url: null,
    },
    {
        name: 'AnimusDigital',
        description: 'Full-featured e-commerce platform with Node.js, Express, MongoDB, featuring user/admin dashboards, cart, wishlist, and order management. Integrated PayPal payment gateway and Twilio OTP verification; implemented coupon system and sales analytics dashboard for admins. Deployed on AWS EC2 with Nginx reverse proxy, SSL certificates, and automated backup systems.',
        tech: ['Node.js', 'Express', 'MongoDB', 'PayPal', 'Twilio', 'AWS EC2', 'Nginx'],
        url: null,
    },
    {
        name: 'TgStreamer',
        description: 'Telegram bot that generates direct HTTP streaming URLs for media files using TypeScript, mtcute, and Node.js. Implements full HTTP range request support for seamless video seeking in VLC, browsers, and media players. Features configurable rate limiting, user authorization, and multi-format support (videos, audio, documents). Deployed on Hetzner VPS.',
        tech: ['TypeScript', 'Node.js', 'mtcute', 'HTTP Streaming'],
        url: 'https://t.me/tgflixrobot',
    },
];
