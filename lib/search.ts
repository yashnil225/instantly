export async function webSearch(query: string) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        console.warn('TAVILY_API_KEY not set. Skipping web research.');
        return '';
    }

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: 'basic',
                max_results: 3
            })
        });

        if (!response.ok) return '';
        const data = await response.json();
        return data.results.map((r: any) => `${r.title}: ${r.content}`).join('\n\n');
    } catch (error) {
        console.error('Search error:', error);
        return '';
    }
}
