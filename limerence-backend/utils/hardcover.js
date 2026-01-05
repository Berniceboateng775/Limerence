/**
 * Hardcover.app GraphQL API Utility
 * 
 * NOTE: Hardcover is CASE-SENSITIVE for title matching!
 * We convert search input to Title Case for matching.
 */

const HARDCOVER_ENDPOINT = 'https://api.hardcover.app/v1/graphql';

/**
 * Convert string to Title Case
 */
const toTitleCase = (str) => {
    return str.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

/**
 * Execute a GraphQL query
 */
const executeQuery = async (query, variables = {}) => {
    const token = process.env.HARDCOVER_API_KEY;
    
    if (!token) {
        console.error('HARDCOVER_API_KEY not found!');
        return null;
    }
    
    try {
        const response = await fetch(HARDCOVER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': token
            },
            body: JSON.stringify({ query, variables })
        });
        
        if (!response.ok) {
            console.error('Hardcover API error:', response.status);
            return null;
        }
        
        const data = await response.json();
        if (data.errors) {
            console.error('Hardcover GraphQL errors:', JSON.stringify(data.errors));
            return null;
        }
        
        return data.data;
    } catch (error) {
        console.error('Hardcover fetch error:', error.message);
        return null;
    }
};

/**
 * Search books by exact title (case-sensitive, tries Title Case)
 */
const searchBooks = async (searchQuery, limit = 20) => {
    const titleCase = toTitleCase(searchQuery.trim());
    
    console.log(`Hardcover searching for: "${titleCase}"`);
    
    // Simple query without taggings (tag_type field doesn't exist)
    const query = `
        query SearchBooks($title: String!) {
            books(where: {title: {_eq: $title}}, limit: ${limit}) {
                id
                slug
                title
                description
                cached_image
                cached_contributors
                users_count
                rating
                ratings_count
                book_series {
                    position
                    series {
                        id
                        name
                    }
                }
            }
        }
    `;
    
    // Try Title Case first
    let data = await executeQuery(query, { title: titleCase });
    
    // If no results, try original input
    if (!data?.books?.length && titleCase !== searchQuery.trim()) {
        console.log(`No results for "${titleCase}", trying original: "${searchQuery.trim()}"`);
        data = await executeQuery(query, { title: searchQuery.trim() });
    }
    
    if (!data?.books?.length) {
        console.log(`Hardcover: No exact match for "${searchQuery}"`);
        return [];
    }
    
    console.log(`Hardcover: Found ${data.books.length} results for "${searchQuery}"`);
    
    return data.books.map(book => ({
        id: book.id,
        slug: book.slug,
        title: book.title,
        description: book.description,
        author: extractAuthor(book.cached_contributors),
        cover: book.cached_image?.url || null,
        rating: book.rating || 0,
        ratingsCount: book.ratings_count || 0,
        usersCount: book.users_count || 0,
        series: book.book_series?.[0] ? {
            id: book.book_series[0].series?.id,
            name: book.book_series[0].series?.name,
            position: book.book_series[0].position
        } : null,
        source: 'hardcover'
    }));
};

/**
 * Get book details by ID
 */
const getBookById = async (bookId) => {
    const query = `
        query GetBook($bookId: Int!) {
            books(where: {id: {_eq: $bookId}}, limit: 1) {
                id
                slug
                title
                subtitle
                description
                release_date
                pages
                cached_image
                cached_contributors
                users_count
                users_read_count
                rating
                ratings_count
                book_series {
                    position
                    series {
                        id
                        name
                        slug
                        books_count
                    }
                }
            }
        }
    `;
    
    const data = await executeQuery(query, { bookId: parseInt(bookId) });
    
    if (!data?.books?.[0]) return null;
    
    const book = data.books[0];
    
    return {
        id: book.id,
        slug: book.slug,
        title: book.title,
        subtitle: book.subtitle,
        description: book.description,
        authors: [{ name: extractAuthor(book.cached_contributors) }],
        cover: book.cached_image?.url || null,
        rating: book.rating || 0,
        ratingsCount: book.ratings_count || 0,
        usersCount: book.users_count || 0,
        readCount: book.users_read_count || 0,
        pages: book.pages,
        releaseDate: book.release_date,
        series: book.book_series?.[0] ? {
            id: book.book_series[0].series?.id,
            name: book.book_series[0].series?.name,
            slug: book.book_series[0].series?.slug,
            position: book.book_series[0].position,
            totalBooks: book.book_series[0].series?.books_count
        } : null,
        source: 'hardcover'
    };
};

/**
 * Find book by exact title
 */
const findBookByTitle = async (title) => {
    const titleCase = toTitleCase(title.trim());
    
    const query = `
        query FindBook($title: String!) {
            books(where: {title: {_eq: $title}}, limit: 1) {
                id
                slug
                title
                subtitle
                description
                release_date
                pages
                cached_image
                cached_contributors
                users_count
                rating
                ratings_count
                book_series {
                    position
                    series {
                        id
                        name
                        slug
                        books_count
                    }
                }
            }
        }
    `;
    
    let data = await executeQuery(query, { title: titleCase });
    
    if (!data?.books?.length && titleCase !== title.trim()) {
        data = await executeQuery(query, { title: title.trim() });
    }
    
    if (!data?.books?.[0]) return null;
    
    const book = data.books[0];
    
    return {
        id: book.id,
        slug: book.slug,
        title: book.title,
        subtitle: book.subtitle,
        description: book.description,
        authors: [{ name: extractAuthor(book.cached_contributors) }],
        cover: book.cached_image?.url || null,
        rating: book.rating || 0,
        ratingsCount: book.ratings_count || 0,
        usersCount: book.users_count || 0,
        pages: book.pages,
        releaseDate: book.release_date,
        series: book.book_series?.[0] ? {
            id: book.book_series[0].series?.id,
            name: book.book_series[0].series?.name,
            slug: book.book_series[0].series?.slug,
            position: book.book_series[0].position,
            totalBooks: book.book_series[0].series?.books_count
        } : null,
        source: 'hardcover'
    };
};

/**
 * Get author by ID
 */
const getAuthorById = async (authorId) => {
    const query = `
        query GetAuthor($authorId: Int!) {
            authors(where: {id: {_eq: $authorId}}, limit: 1) {
                id
                name
                slug
                bio
                cached_image
                contributions(limit: 30) {
                    book {
                        id
                        slug
                        title
                        cached_image
                        rating
                        users_count
                    }
                }
            }
        }
    `;
    
    const data = await executeQuery(query, { authorId: parseInt(authorId) });
    
    if (!data?.authors?.[0]) return null;
    
    const author = data.authors[0];
    
    return {
        id: author.id,
        name: author.name,
        slug: author.slug,
        bio: author.bio,
        image: author.cached_image?.url,
        books: author.contributions?.map(c => ({
            id: c.book.id,
            slug: c.book.slug,
            title: c.book.title,
            cover: c.book.cached_image?.url,
            rating: c.book.rating || 0,
            usersCount: c.book.users_count || 0
        })) || []
    };
};

/**
 * Get series by ID
 */
const getSeriesById = async (seriesId) => {
    const query = `
        query GetSeries($seriesId: Int!) {
            series(where: {id: {_eq: $seriesId}}, limit: 1) {
                id
                name
                slug
                books_count
                book_series(order_by: {position: asc}) {
                    position
                    book {
                        id
                        slug
                        title
                        cached_image
                        rating
                        users_count
                    }
                }
            }
        }
    `;
    
    const data = await executeQuery(query, { seriesId: parseInt(seriesId) });
    
    if (!data?.series?.[0]) return null;
    
    const series = data.series[0];
    
    return {
        id: series.id,
        name: series.name,
        slug: series.slug,
        totalBooks: series.books_count,
        books: series.book_series?.map(bs => ({
            position: bs.position,
            id: bs.book.id,
            slug: bs.book.slug,
            title: bs.book.title,
            cover: bs.book.cached_image?.url,
            rating: bs.book.rating || 0,
            usersCount: bs.book.users_count || 0
        })) || []
    };
};

/**
 * Get popular books
 */
const getPopularBooks = async (limit = 30) => {
    const query = `
        query GetPopular {
            books(limit: ${limit}, order_by: {users_count: desc}) {
                id
                slug
                title
                cached_image
                cached_contributors
                rating
                ratings_count
                users_count
            }
        }
    `;
    
    const data = await executeQuery(query);
    
    if (!data?.books) return [];
    
    return data.books.map(book => ({
        id: book.id,
        slug: book.slug,
        title: book.title,
        cover: book.cached_image?.url,
        author: extractAuthor(book.cached_contributors),
        rating: book.rating || 0,
        ratingsCount: book.ratings_count || 0,
        usersCount: book.users_count || 0,
        source: 'hardcover'
    }));
};

// Helper: Extract author from cached_contributors
const extractAuthor = (cachedContributors) => {
    if (!cachedContributors) return 'Unknown Author';
    try {
        if (typeof cachedContributors === 'string') {
            const parsed = JSON.parse(cachedContributors);
            return parsed[0]?.author?.name || 'Unknown Author';
        }
        if (Array.isArray(cachedContributors)) {
            return cachedContributors[0]?.author?.name || 'Unknown Author';
        }
        return 'Unknown Author';
    } catch {
        return 'Unknown Author';
    }
};

module.exports = {
    searchBooks,
    findBookByTitle,
    getBookById,
    getAuthorById,
    getSeriesById,
    getPopularBooks
};
