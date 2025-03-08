const fetchHandleRedirect = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (response.redirected) {
        window.location.href = response.url;
        throw new Error("Redirecting..."); // Throw an error to stop further processing
    }
    return response;
};

export default fetchHandleRedirect;