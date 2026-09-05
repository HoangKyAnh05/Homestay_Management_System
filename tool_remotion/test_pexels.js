async function testPexelsScrape(query) {
  try {
    const res = await fetch(`https://www.pexels.com/search/videos/${encodeURIComponent(query)}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    // Look for video links (e.g. video-files or mp4)
    const matches = [...html.matchAll(/(https:\/\/[^"'\s]+\.mp4[^"'\s]*)/gi)];
    console.log('Pexels mp4 matches for', query, ':', matches.length);
    if (matches.length > 0) {
      console.log('Sample mp4:', matches[0][1]);
    }
  } catch (e) {
    console.error(e);
  }
}
testPexelsScrape('cooking');
