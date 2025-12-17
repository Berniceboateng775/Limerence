export const CATEGORED_BOOKS = {
    "Dark Romance": [
        { id: "haunting-adeline", title: "Haunting Adeline", author: "H.D. Carlton", cover: "https://m.media-amazon.com/images/I/91zXv0ogVRL._AC_UF1000,1000_QL80_.jpg", rating: 4.5 },
        { id: "hunting-adeline", title: "Hunting Adeline", author: "H.D. Carlton", cover: "https://m.media-amazon.com/images/I/91+jXX-Wl+L._AC_UF1000,1000_QL80_.jpg", rating: 4.4 },
        { id: "god-of-malice", title: "God of Malice", author: "Rina Kent", cover: "https://m.media-amazon.com/images/I/91wW+l+vWbL._AC_UF1000,1000_QL80_.jpg", rating: 4.3 },
        { id: "hooked", title: "Hooked", author: "Emily McIntire", cover: "https://m.media-amazon.com/images/I/812C4+K+HIL._AC_UF1000,1000_QL80_.jpg", rating: 4.2 },
        { id: "does-it-hurt", title: "Does It Hurt?", author: "H.D. Carlton", cover: "https://m.media-amazon.com/images/I/81n+p+d+R+L._AC_UF1000,1000_QL80_.jpg", rating: 4.1 }
    ],
    "Sports Romance": [
        { id: "icebreaker", title: "Icebreaker", author: "Hannah Grace", cover: "https://m.media-amazon.com/images/I/81Kr+YOWewL._AC_UF1000,1000_QL80_.jpg", rating: 4.3 },
        { id: "pucking-wrong", title: "The Pucking Wrong Number", author: "C.R. Jane", cover: "https://m.media-amazon.com/images/I/81xXjW5-gKL._AC_UF1000,1000_QL80_.jpg", rating: 4.0 },
        { id: "mile-high", title: "Mile High", author: "Liz Tomforde", cover: "https://m.media-amazon.com/images/I/81N6O25+tAL._AC_UF1000,1000_QL80_.jpg", rating: 4.6 },
        { id: "blind-side", title: "The Blind Side", author: "Kandi Steiner", cover: "https://m.media-amazon.com/images/I/91y+w+d+R+L._AC_UF1000,1000_QL80_.jpg", rating: 4.2 },
        { id: "play-with-me", title: "Play With Me", author: "Becca Mack", cover: "https://m.media-amazon.com/images/I/81e5oG6K51L._AC_UF1000,1000_QL80_.jpg", rating: 4.1 }
    ],
    "Mafia Romance": [
        { id: "twisted-love", title: "Twisted Love", author: "Ana Huang", cover: "https://m.media-amazon.com/images/I/81e5oG6K51L._AC_UF1000,1000_QL80_.jpg", rating: 4.1 },
        { id: "king-of-wrath", title: "King of Wrath", author: "Ana Huang", cover: "https://m.media-amazon.com/images/I/81I7F60-XjL._AC_UF1000,1000_QL80_.jpg", rating: 4.4 },
        { id: "den-of-vipers", title: "Den of Vipers", author: "K.A. Knight", cover: "https://m.media-amazon.com/images/I/91t+w+d+R+L._AC_UF1000,1000_QL80_.jpg", rating: 4.0 },
        { id: "brutal-prince", title: "Brutal Prince", author: "Sophie Lark", cover: "https://m.media-amazon.com/images/I/91n+p+d+R+L._AC_UF1000,1000_QL80_.jpg", rating: 4.2 },
        { id: "sweetest-oblivion", title: "The Sweetest Oblivion", author: "Danielle Lori", cover: "https://m.media-amazon.com/images/I/81J-N+m+m+L._AC_UF1000,1000_QL80_.jpg", rating: 4.5 }
    ],
    "Fantasy & Faerie": [
        { id: "fourth-wing", title: "Fourth Wing", author: "Rebecca Yarros", cover: "https://m.media-amazon.com/images/I/91n7p-j5aqL._AC_UF1000,1000_QL80_.jpg", rating: 4.8 },
        { id: "acotar", title: "A Court of Thorns and Roses", author: "Sarah J. Maas", cover: "https://m.media-amazon.com/images/I/81A-mvlo+QL._AC_UF1000,1000_QL80_.jpg", rating: 4.6 },
        { id: "iron-flame", title: "Iron Flame", author: "Rebecca Yarros", cover: "https://m.media-amazon.com/images/I/91zXv0ogVRL._AC_UF1000,1000_QL80_.jpg", rating: 4.7 },
        { id: "shatter-me", title: "Shatter Me", author: "Tahereh Mafi", cover: "https://m.media-amazon.com/images/I/81e5oG6K51L._AC_UF1000,1000_QL80_.jpg", rating: 4.3 },
        { id: "powerless", title: "Powerless", author: "Lauren Roberts", cover: "https://m.media-amazon.com/images/I/91wW+l+vWbL._AC_UF1000,1000_QL80_.jpg", rating: 4.5 }
    ]
};

export const TOP_BOOKS = [
    ...CATEGORED_BOOKS["Fantasy & Faerie"],
    ...CATEGORED_BOOKS["Dark Romance"].slice(0,2),
     ...CATEGORED_BOOKS["Sports Romance"].slice(0,2)
];

export const AUTHORS = [
    { name: "Colleen Hoover", img: "https://images.gr-assets.com/authors/1603912953p8/5430144.jpg" },
    { name: "Sarah J. Maas", img: "https://images.gr-assets.com/authors/1690906963p8/3433047.jpg" },
    { name: "Elsie Silver", img: "https://images.gr-assets.com/authors/1655924765p8/21573507.jpg" },
    { name: "Ana Huang", img: "https://images.gr-assets.com/authors/1614801127p8/5762691.jpg" },
    { name: "H.D. Carlton", img: "https://images.gr-assets.com/authors/1643144884p8/20063260.jpg" }
];
